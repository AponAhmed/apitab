import { create } from 'zustand';

interface DialogState {
  saveRequestOpen: boolean;
  importCurlOpen: boolean;
  openSaveRequest: () => void;
  closeSaveRequest: () => void;
  openImportCurl: () => void;
  closeImportCurl: () => void;
}

/** Ephemeral (non-persisted) coordination of app-level dialogs. */
export const useDialogStore = create<DialogState>((set) => ({
  saveRequestOpen: false,
  importCurlOpen: false,
  openSaveRequest: () => set({ saveRequestOpen: true }),
  closeSaveRequest: () => set({ saveRequestOpen: false }),
  openImportCurl: () => set({ importCurlOpen: true }),
  closeImportCurl: () => set({ importCurlOpen: false }),
}));
