import { useSyncExternalStore } from 'react';
import { setTheme } from '@ui5/webcomponents-base/dist/config/Theme.js';

/* ---------- localStorage seguro ---------- */
const PREFIX = 'trilha-abap:';
export const storage = {
  get<T>(key: string, fallback: T): T {
    try {
      const v = localStorage.getItem(PREFIX + key);
      return v == null ? fallback : (JSON.parse(v) as T);
    } catch {
      return fallback;
    }
  },
  set(key: string, value: unknown) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      /* armazenamento indisponível: segue sem persistir */
    }
  },
};

/* ---------- pequeno store reativo ---------- */
function createStore<T>(initial: T) {
  let value = initial;
  const subs = new Set<() => void>();
  return {
    get: () => value,
    set(next: T) {
      value = next;
      subs.forEach(f => f());
    },
    subscribe(f: () => void) {
      subs.add(f);
      return () => subs.delete(f);
    },
  };
}

/* ---------- rota (#hash) ---------- */
const readHash = () => decodeURIComponent(location.hash.replace(/^#\/?/, '')) || 'inicio';
const route = createStore(readHash());
addEventListener('hashchange', () => route.set(readHash()));
export const useRoute = () => useSyncExternalStore(route.subscribe, route.get);
export function navigate(id: string) {
  if (readHash() === id) route.set(id);
  location.hash = id;
}

/* ---------- seção da lição visível na tela ---------- */
// A lição atualiza conforme a rolagem; o índice lateral do módulo destaca a seção.
const activeSection = createStore('');
export const useActiveSection = () => useSyncExternalStore(activeSection.subscribe, activeSection.get);
export const setActiveSection = (id: string) => { if (activeSection.get() !== id) activeSection.set(id); };

/** Rola a página até a seção `id` da lição aberta (elemento #s-<id>); sem `id`, volta ao topo. */
export function scrollToSection(id?: string, smooth = true) {
  const behavior: ScrollBehavior = smooth && !reducedMotion() ? 'smooth' : 'auto';
  if (id) document.getElementById(`s-${id}`)?.scrollIntoView({ behavior, block: 'start' });
  else document.querySelector('.page-scroll')?.scrollTo({ top: 0, behavior });
}

/* ---------- progresso das lições ---------- */
const done = createStore<ReadonlySet<string>>(new Set(storage.get<string[]>('done', [])));
export const useDone = () => useSyncExternalStore(done.subscribe, done.get);
export function setDone(id: string, value: boolean) {
  const next = new Set(done.get());
  if (value) next.add(id);
  else next.delete(id);
  storage.set('done', [...next]);
  done.set(next);
}

/* ---------- tema SAP Horizon claro/escuro ---------- */
export type ThemeMode = 'light' | 'dark';
const systemDark = () => matchMedia('(prefers-color-scheme: dark)').matches;
const saved = storage.get<ThemeMode | null>('theme', null);
const theme = createStore<ThemeMode>(saved ?? (systemDark() ? 'dark' : 'light'));

function applyTheme(mode: ThemeMode) {
  document.documentElement.dataset.theme = mode;
  document.documentElement.style.colorScheme = mode;
  void setTheme(mode === 'dark' ? 'sap_horizon_dark' : 'sap_horizon');
}
applyTheme(theme.get());
try {
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (storage.get<ThemeMode | null>('theme', null)) return; // escolha manual prevalece
    theme.set(e.matches ? 'dark' : 'light');
    applyTheme(theme.get());
  });
} catch {
  /* navegador sem suporte */
}
export const useTheme = () => useSyncExternalStore(theme.subscribe, theme.get);
export function toggleTheme() {
  const next: ThemeMode = theme.get() === 'dark' ? 'light' : 'dark';
  storage.set('theme', next);
  theme.set(next);
  applyTheme(next);
}

/* ---------- toast ---------- */
const toastStore = createStore<{ text: string; n: number }>({ text: '', n: 0 });
export const useToastState = () => useSyncExternalStore(toastStore.subscribe, toastStore.get);
export const toast = (text: string) => toastStore.set({ text, n: toastStore.get().n + 1 });

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
