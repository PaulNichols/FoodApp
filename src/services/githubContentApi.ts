import type { StorageSettings } from '../models/foodLog';

interface PutContentRequest {
  path: string;
  message: string;
  content: Blob;
}

interface GitHubContentResponse {
  sha: string;
  content?: string;
  encoding?: string;
}

export interface GitHubTreeItem {
  path: string;
  sha: string;
  type: 'blob' | 'tree' | string;
}

interface GitHubTreeResponse {
  tree: GitHubTreeItem[];
  truncated: boolean;
}

const maxGitHubWriteAttempts = 3;
const retryDelayMs = 700;

const apiUrl = (settings: StorageSettings, path = ''): string => {
  const encodedPath = path
    .split('/')
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join('/');
  const suffix = encodedPath ? `/contents/${encodedPath}` : '';

  return `https://api.github.com/repos/${encodeURIComponent(settings.githubOwner)}/${encodeURIComponent(
    settings.githubRepo,
  )}${suffix}`;
};

export const testRepositoryAccess = async (settings: StorageSettings, token: string): Promise<void> => {
  const response = await fetch(apiUrl(settings), {
    headers: githubHeaders(token),
  });

  if (!response.ok) {
    throw createGitHubError(response.status);
  }
};

export const getContentJson = async <T>(settings: StorageSettings, token: string, path: string): Promise<T> => {
  const response = await fetch(`${apiUrl(settings, path)}?ref=${encodeURIComponent(settings.branch)}`, {
    headers: githubHeaders(token),
  });

  if (response.status === 404) {
    throw new Error(`GitHub file not found: ${path}`);
  }

  if (!response.ok) {
    throw createGitHubError(response.status);
  }

  const body = (await response.json()) as GitHubContentResponse;

  if (body.encoding !== 'base64' || !body.content) {
    throw new Error(`GitHub returned an unexpected file response for ${path}.`);
  }

  return JSON.parse(decodeBase64(body.content)) as T;
};

export const putContentFile = async (
  settings: StorageSettings,
  token: string,
  request: PutContentRequest,
): Promise<void> => {
  const content = await blobToBase64(request.content);

  for (let attempt = 1; attempt <= maxGitHubWriteAttempts; attempt += 1) {
    const existingSha = await getExistingSha(settings, token, request.path);
    const payload: Record<string, unknown> = {
      message: request.message,
      content,
      branch: settings.branch,
    };

    if (existingSha) {
      payload.sha = existingSha;
    }

    const response = await fetch(apiUrl(settings, request.path), {
      method: 'PUT',
      headers: githubHeaders(token),
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      return;
    }

    if (response.status === 409 && attempt < maxGitHubWriteAttempts) {
      await waitForRetry(attempt);
      continue;
    }

    throw createGitHubError(response.status);
  }
};

export const listRepositoryTree = async (settings: StorageSettings, token: string): Promise<GitHubTreeItem[]> => {
  const response = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(settings.githubOwner)}/${encodeURIComponent(
      settings.githubRepo,
    )}/git/trees/${encodeURIComponent(settings.branch)}?recursive=1`,
    {
      headers: githubHeaders(token),
    },
  );

  if (!response.ok) {
    throw createGitHubError(response.status);
  }

  const body = (await response.json()) as GitHubTreeResponse;

  if (body.truncated) {
    throw new Error('GitHub returned a truncated repository tree. Cleanup could not run safely.');
  }

  return body.tree;
};

export const deleteContentFile = async (
  settings: StorageSettings,
  token: string,
  path: string,
  sha: string,
  message: string,
): Promise<void> => {
  let currentSha = sha;

  for (let attempt = 1; attempt <= maxGitHubWriteAttempts; attempt += 1) {
    const response = await fetch(apiUrl(settings, path), {
      method: 'DELETE',
      headers: githubHeaders(token),
      body: JSON.stringify({
        message,
        sha: currentSha,
        branch: settings.branch,
      }),
    });

    if (response.ok || response.status === 404) {
      return;
    }

    if (response.status === 409 && attempt < maxGitHubWriteAttempts) {
      const latestSha = await getExistingSha(settings, token, path);

      if (!latestSha) {
        return;
      }

      currentSha = latestSha;
      await waitForRetry(attempt);
      continue;
    }

    throw createGitHubError(response.status);
  }
};

const getExistingSha = async (settings: StorageSettings, token: string, path: string): Promise<string | null> => {
  const response = await fetch(`${apiUrl(settings, path)}?ref=${encodeURIComponent(settings.branch)}`, {
    headers: githubHeaders(token),
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw createGitHubError(response.status);
  }

  const body = (await response.json()) as GitHubContentResponse;
  return body.sha;
};

const githubHeaders = (token: string): HeadersInit => ({
  Accept: 'application/vnd.github+json',
  Authorization: `Bearer ${token}`,
  'X-GitHub-Api-Version': '2022-11-28',
});

const createGitHubError = (status: number): Error => {
  if (status === 401 || status === 403) {
    return new Error('GitHub rejected the token. Check that it is valid and has repository contents read/write access.');
  }

  if (status === 404) {
    return new Error('GitHub repository or branch was not found, or the token cannot access it.');
  }

  if (status === 409) {
    return new Error('GitHub is still processing a recent save. Wait a few seconds and tap Save again.');
  }

  return new Error(`GitHub request failed with status ${status}.`);
};

const waitForRetry = (attempt: number): Promise<void> =>
  new Promise((resolve) => {
    window.setTimeout(resolve, retryDelayMs * attempt);
  });

const blobToBase64 = async (blob: Blob): Promise<string> => {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';

  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  return btoa(binary);
};

const decodeBase64 = (value: string): string => {
  const binary = atob(value.replace(/\n/g, ''));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));

  return new TextDecoder().decode(bytes);
};
