import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '@react-native-google-signin/google-signin';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { downloadBackup, findBackup, uploadBackup, type RemoteBackup } from '@/backup/drive';
import { describeGoogleError, googleAvailable, restoreSession, signIn, signOut } from '@/backup/google';
import { createSnapshot, fingerprint, isEmpty, restoreSnapshot } from '@/backup/snapshot';

type BackupSettings = {
  auto: boolean;
  /** Fichier du Drive lié à ce téléphone : tant qu'il est vide, rien n'est envoyé automatiquement */
  fileId: string | null;
  lastBackupAt: string | null;
  lastFingerprint: string | null;
};

/** Hors du préfixe `capyboard/` : ces réglages propres au téléphone ne sont pas sauvegardés */
const STORAGE_KEY = 'capyboard-backup/v1';

const DEFAULT_SETTINGS: BackupSettings = {
  auto: true,
  fileId: null,
  lastBackupAt: null,
  lastFingerprint: null,
};

export type ConnectResult =
  | { status: 'cancelled' }
  /** Pas encore de sauvegarde dans ce Drive : la première vient d'être faite */
  | { status: 'saved' }
  /** Une sauvegarde existe déjà : à la personne de choisir entre la restaurer et la remplacer */
  | { status: 'existing'; remote: RemoteBackup; localEmpty: boolean };

type BackupContextValue = {
  available: boolean;
  user: User['user'] | null;
  settings: BackupSettings;
  busy: boolean;
  error: string | null;
  connect: () => Promise<ConnectResult>;
  disconnect: () => Promise<void>;
  backupNow: () => Promise<void>;
  /** Remplace les données du téléphone par la sauvegarde du Drive, puis relance l'app */
  restore: () => Promise<void>;
  findRemote: () => Promise<RemoteBackup | null>;
  setAuto: (auto: boolean) => void;
};

const BackupContext = createContext<BackupContextValue | null>(null);

export function BackupProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User['user'] | null>(null);
  const [settings, setSettings] = useState<BackupSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Les envois automatiques lisent les réglages sans attendre un nouveau rendu
  const settingsRef = useRef(settings);
  const busyRef = useRef(false);

  const updateSettings = useCallback((patch: Partial<BackupSettings>) => {
    settingsRef.current = { ...settingsRef.current, ...patch };
    setSettings(settingsRef.current);
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settingsRef.current));
  }, []);

  /** Évite deux opérations Drive en même temps */
  const run = useCallback(async <T,>(task: () => Promise<T>): Promise<T> => {
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      return await task();
    } catch (caught) {
      setError(describeGoogleError(caught));
      throw caught;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, []);

  const upload = useCallback(
    async (fileId: string | null) => {
      const snapshot = await createSnapshot();
      const remote = await uploadBackup(snapshot, fileId);
      updateSettings({
        fileId: remote.id,
        lastBackupAt: remote.modifiedTime,
        lastFingerprint: fingerprint(snapshot),
      });
    },
    [updateSettings],
  );

  /** Envoi automatique, seulement si les données ont changé depuis la dernière sauvegarde */
  const autoBackup = useCallback(async () => {
    const current = settingsRef.current;
    if (!user || !current.auto || !current.fileId || busyRef.current) return;
    const snapshot = await createSnapshot();
    if (fingerprint(snapshot) === current.lastFingerprint) return;
    await run(() => upload(current.fileId)).catch(() => undefined);
  }, [user, run, upload]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          settingsRef.current = {
            ...DEFAULT_SETTINGS,
            ...(JSON.parse(raw) as Partial<BackupSettings>),
          };
          setSettings(settingsRef.current);
        }
      })
      .finally(() => setLoaded(true));
    restoreSession()
      .then((session) => setUser(session?.user ?? null))
      .catch(() => setUser(null));
  }, []);

  // Au lancement (rattrape un envoi raté) puis à chaque passage de l'app en arrière-plan
  useEffect(() => {
    if (!loaded || !user) return;
    void autoBackup();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background') void autoBackup();
    });
    return () => subscription.remove();
  }, [loaded, user, autoBackup]);

  const value = useMemo<BackupContextValue>(
    () => ({
      available: googleAvailable,
      user,
      settings,
      busy,
      error,
      connect: () =>
        run(async () => {
          const session = await signIn();
          if (!session) return { status: 'cancelled' };
          setUser(session.user);
          const remote = await findBackup();
          if (remote)
            return {
              status: 'existing',
              remote,
              localEmpty: isEmpty(await createSnapshot()),
            };
          await upload(null);
          return { status: 'saved' };
        }),
      disconnect: () =>
        run(async () => {
          await signOut();
          setUser(null);
          updateSettings({ fileId: null });
        }),
      backupNow: () =>
        run(async () => {
          // Un fichier supprimé du Drive entre-temps est recréé
          const remote = await findBackup();
          await upload(remote?.id ?? null);
        }),
      restore: () =>
        run(async () => {
          const remote = await findBackup();
          if (!remote) throw new Error('Aucune sauvegarde trouvée dans le Drive.');
          const snapshot = await downloadBackup(remote.id);
          updateSettings({
            fileId: remote.id,
            lastBackupAt: remote.modifiedTime,
            lastFingerprint: fingerprint(snapshot),
          });
          await restoreSnapshot(snapshot);
        }),
      findRemote: () => run(findBackup),
      setAuto: (auto) => updateSettings({ auto }),
    }),
    [user, settings, busy, error, run, upload, updateSettings],
  );

  return <BackupContext.Provider value={value}>{children}</BackupContext.Provider>;
}

export function useBackup(): BackupContextValue {
  const context = useContext(BackupContext);
  if (!context) throw new Error('useBackup must be used inside BackupProvider');
  return context;
}
