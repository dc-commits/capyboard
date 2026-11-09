import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import type { RemoteBackup } from '@/backup/drive';
import { Button } from '@/components/Button';
import { useContentStyle } from '@/hooks/useContentStyle';
import { useBackup } from '@/store/backup';
import { colors, common } from '@/theme';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Sauvegarde des parties, joueurs et jeux dans le Google Drive */
export default function BackupScreen() {
  const contentStyle = useContentStyle();
  const { available, user, settings, busy, error, connect, disconnect, backupNow, restore, findRemote, setAuto } = useBackup();
  const [message, setMessage] = useState<string | null>(null);

  const confirmRestore = (remote: RemoteBackup, localEmpty: boolean) => {
    const restoreAction = {
      text: 'Restaurer',
      onPress: () => void restore().catch(() => undefined),
    };
    if (localEmpty) {
      Alert.alert(
        'Sauvegarde trouvée',
        `Une sauvegarde du ${formatDate(remote.modifiedTime)} est dans ton Drive. La restaurer sur ce téléphone ?`,
        [{ text: 'Pas maintenant', style: 'cancel' }, restoreAction],
      );
      return;
    }
    Alert.alert(
      'Sauvegarde trouvée',
      `Ton Drive contient une sauvegarde du ${formatDate(remote.modifiedTime)}. Laquelle garder ?\n\n• Restaurer : les données de ce téléphone sont remplacées par la sauvegarde.\n• Garder ce téléphone : la sauvegarde du Drive est remplacée.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Garder ce téléphone',
          onPress: () =>
            void backupNow().then(
              () => setMessage('Sauvegarde faite ✅'),
              () => undefined,
            ),
        },
        { ...restoreAction, style: 'destructive' },
      ],
    );
  };

  const onConnect = async () => {
    setMessage(null);
    const result = await connect().catch(() => null);
    if (result?.status === 'saved') setMessage('Connecté, et première sauvegarde faite ✅');
    if (result?.status === 'existing') confirmRestore(result.remote, result.localEmpty);
  };

  const onBackup = async () => {
    setMessage(null);
    await backupNow().then(
      () => setMessage('Sauvegarde faite ✅'),
      () => undefined,
    );
  };

  const onRestore = async () => {
    setMessage(null);
    const remote = await findRemote().catch(() => undefined);
    if (remote === null) setMessage('Aucune sauvegarde dans ce Drive pour l’instant.');
    if (!remote) return;
    Alert.alert(
      'Restaurer la sauvegarde ?',
      `Les parties, joueurs et jeux de ce téléphone seront remplacés par la sauvegarde du ${formatDate(remote.modifiedTime)}. L’app redémarrera.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Restaurer',
          style: 'destructive',
          onPress: () => void restore().catch(() => undefined),
        },
      ],
    );
  };

  const onDisconnect = () => {
    Alert.alert('Se déconnecter ?', 'Les sauvegardes déjà faites restent dans ton Drive. Les données de ce téléphone ne bougent pas.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Se déconnecter',
        style: 'destructive',
        onPress: () => void disconnect().catch(() => undefined),
      },
    ]);
  };

  return (
    <ScrollView style={common.screen} contentContainerStyle={contentStyle}>
      <View style={[common.card, styles.card]}>
        <Text style={styles.body}>
          Parties, joueurs, jeux créés, bibliothèque et favoris sont copiés dans un fichier « Capy Board - sauvegarde.json » de ton Google
          Drive. L’app ne voit que ce fichier, pas le reste du Drive.
        </Text>
      </View>

      {!available ? (
        <Text style={common.subtitle}>La sauvegarde Google Drive n’est disponible que dans l’app Android installée.</Text>
      ) : !user ? (
        <View style={[common.card, styles.card]}>
          <Text style={styles.body}>
            Connecte ton compte Google pour sauvegarder automatiquement, et tout retrouver sur un nouveau téléphone.
          </Text>
          <Button label="Se connecter avec Google" disabled={busy} onPress={() => void onConnect()} />
        </View>
      ) : (
        <>
          <View style={[common.card, styles.card]}>
            <Text style={styles.account}>☁️ {user.email}</Text>
            <Text style={common.subtitle}>
              {settings.lastBackupAt
                ? `Dernière sauvegarde : ${formatDate(settings.lastBackupAt)}`
                : 'Pas encore de sauvegarde depuis ce téléphone.'}
            </Text>
          </View>

          <View style={[common.card, styles.row]}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>Sauvegarde automatique</Text>
              <Text style={common.subtitle}>À chaque fois que tu quittes l’app, si quelque chose a changé.</Text>
            </View>
            <Switch
              value={settings.auto}
              onValueChange={setAuto}
              trackColor={{ true: colors.primary, false: colors.border }}
              accessibilityLabel="Sauvegarde automatique"
            />
          </View>

          <Button label="Sauvegarder maintenant" disabled={busy} onPress={() => void onBackup()} />
          <Button label="Restaurer depuis le Drive" variant="secondary" disabled={busy} onPress={() => void onRestore()} />
          <Button label="Se déconnecter" variant="danger" disabled={busy} onPress={onDisconnect} />
        </>
      )}

      {busy && <ActivityIndicator color={colors.primary} />}
      {message && <Text style={styles.success}>{message}</Text>}
      {error && <Text style={styles.error}>{error}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  body: { fontSize: 16, lineHeight: 23, color: colors.text },
  account: { fontSize: 16, fontWeight: '700', color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  success: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.success,
    textAlign: 'center',
  },
  error: { fontSize: 15, color: colors.danger, textAlign: 'center' },
});
