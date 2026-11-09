import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Chip } from '@/components/Chip';
import { CoinFlip } from '@/components/tools/CoinFlip';
import { Dice } from '@/components/tools/Dice';
import { FirstPlayer, type Contestant } from '@/components/tools/FirstPlayer';
import { Timer } from '@/components/tools/Timer';
import { useContentStyle } from '@/hooks/useContentStyle';
import { useMatches } from '@/store/matches';
import { common } from '@/theme';

type Tool = 'dice' | 'timer' | 'first' | 'coin';

const TOOLS: { id: Tool; label: string }[] = [
  { id: 'dice', label: '🎲 Dés' },
  { id: 'timer', label: '⏳ Sablier' },
  { id: 'first', label: '👑 Qui commence ?' },
  { id: 'coin', label: '🪙 Pile ou face' },
];

function isTool(value: string | undefined): value is Tool {
  return TOOLS.some((tool) => tool.id === value);
}

/** Boîte à outils de soirée jeux ; depuis une partie, le tirage reprend ses joueurs */
export default function ToolsScreen() {
  const contentStyle = useContentStyle();
  const params = useLocalSearchParams<{ matchId?: string; tool?: string }>();
  const { matches } = useMatches();
  const [tool, setTool] = useState<Tool>(isTool(params.tool) ? params.tool : 'dice');

  const match = params.matchId ? matches.find((candidate) => candidate.id === params.matchId) : undefined;
  const matchPlayers: Contestant[] | undefined = match?.players.map((name, index) => ({
    key: `${index}-${name}`,
    name,
    playerId: match.playerIds?.[index],
  }));

  return (
    <ScrollView style={common.screen} contentContainerStyle={contentStyle} keyboardShouldPersistTaps="handled">
      <View style={styles.tabs}>
        {TOOLS.map(({ id, label }) => (
          <Chip key={id} label={label} selected={tool === id} onPress={() => setTool(id)} />
        ))}
      </View>
      {/* Les outils restent montés : le sablier continue quand on passe aux dés */}
      <View style={tool !== 'dice' && styles.hidden}>
        <Dice />
      </View>
      <View style={tool !== 'timer' && styles.hidden}>
        <Timer />
      </View>
      <View style={tool !== 'first' && styles.hidden}>
        <FirstPlayer initial={matchPlayers} />
      </View>
      <View style={tool !== 'coin' && styles.hidden}>
        <CoinFlip />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hidden: { display: 'none' },
});
