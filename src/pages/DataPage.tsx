import { ExportImportPanel } from '../components/ExportImportPanel';

interface DataPageProps {
  onBack: () => void;
  onImported: () => void;
}

export function DataPage({ onBack, onImported }: DataPageProps) {
  return (
    <main className="screen">
      <header className="top-bar">
        <button className="link-button" type="button" onClick={onBack}>
          Home
        </button>
        <span>Data</span>
      </header>
      <ExportImportPanel onImported={onImported} />
    </main>
  );
}
