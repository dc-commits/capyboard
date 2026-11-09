import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';
import { colors, common } from '@/theme';

const SIDES = [4, 6, 8, 10, 12, 20];
const COUNTS = [1, 2, 3, 4, 5, 6];
const HISTORY_SIZE = 5;
const ROLL_MS = 600;

/** Position des points d'un d6 dans une grille 3 × 3 (0 = coin haut gauche, 8 = coin bas droit) */
const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

type Roll = { sides: number; values: number[] };

function rollDice(count: number, sides: number): number[] {
  return Array.from({ length: count }, () => 1 + Math.floor(Math.random() * sides));
}

export function Dice() {
  const [sides, setSides] = useState(6);
  const [count, setCount] = useState(2);
  const [values, setValues] = useState<number[]>(() => rollDice(2, 6));
  const [rolling, setRolling] = useState(false);
  const [history, setHistory] = useState<Roll[]>([]);
  const shake = useAnimatedValue(0);
  const timers = useRef<ReturnType<typeof setInterval>[]>([]);

  useEffect(() => () => timers.current.forEach(clearInterval), []);

  const configure = (nextCount: number, nextSides: number) => {
    setCount(nextCount);
    setSides(nextSides);
    setValues(rollDice(nextCount, nextSides));
  };

  const roll = () => {
    if (rolling) return;
    setRolling(true);
    shake.setValue(0);
    Animated.timing(shake, { toValue: 1, duration: ROLL_MS, useNativeDriver: true }).start();
    // Les faces défilent pendant le lancer, puis le résultat se fige
    const flicker = setInterval(() => setValues(rollDice(count, sides)), 70);
    const stop = setTimeout(() => {
      clearInterval(flicker);
      const result = rollDice(count, sides);
      setValues(result);
      setHistory((current) => [{ sides, values: result }, ...current].slice(0, HISTORY_SIZE));
      setRolling(false);
    }, ROLL_MS);
    timers.current = [flicker, stop];
  };

  const rotate = shake.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: ['0deg', '-14deg', '12deg', '-8deg', '0deg'] });
  const total = values.reduce((sum, value) => sum + value, 0);

  return (
    <View style={styles.container}>
      <View style={[common.card, styles.settings]}>
        <Text style={styles.label}>Dés</Text>
        <View style={styles.chips}>
          {COUNTS.map((value) => (
            <Chip key={value} label={String(value)} selected={count === value} onPress={() => configure(value, sides)} />
          ))}
        </View>
        <Text style={styles.label}>Faces</Text>
        <View style={styles.chips}>
          {SIDES.map((value) => (
            <Chip key={value} label={`d${value}`} selected={sides === value} onPress={() => configure(count, value)} />
          ))}
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Lancer, total ${total}`}
        onPress={roll}
        style={[common.card, styles.table]}
      >
        <View style={styles.dice}>
          {values.map((value, index) => (
            <Animated.View key={index} style={{ transform: [{ rotate }] }}>
              {sides === 6 ? <D6 value={value} /> : <NumberDie value={value} sides={sides} />}
            </Animated.View>
          ))}
        </View>
        {count > 1 && <Text style={styles.total}>{rolling ? '…' : `Total : ${total}`}</Text>}
        <Text style={common.subtitle}>Touche les dés pour lancer</Text>
      </Pressable>

      <Button label="🎲 Lancer" disabled={rolling} onPress={roll} />

      {history.length > 0 && (
        <View style={[common.card, styles.history]}>
          <Text style={styles.label}>Derniers lancers</Text>
          {history.map((entry, index) => (
            <Text key={index} style={[styles.historyLine, index === 0 && styles.historyLatest]}>
              {entry.values.length}d{entry.sides} : {entry.values.join(' + ')}
              {entry.values.length > 1 ? ` = ${entry.values.reduce((sum, value) => sum + value, 0)}` : ''}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

function D6({ value }: { value: number }) {
  const pips = PIPS[value] ?? [];
  return (
    <View style={[styles.die, styles.d6]}>
      {Array.from({ length: 9 }, (_, cell) => (
        <View key={cell} style={styles.pipCell}>
          {pips.includes(cell) && <View style={styles.pip} />}
        </View>
      ))}
    </View>
  );
}

function NumberDie({ value, sides }: { value: number; sides: number }) {
  return (
    <View style={[styles.die, styles.numberDie]}>
      <Text style={styles.dieValue}>{value}</Text>
      <Text style={styles.dieSides}>d{sides}</Text>
    </View>
  );
}

const DIE_SIZE = 72;

const styles = StyleSheet.create({
  container: { gap: 12 },
  settings: { gap: 8 },
  label: { fontSize: 13, fontWeight: '700', color: colors.muted, textTransform: 'uppercase' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  table: { alignItems: 'center', gap: 14, paddingVertical: 24 },
  dice: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14 },
  die: {
    width: DIE_SIZE,
    height: DIE_SIZE,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.text,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  d6: { flexDirection: 'row', flexWrap: 'wrap', padding: 8 },
  pipCell: { width: '33.33%', height: '33.33%', alignItems: 'center', justifyContent: 'center' },
  pip: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.text },
  numberDie: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#FBE3C8' },
  dieValue: { fontSize: 30, fontWeight: '800', color: colors.text },
  dieSides: { fontSize: 11, color: colors.muted, marginTop: -2 },
  total: { fontSize: 22, fontWeight: '800', color: colors.primary },
  history: { gap: 4 },
  historyLine: { fontSize: 15, color: colors.muted },
  historyLatest: { color: colors.text, fontWeight: '600' },
});
