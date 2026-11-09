import { UnauthorizedError, withAccessToken } from '@/backup/google';
import { parseSnapshot, type Snapshot } from '@/backup/snapshot';

const FILE_NAME = 'Capy Board - sauvegarde.json';
const API = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';

export type RemoteBackup = { id: string; modifiedTime: string };

async function call(token: string, url: string, init: RequestInit = {}): Promise<Response> {
  const response = await fetch(url, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${token}` },
  });
  if (response.status === 401) throw new UnauthorizedError('Session Google expirée.');
  if (!response.ok) throw new Error(`Google Drive a répondu ${response.status} : ${await response.text()}`);
  return response;
}

/** La sauvegarde la plus récente rangée par l'app dans le Drive */
export function findBackup(): Promise<RemoteBackup | null> {
  return withAccessToken(async (token) => {
    const query = encodeURIComponent(`name = '${FILE_NAME}' and trashed = false`);
    const response = await call(token, `${API}?q=${query}&spaces=drive&orderBy=modifiedTime desc&fields=files(id,modifiedTime)`);
    const { files } = (await response.json()) as { files: RemoteBackup[] };
    return files[0] ?? null;
  });
}

/** Crée le fichier de sauvegarde, ou le remplace s'il existe déjà */
export function uploadBackup(snapshot: Snapshot, existingId: string | null): Promise<RemoteBackup> {
  return withAccessToken(async (token) => {
    const content = JSON.stringify(snapshot);
    if (existingId) {
      const response = await call(token, `${UPLOAD}/${existingId}?uploadType=media&fields=id,modifiedTime`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: content,
      });
      return (await response.json()) as RemoteBackup;
    }
    const boundary = `capyboard-${Date.now()}`;
    const body = [
      `--${boundary}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      JSON.stringify({ name: FILE_NAME, mimeType: 'application/json' }),
      `--${boundary}`,
      'Content-Type: application/json',
      '',
      content,
      `--${boundary}--`,
    ].join('\r\n');
    const response = await call(token, `${UPLOAD}?uploadType=multipart&fields=id,modifiedTime`, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body,
    });
    return (await response.json()) as RemoteBackup;
  });
}

export function downloadBackup(id: string): Promise<Snapshot> {
  return withAccessToken(async (token) => {
    const response = await call(token, `${API}/${id}?alt=media`);
    return parseSnapshot(await response.text());
  });
}
