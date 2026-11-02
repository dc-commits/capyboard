import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';
import { common } from '@/theme';

/** Marge sous le dernier élément, en plus de la zone occupée par la barre de navigation du téléphone */
const EXTRA_BOTTOM_SPACE = 32;

/**
 * Style du contenu d'un écran qui défile : rien ne reste caché sous les boutons du téléphone,
 * ni sous le clavier (l'app s'affiche bord à bord, le clavier passe donc par-dessus le contenu)
 */
export function useContentStyle() {
  const { bottom } = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  return [common.content, { paddingBottom: Math.max(bottom, keyboardHeight) + EXTRA_BOTTOM_SPACE }];
}
