import { configureStore } from "@reduxjs/toolkit";
import filesReducer from "./slices/filesSlice";
import uiReducer from "./slices/uiSlice";

export const store = configureStore({
  reducer: {
    files: filesReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for non-serializable data
        ignoredActions: [
          "files/setRawData",
          "files/setFilteredData",
          "files/setAvailableFiles",
        ],
      },
    }),
});

export default store;

// Export types for use in hooks
export const getRootState = () => store.getState();
export const getAppDispatch = () => store.dispatch;
