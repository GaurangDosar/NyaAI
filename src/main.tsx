import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import { initializeStorage } from './lib/storage-utils.ts'
import './index.css'

// Initialize and check storage before rendering
initializeStorage();

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
