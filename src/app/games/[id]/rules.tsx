import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { getGame } from '@/data/games';
import { useContentStyle } from '@/hooks/useContentStyle';
import { colors, common } from '@/theme';

export default function RulesScreen() {
  const contentStyle = useContentStyle();
  const { id } = useLocalSearchParams<{ id: string }>();
  const game = getGame(id);

  if (!game) return <Text style={common.content}>Jeu introuvable</Text>;

  return (
    <ScrollView style={common.screen} contentContainerStyle={contentStyle}>
      <Stack.Screen options={{ title: `Règles · ${game.name}` }} />
      {game.rules.map((section) => (
        <View key={section.title} style={[common.card, styles.section]}>
          <Text style={common.title}>{section.title}</Text>
          {section.body && <Text style={styles.body}>{section.body}</Text>}
          {section.items?.map((item) => {
            // Les étapes numérotées (« 1. … ») gardent leur numéro au lieu d'une puce
            const step = /^(\d+)\.\s+(.*)$/s.exec(item);
            return (
              <View key={item} style={styles.item}>
                <Text style={[styles.body, styles.bullet]}>{step ? `${step[1]}.` : '•'}</Text>
                <Text style={[styles.body, styles.itemText]}>{step ? step[2] : item}</Text>
              </View>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  section: { gap: 6 },
  body: { fontSize: 16, lineHeight: 23, color: colors.text },
  item: { flexDirection: 'row', gap: 8 },
  bullet: { minWidth: 14, color: colors.primary, fontWeight: '700' },
  itemText: { flex: 1 },
});
