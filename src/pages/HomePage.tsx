import type { Program } from '../types';

interface HomePageProps {
  programs: Program[];
  onStartProgram: (programId: string) => void;
  onNavigate: (page: 'history' | 'admin' | 'data') => void;
}

export function HomePage({ programs, onStartProgram, onNavigate }: HomePageProps) {
  return (
    <main className="screen home-screen">
      <header className="app-header">
        <p className="eyebrow">Local-first workout log</p>
        <h1>Swim Gym Tracker</h1>
      </header>

      <section className="program-actions" aria-label="Choose a program">
        {programs.map((program) => (
          <button key={program.id} className="program-button" type="button" onClick={() => onStartProgram(program.id)}>
            <span>{program.name}</span>
            <small>{program.description}</small>
          </button>
        ))}
      </section>

      <nav className="quick-nav" aria-label="App sections">
        <button type="button" onClick={() => onNavigate('history')}>
          History
        </button>
        <button type="button" onClick={() => onNavigate('admin')}>
          Admin / Edit Programs
        </button>
        <button type="button" onClick={() => onNavigate('data')}>
          Export / Import Data
        </button>
      </nav>
    </main>
  );
}
