import { StyleSheet, Text, View } from 'react-native';

type Props = {
  avatar: string;
  color: string;
  size?: number;
};

export function Avatar({ avatar, color, size = 40 }: Props) {
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      <Text style={{ fontSize: size * 0.55 }}>{avatar}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
});
