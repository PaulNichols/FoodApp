import { useState } from 'react';
import type { StorageSettings } from '../models/foodLog';
import type { LocalFoodLogRepository } from '../repositories/LocalFoodLogRepository';
import { testRepositoryAccess } from '../services/githubContentApi';

interface SettingsPageProps {
  settings: StorageSettings;
  githubToken: string;
  localRepository: LocalFoodLogRepository;
  onSave: (settings: StorageSettings, token: string) => void;
}

export function SettingsPage({ settings, githubToken, localRepository, onSave }: SettingsPageProps) {
  const [draft, setDraft] = useState(settings);
  const [token, setToken] = useState(githubToken);
  const [status, setStatus] = useState('Settings loaded.');

  const save = () => {
    onSave(draft, token);
    setStatus('Settings saved. Token is stored in sessionStorage only.');
  };

  const testConnection = async () => {
    if (!token.trim()) {
      setStatus('Enter a fine-grained GitHub token before testing.');
      return;
    }

    try {
      await testRepositoryAccess(draft, token);
      setStatus('GitHub connection works for this repository.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'GitHub connection failed.');
    }
  };

  const forgetToken = () => {
    setToken('');
    onSave(draft, '');
    setStatus('Token forgotten from this browser session.');
  };

  const clearLocalData = async () => {
    const confirmed = window.confirm('Clear all local food logs and photos on this device?');

    if (!confirmed) {
      return;
    }

    await localRepository.clearAll();
    setStatus('Local food logs and photos were cleared from this device.');
  };

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-title">
          <h2>Storage</h2>
        </div>

        <fieldset className="segmented">
          <legend>Storage mode</legend>
          <label>
            <input
              type="radio"
              name="mode"
              checked={draft.mode === 'local'}
              onChange={() => setDraft({ ...draft, mode: 'local' })}
            />
            Local only
          </label>
          <label>
            <input
              type="radio"
              name="mode"
              checked={draft.mode === 'github'}
              onChange={() => setDraft({ ...draft, mode: 'github' })}
            />
            GitHub repo
          </label>
        </fieldset>

        <p className="privacy-note">
          GitHub repo mode is the normal path for weekly Codex analysis because every save updates repository JSON and
          photos. Local-only mode keeps data on this device for offline drafting or backup use.
        </p>
      </section>

      <section className="panel">
        <div className="panel-title">
          <h2>GitHub repository</h2>
        </div>

        <label className="field">
          <span>Owner</span>
          <input value={draft.githubOwner} onChange={(event) => setDraft({ ...draft, githubOwner: event.target.value })} />
        </label>
        <label className="field">
          <span>Repository</span>
          <input value={draft.githubRepo} onChange={(event) => setDraft({ ...draft, githubRepo: event.target.value })} />
        </label>
        <label className="field">
          <span>Branch</span>
          <input value={draft.branch} onChange={(event) => setDraft({ ...draft, branch: event.target.value || 'main' })} />
        </label>
        <label className="field">
          <span>Fine-grained token</span>
          <input
            type="password"
            value={token}
            autoComplete="off"
            onChange={(event) => setToken(event.target.value)}
          />
        </label>

        <p className="privacy-note">
          The token is never bundled into the site, never logged, and is stored in sessionStorage by default. Use a token
          limited to contents read/write for this single repository.
        </p>

        <div className="action-grid">
          <button type="button" onClick={save}>
            Save settings
          </button>
          <button type="button" className="secondary" onClick={() => void testConnection()}>
            Test connection
          </button>
          <button type="button" className="secondary" onClick={forgetToken}>
            Forget token
          </button>
          <button type="button" className="danger-button" onClick={() => void clearLocalData()}>
            Clear local data
          </button>
        </div>

        <p role="status" className="status">
          {status}
        </p>
      </section>
    </div>
  );
}
