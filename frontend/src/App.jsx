import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';

// Import Pages
import FarmerDashboard from './pages/FarmerDashboard';
import OfficerDashboard from './pages/OfficerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import FarmerProfile from './pages/FarmerProfile';
import FarmersList from './pages/FarmersList';
import LoanApplicationForm from './pages/LoanApplicationForm';
import LoanDetails from './pages/LoanDetails';
import FarmerGeoMap from './pages/FarmerGeoMap';
import Reports from './pages/Reports';

// Role-based Multi Dashboard decider
const HomeDashboard = () => {
  const { user } = useContext(AuthContext);
  if (user?.role === 'Admin') return <AdminDashboard />;
  if (user?.role === 'Loan Officer') return <OfficerDashboard />;
  return <FarmerDashboard />;
};

// Route Guard Wrapper for general authentication
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex bg-slate-950 min-h-screen text-slate-100 font-sans">
      <Sidebar />
      <main className="flex-1 pl-64 min-h-screen bg-slate-950 relative overflow-x-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="p-6 relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
};

function AppContent() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />

      {/* Protected Combined Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomeDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-profile"
        element={
          <ProtectedRoute allowedRoles={['Farmer']}>
            <FarmerProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/farmers"
        element={
          <ProtectedRoute allowedRoles={['Admin', 'Loan Officer']}>
            <FarmersList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/farmers/:id"
        element={
          <ProtectedRoute allowedRoles={['Admin', 'Loan Officer', 'Farmer']}>
            <FarmerProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/apply"
        element={
          <ProtectedRoute allowedRoles={['Farmer']}>
            <LoanApplicationForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/loans/:id"
        element={
          <ProtectedRoute allowedRoles={['Admin', 'Loan Officer', 'Farmer']}>
            <LoanDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/map"
        element={
          <ProtectedRoute allowedRoles={['Admin', 'Loan Officer']}>
            <FarmerGeoMap />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute allowedRoles={['Admin', 'Loan Officer']}>
            <Reports />
          </ProtectedRoute>
        }
      />

      {/* Wildcard Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
