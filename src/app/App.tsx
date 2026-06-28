import { useMemo, useState } from 'react';
import { DashboardPage } from '../pages/DashboardPage';
import { TodayPage } from '../pages/TodayPage';
import type { StorageSettings } from '../models/foodLog';
import { LocalFoodLogRepository } from '../repositories/LocalFoodLogRepository';
import type { AppRoute } from './routes';

const TOKEN_KEY = 'foodTracker.githubToken';

const foodAppRepositorySettings: StorageSettings = {
  mode: 'github',
  githubOwner: 'PaulNichols',
  githubRepo: 'FoodApp',
  branch: 'main',
};

export function App() {
  const [route, setRoute] = useState<AppRoute>('today');
  const [githubToken, setGithubToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) ?? '');
  const localRepository = useMemo(() => new LocalFoodLogRepository(), []);

  const saveGitHubToken = (nextToken: string) => {
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
          <TodayPage
            settings={foodAppRepositorySettings}
            githubToken={githubToken}
            localRepository={localRepository}
            onGitHubTokenChange={saveGitHubToken}
          />
        )}
        {route === 'dashboard' && <DashboardPage repository={localRepository} />}
      </main>

      <nav className="bottom-nav" aria-label="Primary navigation">
        <button className={route === 'today' ? 'active' : ''} type="button" onClick={() => setRoute('today')}>
          Today
        </button>
        <button className={route === 'dashboard' ? 'active' : ''} type="button" onClick={() => setRoute('dashboard')}>
          Dashboard
        </button>
      </nav>
    </div>
  );
}
