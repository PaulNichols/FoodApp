import { useMemo, useState } from 'react';
import { DashboardPage } from '../pages/DashboardPage';
import { SettingsPage } from '../pages/SettingsPage';
import { TodayPage } from '../pages/TodayPage';
import type { StorageSettings } from '../models/foodLog';
import { LocalFoodLogRepository } from '../repositories/LocalFoodLogRepository';
import type { AppRoute } from './routes';

const SETTINGS_KEY = 'foodTracker.storageSettings';
const TOKEN_KEY = 'foodTracker.githubToken';

const defaultSettings: StorageSettings = {
  mode: 'github',
  githubOwner: 'PaulNichols',
  githubRepo: 'FoodApp',
  branch: 'main',
};

const readSettings = (): StorageSettings => {
  const raw = localStorage.getItem(SETTINGS_KEY);

  if (!raw) {
    return defaultSettings;
  }

  try {
    return { ...defaultSettings, ...(JSON.parse(raw) as Partial<StorageSettings>) };
  } catch {
    return defaultSettings;
  }
};

export function App() {
  const [route, setRoute] = useState<AppRoute>('today');
  const [settings, setSettings] = useState<StorageSettings>(() => readSettings());
  const [githubToken, setGithubToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) ?? '');
  const localRepository = useMemo(() => new LocalFoodLogRepository(), []);

  const saveSettings = (nextSettings: StorageSettings, nextToken: string) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(nextSettings));
    setSettings(nextSettings);
    setGithubToken(nextToken);

    if (nextToken) {
      sessionStorage.setItem(TOKEN_KEY, nextToken);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
    }
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Private daily tracker</p>
          <h1>Food Log</h1>
        </div>
      </header>

      <main className="app-main">
        {route === 'today' && (
          <TodayPage settings={settings} githubToken={githubToken} localRepository={localRepository} />
        )}
        {route === 'dashboard' && <DashboardPage repository={localRepository} />}
        {route === 'settings' && (
          <SettingsPage
            settings={settings}
            githubToken={githubToken}
            localRepository={localRepository}
            onSave={saveSettings}
          />
        )}
      </main>

      <nav className="bottom-nav" aria-label="Primary navigation">
        <button className={route === 'today' ? 'active' : ''} type="button" onClick={() => setRoute('today')}>
          Today
        </button>
        <button className={route === 'dashboard' ? 'active' : ''} type="button" onClick={() => setRoute('dashboard')}>
          Dashboard
        </button>
        <button className={route === 'settings' ? 'active' : ''} type="button" onClick={() => setRoute('settings')}>
          Settings
        </button>
      </nav>
    </div>
  );
}
