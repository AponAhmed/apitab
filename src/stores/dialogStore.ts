import { create } from 'zustand';

interface DialogState {
  saveRequestOpen: boolean;
  importCurlOpen: boolean;
  loginOpen: boolean;
  shareToTeamCollectionId: string | null;
  openSaveRequest: () => void;
  closeSaveRequest: () => void;
  openImportCurl: () => void;
  closeImportCurl: () => void;
  openLogin: () => void;
  closeLogin: () => void;
  openShareToTeam: (collectionId: string) => void;
  closeShareToTeam: () => void;
}

/** Ephemeral (non-persisted) coordination of app-level dialogs. */
export const useDialogStore = create<DialogState>((set) => ({
  saveRequestOpen: false,
  importCurlOpen: false,
  loginOpen: false,
  shareToTeamCollectionId: null,
  openSaveRequest: () => set({ saveRequestOpen: true }),
  closeSaveRequest: () => set({ saveRequestOpen: false }),
  openImportCurl: () => set({ importCurlOpen: true }),
  closeImportCurl: () => set({ importCurlOpen: false }),
  openLogin: () => set({ loginOpen: true }),
  closeLogin: () => set({ loginOpen: false }),
  openShareToTeam: (collectionId) => set({ shareToTeamCollectionId: collectionId }),
  closeShareToTeam: () => set({ shareToTeamCollectionId: null }),
}));
