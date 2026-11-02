import * as Updates from 'expo-updates';
import { Platform } from 'react-native';

/** Mises à jour à distance utilisables : app installée uniquement (ni Expo Go, ni développement, ni web) */
export const updatesEnabled = Updates.isEnabled && Platform.OS !== 'web';
