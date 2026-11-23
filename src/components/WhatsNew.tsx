import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { ChangelogList } from '@/components/ChangelogList';
import { avatarImage } from '@/data/avatars';
import { CHANGELOG, unseenEntries, type ChangelogEntry } from '@/data/changelog';
import { useGames } from '@/store/games';
import { useMatches } from '@/store/matches';
import { usePlayers } from '@/store/players';
import { colors, common } from '@/theme';

/** Hors du préfixe `capyboard/` : propre au téléphone, donc pas dans la sauvegarde Drive */
const STORAGE_KEY = 'capyboard-device/whats-new/v1';
/** Au-delà, la fenêtre renvoie vers l'historique complet */
const MAX_ENTRIES = 2;

/** Fenêtre « Quoi de neuf » au premier lancement après une mise à jour */
export function WhatsNew() {
  const { loaded: gamesLoaded } = useGames();
  const { players, loaded: playersLoaded } = usePlayers();
  const { matches, loaded: matchesLoaded } = useMatches();
  const [entries, setEntries] = useState<ChangelogEntry[] | null>(null);
  const ready = gamesLoaded && playersLoaded && matchesLoaded;
  const hasData = players.length > 0 || matches.length > 0;

  useEffect(() => {
    if (!ready || entries !== null) return;
    void AsyncStorage.getItem(STORAGE_KEY).then((lastSeenId) => {
      if (lastSeenId === null && !hasData) {
        // Première installation : rien de « nouveau » pour quelqu'un qui découvre l'app
        void AsyncStorage.setItem(STORAGE_KEY, CHANGELOG[0].id);
        setEntries([]);
        return;
      }
      // Déjà utilisée avant cette fenêtre : on montre seulement la dernière nouveauté
      setEntries(lastSeenId === null ? CHANGELOG.slice(0, 1) : unseenEntries(lastSeenId));
    });
  }, [ready, entries, hasData]);

  const close = () => {
    setEntries([]);
    void AsyncStorage.setItem(STORAGE_KEY, CHANGELOG[0].id);
  };

  const visible = entries !== null && entries.length > 0;
  const shown = entries?.slice(0, MAX_ENTRIES) ?? [];
  const more = (entries?.length ?? 0) > MAX_ENTRIES;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={[common.card, styles.sheet]}>
          <Image source={avatarImage('capy:magicien')} style={styles.capy} accessibilityIgnoresInvertColors />
          <Text style={styles.title}>Quoi de neuf ?</Text>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <ChangelogList entries={shown} />
          </ScrollView>
          <Button label="C’est parti !" onPress={close} />
          <Pressable
            accessibilityRole="link"
            hitSlop={8}
            onPress={() => {
              close();
              router.push('/whats-new');
            }}
          >
            <Text style={styles.history}>{more ? 'Voir toutes les nouveautés' : 'Tout l’historique'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(31, 27, 22, 0.45)', justifyContent: 'center', padding: 20 },
  sheet: { maxHeight: '85%', gap: 12, alignItems: 'stretch' },
  capy: { width: 96, height: 96, alignSelf: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center' },
  scroll: { flexGrow: 0 },
  scrollContent: { gap: 14 },
  history: { fontSize: 14, fontWeight: '600', color: colors.muted, textAlign: 'center' },
});
