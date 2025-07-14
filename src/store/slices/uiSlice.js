import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  // FileSelector UI
  isImportOpen: false,
  isViewOpen: false,

  // General UI
  sidebarOpen: false,

  // Modals and overlays
  modalOpen: false,
  modalType: null,
  modalData: null,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setImportOpen: (state, action) => {
      state.isImportOpen = action.payload;
    },
    setViewOpen: (state, action) => {
      state.isViewOpen = action.payload;
    },
    toggleImportOpen: (state) => {
      state.isImportOpen = !state.isImportOpen;
    },
    toggleViewOpen: (state) => {
      state.isViewOpen = !state.isViewOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    openModal: (state, action) => {
      state.modalOpen = true;
      state.modalType = action.payload.type;
      state.modalData = action.payload.data || null;
    },
    closeModal: (state) => {
      state.modalOpen = false;
      state.modalType = null;
      state.modalData = null;
    },
    resetUI: () => {
      return initialState;
    },
  },
});

export const {
  setImportOpen,
  setViewOpen,
  toggleImportOpen,
  toggleViewOpen,
  setSidebarOpen,
  toggleSidebar,
  openModal,
  closeModal,
  resetUI,
} = uiSlice.actions;

export default uiSlice.reducer;
