import {
  GoogleSignin,
  isCancelledResponse,
  isErrorWithCode,
  isNoSavedCredentialFoundResponse,
  statusCodes,
  type User,
} from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

/** Accès aux seuls fichiers créés par l'app dans le Drive : pas au reste */
export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

/** La connexion Google n'existe que dans l'app Android (pas sur le web, ni dans Expo Go) */
export const googleAvailable = Platform.OS === 'android';

let configured = false;

function configure() {
  if (configured) return;
  GoogleSignin.configure({ scopes: [DRIVE_SCOPE] });
  configured = true;
}

/** Compte déjà connecté lors d'un précédent lancement, sans rien afficher */
export async function restoreSession(): Promise<User | null> {
  if (!googleAvailable) return null;
  configure();
  if (!GoogleSignin.hasPreviousSignIn()) return null;
  const response = await GoogleSignin.signInSilently();
  return isNoSavedCredentialFoundResponse(response) ? null : response.data;
}

/** Ouvre le choix du compte Google ; `null` si la personne annule */
export async function signIn(): Promise<User | null> {
  configure();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();
  if (isCancelledResponse(response)) return null;
  if (response.data.scopes.includes(DRIVE_SCOPE)) return response.data;
  // Le Drive a été refusé à la première connexion : on le redemande
  const withDrive = await GoogleSignin.addScopes({ scopes: [DRIVE_SCOPE] });
  if (!withDrive || isCancelledResponse(withDrive) || !withDrive.data.scopes.includes(DRIVE_SCOPE)) {
    await GoogleSignin.signOut();
    throw new Error('L’accès au Drive est nécessaire pour y ranger la sauvegarde.');
  }
  return withDrive.data;
}

export async function signOut(): Promise<void> {
  configure();
  await GoogleSignin.signOut();
}

export class UnauthorizedError extends Error {}

/** Appelle `request` avec un jeton d'accès ; s'il a expiré, en redemande un et réessaie une fois */
export async function withAccessToken<T>(request: (token: string) => Promise<T>): Promise<T> {
  configure();
  const { accessToken } = await GoogleSignin.getTokens();
  try {
    return await request(accessToken);
  } catch (error) {
    if (!(error instanceof UnauthorizedError)) throw error;
    await GoogleSignin.clearCachedAccessToken(accessToken);
    const fresh = await GoogleSignin.getTokens();
    return request(fresh.accessToken);
  }
}

/** Message lisible pour une erreur de connexion Google */
export function describeGoogleError(error: unknown): string {
  if (isErrorWithCode(error)) {
    if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) return 'Les services Google Play ne sont pas disponibles sur ce téléphone.';
    if (error.code === statusCodes.IN_PROGRESS) return 'Une connexion est déjà en cours.';
    // DEVELOPER_ERROR (code 10) : l'app n'est pas déclarée dans Google Cloud (paquet ou empreinte SHA-1)
    if (String(error.code) === '10') return 'Connexion refusée par Google : l’app n’est pas encore déclarée dans Google Cloud.';
  }
  return error instanceof Error ? error.message : String(error);
}
