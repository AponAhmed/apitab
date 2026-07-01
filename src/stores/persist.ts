import type { StateStorage } from 'zustand/middleware';

/**
 * Zustand persistence adapter backed by `browser.storage.local`, so workspace
 * data (collections, environments, history, draft, UI) survives restarts.
 */
export const browserLocalStorage: StateStorage = {
  getItem: async (name) => {
    const res = await browser.storage.local.get(name);
    const value = res[name];
    return typeof value === 'string' ? value : null;
  },
  setItem: async (name, value) => {
    await browser.storage.local.set({ [name]: value });
  },
  removeItem: async (name) => {
    await browser.storage.local.remove(name);
  },
};
