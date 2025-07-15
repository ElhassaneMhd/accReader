import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store/store";
import { ConnectionProvider } from "./contexts/ConnectionContext";
import { EmailDataProvider } from "./contexts/EmailDataContext";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import PublicUploadPage from "./pages/PublicUploadPage";
import { useConnectionContext } from "./hooks/useConnectionContext";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isConnected } = useConnectionContext();

  if (!isConnected) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route Component (redirect if already connected)
const PublicRoute = ({ children }) => {
  const { isConnected } = useConnectionContext();

  if (isConnected) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Router wrapper component to access context
const AppRouter = () => {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route path="/upload" element={<PublicUploadPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Provider store={store}>
      <Router>
        <ConnectionProvider>
          <EmailDataProvider>
            <AppRouter />
          </EmailDataProvider>
        </ConnectionProvider>
      </Router>
    </Provider>
  );
}

export default App;
