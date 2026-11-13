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
import '../styles.css';
import './admin.css';
import { loadConfig } from '../services/config';
import { AdminApp } from './AdminApp';

loadConfig().finally(() => createRoot(document.getElementById('root')!).render(<AdminApp />));
