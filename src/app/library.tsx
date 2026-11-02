import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { Button } from '@/components/Button';
import { CatalogRow } from '@/components/CatalogRow';
import { useContentStyle } from '@/hooks/useContentStyle';
import { useGames } from '@/store/games';
import { colors, common } from '@/theme';

/** Catalogue : choisir les jeux de sa bibliothèque, ou en créer */
export default function LibraryScreen() {
  const contentStyle = useContentStyle();
  const { games } = useGames();
  const builtIn = games.filter((game) => !game.custom).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  const custom = games.filter((game) => game.custom).sort((a, b) => a.name.localeCompare(b.name, 'fr'));

  return (
    <ScrollView style={common.screen} contentContainerStyle={contentStyle}>
      <Button label="✏️  Créer un jeu" onPress={() => router.push('/games/new')} />
      <Text style={styles.hint}>
        Un jeu absent du catalogue ? Crée-le avec ses règles : la saisie des scores et les statistiques marcheront comme pour les autres.
      </Text>

      {custom.length > 0 && (
        <>
          <Text style={common.sectionTitle}>Mes jeux créés</Text>
          {custom.map((game) => (
            <CatalogRow key={game.id} game={game} />
          ))}
        </>
      )}

      <Text style={common.sectionTitle}>Catalogue Capy Board</Text>
      {builtIn.map((game) => (
        <CatalogRow key={game.id} game={game} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: 13, color: colors.muted },
});
