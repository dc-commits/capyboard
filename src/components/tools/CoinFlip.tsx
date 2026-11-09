import { useRef, useState } from 'react';
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { avatarImage } from '@/data/avatars';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';
import { colors, common } from '@/theme';

type Side = 'face' | 'pile';

const FLIP_MS = 1100;
/** Demi-tours minimum par lancer */
const HALF_TURNS = 10;
const COIN_SIZE = 150;

export function CoinFlip() {
  const [result, setResult] = useState<Side | null>(null);
  const [flipping, setFlipping] = useState(false);
  const [tally, setTally] = useState<Record<Side, number>>({ face: 0, pile: 0 });
  // Nombre de demi-tours depuis le début : pair = face visible, impair = pile
  const turns = useAnimatedValue(0);
  const position = useRef(0);
  const jump = useAnimatedValue(0);

  const flip = () => {
    if (flipping) return;
    const side: Side = Math.random() < 0.5 ? 'face' : 'pile';
    const target = position.current + HALF_TURNS + ((position.current + HALF_TURNS) % 2 === (side === 'face' ? 0 : 1) ? 0 : 1);
    position.current = target;
    setFlipping(true);
    setResult(null);
    jump.setValue(0);
    Animated.parallel([
      Animated.timing(turns, { toValue: target, duration: FLIP_MS, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(jump, { toValue: 1, duration: FLIP_MS, easing: Easing.linear, useNativeDriver: true }),
    ]).start(() => {
      setFlipping(false);
      setResult(side);
      setTally((current) => ({ ...current, [side]: current[side] + 1 }));
    });
  };

  // Une pièce vue de face : sa largeur suit le cosinus de l'angle, et on change de côté à chaque quart de tour
  const angle = Animated.modulo(turns, 2);
  const scaleX = angle.interpolate({ inputRange: [0, 0.5, 1, 1.5, 2], outputRange: [1, 0.02, 1, 0.02, 1] });
  const faceOpacity = angle.interpolate({ inputRange: [0, 0.499, 0.5, 1.5, 1.501, 2], outputRange: [1, 1, 0, 0, 1, 1] });
  const pileOpacity = angle.interpolate({ inputRange: [0, 0.499, 0.5, 1.5, 1.501, 2], outputRange: [0, 0, 1, 1, 0, 0] });
  const translateY = jump.interpolate({ inputRange: [0, 0.45, 1], outputRange: [0, -90, 0] });

  return (
    <View style={styles.container}>
      <Pressable accessibilityRole="button" accessibilityLabel="Lancer la pièce" onPress={flip} style={[common.card, styles.table]}>
        <Animated.View style={[styles.coin, { transform: [{ translateY }, { scaleX }] }]}>
          <Animated.View style={[styles.side, { opacity: faceOpacity }]}>
            <Image source={avatarImage('capy:zen')} style={styles.capy} accessibilityIgnoresInvertColors />
            <Text style={styles.sideLabel}>FACE</Text>
          </Animated.View>
          <Animated.View style={[styles.side, styles.pile, { opacity: pileOpacity }]}>
            <Text style={styles.orange}>🍊</Text>
            <Text style={styles.sideLabel}>PILE</Text>
          </Animated.View>
        </Animated.View>
        <Text style={result || flipping ? styles.result : common.subtitle} accessibilityLiveRegion="polite">
          {flipping ? '…' : result === 'face' ? 'Face !' : result === 'pile' ? 'Pile !' : 'Touche la pièce pour la lancer'}
        </Text>
      </Pressable>

      <Button label="🪙 Lancer la pièce" disabled={flipping} onPress={flip} />

      {tally.face + tally.pile > 0 && (
        <Text style={[common.subtitle, styles.tally]}>
          Face {tally.face} · Pile {tally.pile}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  table: { alignItems: 'center', gap: 18, paddingTop: 110, paddingBottom: 24, overflow: 'hidden' },
  coin: { width: COIN_SIZE, height: COIN_SIZE },
  side: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: COIN_SIZE / 2,
    backgroundColor: '#F2C14E',
    borderWidth: 6,
    borderColor: '#C8902A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pile: { backgroundColor: '#F5CD6A' },
  capy: { width: 92, height: 92 },
  orange: { fontSize: 64 },
  sideLabel: { fontSize: 12, fontWeight: '800', color: '#7A4E12', letterSpacing: 2 },
  result: { fontSize: 22, fontWeight: '800', color: colors.primary, textAlign: 'center' },
  tally: { textAlign: 'center' },
});
