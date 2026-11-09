import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import { DevSettings, Platform } from 'react-native';
import { updatesEnabled } from '@/utils/updates';

/** Préfixe des données de l'app (parties, joueurs, jeux, favoris) : tout ce qui est sauvegardé */
const DATA_PREFIX = 'capyboard/';

export type Snapshot = {
  app: 'capyboard';
  version: 1;
  createdAt: string;
  /** Clé AsyncStorage → valeur brute */
  data: Record<string, string>;
};

/** Toutes les données de l'app, prêtes à être envoyées */
export async function createSnapshot(): Promise<Snapshot> {
  const keys = (await AsyncStorage.getAllKeys()).filter((key) => key.startsWith(DATA_PREFIX)).sort();
  const entries = await AsyncStorage.multiGet(keys);
  const data: Record<string, string> = {};
  for (const [key, value] of entries) {
    if (value !== null) data[key] = value;
  }
  return {
    app: 'capyboard',
    version: 1,
    createdAt: new Date().toISOString(),
    data,
  };
}

/** Empreinte des données, pour ne pas renvoyer une sauvegarde identique */
export function fingerprint(snapshot: Snapshot): string {
  const text = JSON.stringify(snapshot.data);
  let hash = 5381;
  for (let index = 0; index < text.length; index++) hash = (hash * 33 + text.charCodeAt(index)) | 0;
  return `${text.length}-${hash >>> 0}`;
}

export function parseSnapshot(raw: string): Snapshot {
  const parsed: unknown = JSON.parse(raw);
  if (!isSnapshot(parsed)) throw new Error('Ce fichier n’est pas une sauvegarde Capy Board.');
  return parsed;
}

function isSnapshot(value: unknown): value is Snapshot {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<Snapshot>;
  return (
    candidate.app === 'capyboard' &&
    candidate.version === 1 &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.data === 'object' &&
    candidate.data !== null &&
    Object.entries(candidate.data).every(([key, data]) => key.startsWith(DATA_PREFIX) && typeof data === 'string')
  );
}

/** Le téléphone n'a encore ni partie ni joueur : une restauration ne perdrait rien */
export function isEmpty(snapshot: Snapshot): boolean {
  const count = (key: string) => {
    const raw = snapshot.data[key];
    if (!raw) return 0;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.length : 0;
  };
  return count('capyboard/matches/v1') === 0 && count('capyboard/players/v1') === 0;
}

/** Remplace toutes les données par celles de la sauvegarde, puis relance l'app pour les relire */
export async function restoreSnapshot(snapshot: Snapshot): Promise<void> {
  const current = (await AsyncStorage.getAllKeys()).filter((key) => key.startsWith(DATA_PREFIX));
  await AsyncStorage.multiRemove(current.filter((key) => !(key in snapshot.data)));
  await AsyncStorage.multiSet(Object.entries(snapshot.data));
  if (updatesEnabled) await Updates.reloadAsync();
  else if (Platform.OS === 'web') window.location.reload();
  else DevSettings.reload();
}
