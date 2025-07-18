import { configureStore } from "@reduxjs/toolkit";
import filesReducer from "./slices/filesSlice";
import uiReducer from "./slices/uiSlice";
import authReducer from "./slices/authSlice";
import mailwizzReducer from "./slices/mailwizzSlice";

export const store = configureStore({
  reducer: {
    files: filesReducer,
    ui: uiReducer,
    auth: authReducer,
    mailwizz: mailwizzReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for non-serializable data
        ignoredActions: [
          "files/setRawData",
          "files/setFilteredData",
          "files/setAvailableFiles",
          "auth/loginUser/fulfilled",
          "auth/verifyToken/fulfilled",
          "mailwizz/fetchUserCampaigns/fulfilled",
        ],
      },
    }),
});

export default store;

// Export types for use in hooks
export const getRootState = () => store.getState();
export const getAppDispatch = () => store.dispatch;
