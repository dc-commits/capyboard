import { Stack, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chip } from '@/components/Chip';
import { SCRIM_FADE_HEIGHT } from '@/components/NavigationBarScrim';
import type { RuleSection } from '@/data/games';
import { useContentStyle } from '@/hooks/useContentStyle';
import { useGames } from '@/store/games';
import { colors, common } from '@/theme';

/** `null` : règles du jeu de base ; sinon l'identifiant de l'extension affichée */
type RulesTab = string | null;

/** En dessous, les règles tiennent sur un écran ou deux : pas besoin de sommaire */
const TOC_MIN_SECTIONS = 4;
/** Défilement à partir duquel le bouton « remonter » apparaît */
const BACK_TO_TOP_OFFSET = 500;
/** Marge au-dessus d'une section quand on y saute, pour ne pas la coller au bord */
const JUMP_MARGIN = 12;

export default function RulesScreen() {
  const { getGame } = useGames();
  const contentStyle = useContentStyle();
  const { bottom } = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const game = getGame(id);
  const [tab, setTab] = useState<RulesTab>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const scroll = useRef<ScrollViewInstance>(null);
  // Position de chaque section dans le contenu, mesurée à l'affichage
  const positions = useRef<Record<number, number>>({});

  if (!game) return <Text style={common.content}>Jeu introuvable</Text>;

  const expansion = game.expansions?.find((candidate) => candidate.id === tab);
  const sections = expansion ? expansion.rules : game.rules;
  const withToc = sections.length >= TOC_MIN_SECTIONS;

  const changeTab = (next: RulesTab) => {
    positions.current = {};
    setTab(next);
    scroll.current?.scrollTo({ y: 0, animated: false });
  };

  const jumpTo = (index: number) => {
    const y = positions.current[index];
    if (y !== undefined) scroll.current?.scrollTo({ y: Math.max(0, y - JUMP_MARGIN), animated: true });
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const visible = event.nativeEvent.contentOffset.y > BACK_TO_TOP_OFFSET;
    if (visible !== showBackToTop) setShowBackToTop(visible);
  };

  return (
    <View style={common.screen}>
      <ScrollView ref={scroll} style={common.screen} contentContainerStyle={contentStyle} onScroll={onScroll} scrollEventThrottle={100}>
        <Stack.Screen options={{ title: `Règles · ${game.name}` }} />
        {game.expansions && game.expansions.length > 0 && (
          <View style={styles.tabs}>
            <Chip label="Jeu de base" selected={tab === null} onPress={() => changeTab(null)} />
            {game.expansions.map((candidate) => (
              <Chip
                key={candidate.id}
                label={`${candidate.emoji} ${candidate.name}`}
                selected={tab === candidate.id}
                onPress={() => changeTab(candidate.id)}
              />
            ))}
          </View>
        )}
        {withToc && (
          <View style={[common.card, styles.toc]}>
            <Text style={styles.tocTitle}>Sommaire</Text>
            {sections.map((section, index) => (
              <Pressable
                key={section.title}
                accessibilityRole="link"
                onPress={() => jumpTo(index)}
                style={({ pressed }) => [styles.tocRow, pressed && styles.pressed]}
              >
                <Text style={styles.tocNumber}>{index + 1}</Text>
                <Text style={styles.tocLabel}>{section.title}</Text>
              </Pressable>
            ))}
          </View>
        )}
        {sections.map((section, index) => (
          <View
            key={`${tab ?? 'base'}-${section.title}`}
            onLayout={(event) => {
              positions.current[index] = event.nativeEvent.layout.y;
            }}
          >
            <RuleSectionCard section={section} number={withToc ? index + 1 : undefined} />
          </View>
        ))}
      </ScrollView>
      {showBackToTop && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Remonter en haut des règles"
          onPress={() => scroll.current?.scrollTo({ y: 0, animated: true })}
          style={({ pressed }) => [styles.backToTop, { bottom: bottom + SCRIM_FADE_HEIGHT }, pressed && styles.pressed]}
        >
          <Text style={styles.backToTopText}>↑</Text>
        </Pressable>
      )}
    </View>
  );
}

function RuleSectionCard({ section, number }: { section: RuleSection; number?: number }) {
  return (
    <View style={[common.card, styles.section]}>
      <Text style={common.title}>{number !== undefined ? `${number}. ${section.title}` : section.title}</Text>
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
  toc: { gap: 2, paddingVertical: 12 },
  tocTitle: { fontSize: 13, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', marginBottom: 4 },
  tocRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  tocNumber: { width: 22, fontSize: 15, fontWeight: '700', color: colors.primary, textAlign: 'right' },
  tocLabel: { flex: 1, fontSize: 16, color: colors.text },
  pressed: { opacity: 0.6 },
  section: { gap: 6 },
  body: { fontSize: 16, lineHeight: 23, color: colors.text },
  item: { flexDirection: 'row', gap: 8 },
  bullet: { minWidth: 14, color: colors.primary, fontWeight: '700' },
  itemText: { flex: 1 },
  backToTop: {
    position: 'absolute',
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  backToTopText: { fontSize: 24, fontWeight: '800', color: colors.primaryText, marginTop: -2 },
});
