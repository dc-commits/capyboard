import { Image, StyleSheet, Text, View } from 'react-native';
import { avatarImage } from '@/data/avatars';

type Props = {
  avatar: string;
  color: string;
  size?: number;
};

export function Avatar({ avatar, color, size = 40 }: Props) {
  const image = avatarImage(avatar);
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      {image ? (
        <Image source={image} style={{ width: size * 0.92, height: size * 0.92 }} resizeMode="contain" accessibilityIgnoresInvertColors />
      ) : (
        <Text style={{ fontSize: size * 0.55 }}>{avatar}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
