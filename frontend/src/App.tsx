import { type ReactElement } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Browse from './pages/Browse';
import ProfileView from './pages/ProfileView';
import ProfileEdit from './pages/ProfileEdit';
import Messages from './pages/Messages';
import LikedYou from './pages/LikedYou';
import Verification from './pages/Verification';
import Premium from './pages/Premium';
import Trust from './pages/Trust';
import SafetyTips from './pages/SafetyTips';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';

import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminReports from './pages/admin/AdminReports';
import AdminVerification from './pages/admin/AdminVerification';

function PrivateRoute({ children }: { children: ReactElement }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="text-center py-20">Loading...</p>;
  if (!user) return <Navigate to="/login" />;
  return children;
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {children}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout><Landing /></Layout>} />
          <Route path="/login" element={<Layout><Login /></Layout>} />
          <Route path="/trust" element={<Layout><Trust /></Layout>} />
          <Route path="/safety-tips" element={<Layout><SafetyTips /></Layout>} />
          <Route path="/privacy" element={<Layout><Privacy /></Layout>} />
          <Route path="/terms" element={<Layout><Terms /></Layout>} />

          <Route path="/browse" element={<Layout><PrivateRoute><Browse /></PrivateRoute></Layout>} />
          <Route path="/profile/me/edit" element={<Layout><PrivateRoute><ProfileEdit /></PrivateRoute></Layout>} />
          <Route path="/profile/me" element={<Layout><PrivateRoute><ProfileEdit /></PrivateRoute></Layout>} />
          <Route path="/profile/:id" element={<Layout><PrivateRoute><ProfileView /></PrivateRoute></Layout>} />
          <Route path="/messages" element={<Layout><PrivateRoute><Messages /></PrivateRoute></Layout>} />
          <Route path="/liked-you" element={<Layout><PrivateRoute><LikedYou /></PrivateRoute></Layout>} />
          <Route path="/verification" element={<Layout><PrivateRoute><Verification /></PrivateRoute></Layout>} />
          <Route path="/premium" element={<Layout><PrivateRoute><Premium /></PrivateRoute></Layout>} />

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="verification" element={<AdminVerification />} />
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
