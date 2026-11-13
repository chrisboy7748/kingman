import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/cairo/400.css';
import '@fontsource/cairo/500.css';
import '@fontsource/cairo/700.css';
import '@fontsource/cairo/800.css';
import '@fontsource/tajawal/400.css';
import '@fontsource/tajawal/700.css';
import '@fontsource/el-messiri/400.css';
import '@fontsource/el-messiri/700.css';
import '@fontsource/reem-kufi/400.css';
import '@fontsource/reem-kufi/700.css';
import '@fontsource/amiri/400.css';
import '@fontsource/amiri/700.css';
import './styles.css';
import { App } from './App';
import { loadConfig } from './services/config';

loadConfig().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
