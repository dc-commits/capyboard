import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, Vibration, View } from 'react-native';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { colors, common } from '@/theme';

const PRESETS = [30, 60, 120, 180];
const STEP = 15;
const MIN_SECONDS = 5;
const MAX_SECONDS = 60 * 60;
/** Dernières secondes signalées par l'écran qui clignote */
const WARNING_SECONDS = 5;

function formatTime(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function formatPreset(seconds: number): string {
  return seconds < 60 ? `${seconds} s` : `${seconds / 60} min`;
}

export function Timer() {
  const [duration, setDuration] = useState(60);
  const [remaining, setRemaining] = useState(60_000);
  const [running, setRunning] = useState(false);
  // Heure de fin : le temps restant en découle, sans dériver même si l'app ralentit
  const endAt = useRef(0);

  useEffect(() => {
    if (!running) return;
    const tick = setInterval(() => {
      const left = Math.max(0, endAt.current - Date.now());
      setRemaining(left);
      if (left === 0) {
        setRunning(false);
        Vibration.vibrate([0, 500, 200, 500, 200, 500]);
      }
    }, 100);
    return () => clearInterval(tick);
  }, [running]);

  const choose = (seconds: number) => {
    setRunning(false);
    setDuration(seconds);
    setRemaining(seconds * 1000);
  };

  const start = () => {
    const from = remaining === 0 ? duration * 1000 : remaining;
    endAt.current = Date.now() + from;
    setRemaining(from);
    setRunning(true);
  };

  const finished = remaining === 0;
  const warning = running && remaining <= WARNING_SECONDS * 1000;
  // Clignote une demi-seconde sur deux pendant les dernières secondes
  const flash = warning && Math.floor(remaining / 500) % 2 === 0;
  const level = remaining / (duration * 1000);
  const fresh = !running && remaining === duration * 1000;

  return (
    <View style={styles.container}>
      <View style={[common.card, styles.settings]}>
        <View style={styles.chips}>
          {PRESETS.map((seconds) => (
            <Chip key={seconds} label={formatPreset(seconds)} selected={duration === seconds} onPress={() => choose(seconds)} />
          ))}
        </View>
        <View style={styles.stepper}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Moins ${STEP} secondes`}
            disabled={duration <= MIN_SECONDS}
            onPress={() => choose(Math.max(MIN_SECONDS, duration - STEP))}
            style={styles.stepButton}
          >
            <Text style={styles.stepText}>−{STEP} s</Text>
          </Pressable>
          <Text style={styles.duration}>{formatTime(duration * 1000)}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Plus ${STEP} secondes`}
            disabled={duration >= MAX_SECONDS}
            onPress={() => choose(Math.min(MAX_SECONDS, duration + STEP))}
            style={styles.stepButton}
          >
            <Text style={styles.stepText}>+{STEP} s</Text>
          </Pressable>
        </View>
      </View>

      <View style={[common.card, styles.face, flash && styles.flash, finished && styles.finished]}>
        <View style={styles.glass} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View style={[styles.sand, { height: `${Math.max(0, Math.min(1, level)) * 100}%` }, warning && styles.sandWarning]} />
        </View>
        <Text style={[styles.time, warning && styles.timeWarning, finished && styles.timeFinished]} accessibilityLiveRegion="polite">
          {finished ? '⏰ Temps écoulé !' : formatTime(remaining)}
        </Text>
      </View>

      <View style={styles.actions}>
        <View style={styles.action}>
          {running ? (
            <Button label="⏸ Pause" onPress={() => setRunning(false)} />
          ) : (
            <Button label={fresh || finished ? '▶️ Démarrer' : '▶️ Reprendre'} onPress={start} />
          )}
        </View>
        <View style={styles.action}>
          <Button label="↺ Réinitialiser" variant="secondary" disabled={fresh} onPress={() => choose(duration)} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  settings: { gap: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  stepText: { fontSize: 15, fontWeight: '600', color: colors.text },
  duration: { fontSize: 20, fontWeight: '700', color: colors.text },
  face: { alignItems: 'center', gap: 16, paddingVertical: 24 },
  flash: { backgroundColor: '#F8D3CF', borderColor: colors.danger },
  finished: { backgroundColor: '#F8D3CF', borderColor: colors.danger },
  glass: {
    width: 110,
    height: 160,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: colors.text,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: colors.background,
  },
  sand: { width: '100%', backgroundColor: '#E8B04A' },
  sandWarning: { backgroundColor: colors.danger },
  time: { fontSize: 44, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] },
  timeWarning: { color: colors.danger },
  timeFinished: { fontSize: 28, color: colors.danger },
  actions: { flexDirection: 'row', gap: 12 },
  action: { flex: 1 },
});
