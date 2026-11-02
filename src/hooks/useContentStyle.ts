import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { common } from '@/theme';

/** Marge sous le dernier élément, en plus de la zone occupée par la barre de navigation du téléphone */
const EXTRA_BOTTOM_SPACE = 32;

/** Style du contenu d'un écran qui défile : rien ne reste caché sous les boutons du téléphone */
export function useContentStyle() {
  const { bottom } = useSafeAreaInsets();
  return [common.content, { paddingBottom: bottom + EXTRA_BOTTOM_SPACE }];
}
