import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { useContentStyle } from '@/hooks/useContentStyle';
import { colors, common } from '@/theme';
import { updatesEnabled } from '@/utils/updates';

function formatDate(date: Date): string {
  return date.toLocaleString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AboutScreen() {
  const contentStyle = useContentStyle();
  const { currentlyRunning, isChecking, isDownloading, isUpdatePending, lastCheckForUpdateTimeSinceRestart } = Updates.useUpdates();
  const [message, setMessage] = useState<string | null>(null);

  const checkForUpdate = async () => {
    setMessage(null);
    try {
      const result = await Updates.checkForUpdateAsync();
      if (!result.isAvailable) {
        setMessage('Tu as déjà la dernière version 🎉');
        return;
      }
      await Updates.fetchUpdateAsync();
    } catch (error) {
      setMessage(`Impossible de vérifier pour l’instant (${error instanceof Error ? error.message : String(error)}).`);
    }
  };

  const busy = isChecking || isDownloading;

  return (
    <ScrollView style={common.screen} contentContainerStyle={contentStyle}>
      <View style={[common.card, styles.header]}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          accessibilityLabel="Capy Board"
          accessibilityIgnoresInvertColors
        />
        <Text style={common.subtitle}>Version {Constants.expoConfig?.version ?? '–'}</Text>
      </View>

      <Text style={common.sectionTitle}>Mises à jour</Text>
      <View style={[common.card, styles.updates]}>
        {!updatesEnabled ? (
          <Text style={styles.body}>
            Les mises à jour à distance ne sont disponibles que dans l’app installée (APK), pas dans Expo Go ni l’aperçu de développement.
          </Text>
        ) : (
          <>
            <Text style={styles.body}>
              {currentlyRunning.isEmbeddedLaunch || !currentlyRunning.createdAt
                ? 'Version d’origine de l’app installée.'
                : `Mise à jour du ${formatDate(currentlyRunning.createdAt)}.`}
            </Text>
            {lastCheckForUpdateTimeSinceRestart && (
              <Text style={common.subtitle}>Dernière vérification : {formatDate(lastCheckForUpdateTimeSinceRestart)}</Text>
            )}

            {isUpdatePending ? (
              <>
                <Text style={styles.ready}>✨ Une nouvelle version est prête.</Text>
                <Button label="Redémarrer maintenant" onPress={() => void Updates.reloadAsync()} />
              </>
            ) : (
              <Button
                label={isDownloading ? 'Téléchargement…' : isChecking ? 'Vérification…' : 'Vérifier les mises à jour'}
                disabled={busy}
                onPress={() => void checkForUpdate()}
              />
            )}
            {busy && <ActivityIndicator color={colors.primary} />}
            {message && <Text style={common.subtitle}>{message}</Text>}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: 4 },
  logo: { width: 160, height: 161 },
  updates: { gap: 10 },
  body: { fontSize: 16, lineHeight: 23, color: colors.text },
  ready: { fontSize: 16, fontWeight: '700', color: colors.success },
});
