import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import Tutorials from './pages/Tutorials';
import Market from './pages/Market';
import Portfolio from './pages/Portfolio';
import Quiz from './pages/Quiz';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCourses from './pages/admin/AdminCourses';
import AdminCourseEditor from './pages/admin/AdminCourseEditor';
import AdminUsers from './pages/admin/AdminUsers';
import AdminAudit from './pages/admin/AdminAudit';
import AdminTutorials from './pages/admin/AdminTutorials';
import AdminWebinars from './pages/admin/AdminWebinars';
import SecuritySettings from './pages/SecuritySettings';
import Pricing from './pages/Pricing';
import PaymentResult from './pages/PaymentResult';
import Forum from './pages/Forum';
import Webinars from './pages/Webinars';
import Affiliation from './pages/Affiliation';
import CGU from './pages/CGU';
import Confidentialite from './pages/Confidentialite';
import MentionsLegales from './pages/MentionsLegales';
import Contact from './pages/Contact';

// Route protégée — redirige vers login si non connecté
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-gold">Chargement...</div>;
  return user ? children : <Navigate to="/login" />;
}

// Route admin — accessible aux instructeurs, moderateurs et admins
function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-gold">Chargement...</div>;
  if (!user) return <Navigate to="/login" />;
  if (!['instructor', 'moderator', 'admin'].includes(user.role)) return <Navigate to="/" />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1C2230', color: '#E6EDF3', border: '1px solid #2A3140' },
          }}
        />
        <Routes>
          {/* Pages publiques */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Pages protégées avec Layout (sidebar + topbar) */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="courses" element={<Courses />} />
            <Route path="courses/:id" element={<CourseDetail />} />
            <Route path="tutorials" element={<Tutorials />} />
            <Route path="market" element={<Market />} />
            <Route path="portfolio" element={<Portfolio />} />
            <Route path="quiz/:courseId" element={<Quiz />} />
            <Route path="quiz" element={<Quiz />} />
            <Route path="certifications" element={<Quiz />} />
            <Route path="forum" element={<Forum />} />
            <Route path="webinars" element={<Webinars />} />
            <Route path="affiliation" element={<Affiliation />} />
            <Route path="security" element={<SecuritySettings />} />
            <Route path="pricing" element={<Pricing />} />
            <Route path="payment/success" element={<PaymentResult type="success" />} />
            <Route path="payment/cancel" element={<PaymentResult type="cancel" />} />
            <Route path="cgu" element={<CGU />} />
            <Route path="confidentialite" element={<Confidentialite />} />
            <Route path="mentions-legales" element={<MentionsLegales />} />
            <Route path="contact" element={<Contact />} />
          </Route>

          {/* Pages admin protegees */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <Layout />
              </AdminRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="courses/new" element={<AdminCourseEditor />} />
            <Route path="courses/:id/edit" element={<AdminCourseEditor />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="audit" element={<AdminAudit />} />
            <Route path="tutorials" element={<AdminTutorials />} />
            <Route path="webinars" element={<AdminWebinars />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
