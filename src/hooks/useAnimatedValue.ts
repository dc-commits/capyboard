import { useState } from 'react';
import { Animated } from 'react-native';

/** Valeur animée créée une seule fois ; celui de React Native n'existe pas dans react-native-web */
export function useAnimatedValue(initial: number): Animated.Value {
  const [value] = useState(() => new Animated.Value(initial));
  return value;
}
