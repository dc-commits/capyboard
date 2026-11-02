import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Chip } from '@/components/Chip';
import type { RuleSection } from '@/data/games';
import { useContentStyle } from '@/hooks/useContentStyle';
import { useGames } from '@/store/games';
import { colors, common } from '@/theme';

/** `null` : règles du jeu de base ; sinon l'identifiant de l'extension affichée */
type RulesTab = string | null;

export default function RulesScreen() {
  const { getGame } = useGames();
  const contentStyle = useContentStyle();
  const { id } = useLocalSearchParams<{ id: string }>();
  const game = getGame(id);
  const [tab, setTab] = useState<RulesTab>(null);

  if (!game) return <Text style={common.content}>Jeu introuvable</Text>;

  const expansion = game.expansions?.find((candidate) => candidate.id === tab);
  const sections = expansion ? expansion.rules : game.rules;

  return (
    <ScrollView style={common.screen} contentContainerStyle={contentStyle}>
      <Stack.Screen options={{ title: `Règles · ${game.name}` }} />
      {game.expansions && game.expansions.length > 0 && (
        <View style={styles.tabs}>
          <Chip label="Jeu de base" selected={tab === null} onPress={() => setTab(null)} />
          {game.expansions.map((candidate) => (
            <Chip
              key={candidate.id}
              label={`${candidate.emoji} ${candidate.name}`}
              selected={tab === candidate.id}
              onPress={() => setTab(candidate.id)}
            />
          ))}
        </View>
      )}
      {sections.map((section) => (
        <RuleSectionCard key={section.title} section={section} />
      ))}
    </ScrollView>
  );
}

function RuleSectionCard({ section }: { section: RuleSection }) {
  return (
    <View style={[common.card, styles.section]}>
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
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  section: { gap: 6 },
  body: { fontSize: 16, lineHeight: 23, color: colors.text },
  item: { flexDirection: 'row', gap: 8 },
  bullet: { minWidth: 14, color: colors.primary, fontWeight: '700' },
  itemText: { flex: 1 },
});
