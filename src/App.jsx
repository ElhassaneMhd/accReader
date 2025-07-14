import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ConnectionProvider } from "./contexts/ConnectionContext";
import { EmailDataProvider } from "./contexts/EmailDataContext";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
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
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <ConnectionProvider>
        <EmailDataProvider>
          <AppRouter />
        </EmailDataProvider>
      </ConnectionProvider>
    </Router>
  );
}

export default App;
