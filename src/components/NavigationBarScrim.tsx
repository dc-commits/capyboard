import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Brun du pelage du capybara : les boutons blancs du système ressortent dessus */
const SCRIM_COLOR = '#4A2E1C';
/** Hauteur du fondu au-dessus de la zone des boutons : le contenu doit pouvoir défiler au-delà */
export const SCRIM_FADE_HEIGHT = 56;
/** Bandes superposées qui dessinent le fondu, sans librairie native */
const STEPS = 20;
/** Opacité sous les boutons */
const OPACITY = 0.9;

/**
 * Fond sous la barre de navigation d'Android : l'app s'affiche bord à bord et les boutons du système
 * (blancs) se perdaient sur les cartes blanches. Le contenu se fond dedans ; les touchers passent au travers.
 */
export function NavigationBarScrim() {
  const { bottom } = useSafeAreaInsets();
  if (Platform.OS !== 'android' || bottom === 0) return null;

  return (
    <View pointerEvents="none" style={styles.scrim}>
      <View style={{ height: SCRIM_FADE_HEIGHT }}>
        {Array.from({ length: STEPS }, (_, index) => {
          const t = (index + 1) / (STEPS + 1);
          // Courbe en S : démarre et finit en douceur, sans marche visible en haut ni en bas
          const eased = t * t * (3 - 2 * t);
          return <View key={index} style={[styles.step, { opacity: OPACITY * eased }]} />;
        })}
      </View>
      <View style={[styles.band, { height: bottom }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  step: { flex: 1, backgroundColor: SCRIM_COLOR },
  band: { backgroundColor: SCRIM_COLOR, opacity: OPACITY },
});
