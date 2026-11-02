import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { getGame } from '@/data/games';
import { colors, common } from '@/theme';

export default function RulesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const game = getGame(id);

  if (!game) return <Text style={common.content}>Jeu introuvable</Text>;

  return (
    <ScrollView style={common.screen} contentContainerStyle={common.content}>
      <Stack.Screen options={{ title: `Règles · ${game.name}` }} />
      {game.rules.map((section) => (
        <View key={section.title} style={[common.card, styles.section]}>
          <Text style={common.title}>{section.title}</Text>
          <Text style={styles.body}>{section.body}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  section: { gap: 6 },
  body: { fontSize: 16, lineHeight: 23, color: colors.text },
});
