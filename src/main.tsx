import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@ui5/webcomponents-react';
import { setDefaultFontLoading } from '@ui5/webcomponents-base/dist/config/Fonts.js';
import { setLanguage } from '@ui5/webcomponents-base/dist/config/Language.js';
// Temas (sap_horizon e sap_horizon_dark), textos e dados de locale carregados sob demanda.
import '@ui5/webcomponents/dist/Assets.js';
import '@ui5/webcomponents-fiori/dist/Assets.js';
import '@ui5/webcomponents-react/dist/Assets.js';
// Ícones citados nos arquivos de docs/ (gerado pelo plugin vite-plugin-doc-icons).
import 'virtual:doc-icons';
import './styles/fonts.css';
import './styles/illustrations.css';
import './styles/app.css';
import './state/store';
import App from './App';

// As fontes 72 vêm de src/assets/fonts, sem CDN.
setDefaultFontLoading(false);
void setLanguage('pt');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
