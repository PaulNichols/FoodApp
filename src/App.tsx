import { useState } from 'react';
import { AdminPage } from './pages/AdminPage';
import { DataPage } from './pages/DataPage';
import { HistoryPage } from './pages/HistoryPage';
import { HomePage } from './pages/HomePage';
import { ProgramPage } from './pages/ProgramPage';
import { WorkoutCompletePage } from './pages/WorkoutCompletePage';
import { storageService } from './services/storageService';
import type { Page, Program, WorkoutEntry } from './types';

export function App() {
  const [programs, setPrograms] = useState<Program[]>(() => storageService.getPrograms());
  const [page, setPage] = useState<Page>('home');
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [completedEntries, setCompletedEntries] = useState<WorkoutEntry[]>([]);

  const selectedProgram = selectedProgramId ? programs.find((program) => program.id === selectedProgramId) : undefined;

  const refreshPrograms = () => {
    setPrograms(storageService.getPrograms());
  };

  const goHome = () => {
    refreshPrograms();
    setSelectedProgramId(null);
    setPage('home');
  };

  const startProgram = (programId: string) => {
    setSelectedProgramId(programId);
    setCompletedEntries([]);
    setPage('program');
  };

  if (page === 'program' && selectedProgram) {
    return (
      <ProgramPage
        program={selectedProgram}
        onBack={goHome}
        onComplete={(entries) => {
          setCompletedEntries(entries);
          setPage('complete');
        }}
      />
    );
  }

  if (page === 'complete') {
    return <WorkoutCompletePage entries={completedEntries} onHome={goHome} onHistory={() => setPage('history')} />;
  }

  if (page === 'history') {
    return <HistoryPage onBack={goHome} />;
  }

  if (page === 'admin') {
    return <AdminPage programs={programs} onProgramsChanged={setPrograms} onBack={goHome} />;
  }

  if (page === 'data') {
    return <DataPage onBack={goHome} onImported={refreshPrograms} />;
  }

  return <HomePage programs={programs} onStartProgram={startProgram} onNavigate={setPage} />;
}
