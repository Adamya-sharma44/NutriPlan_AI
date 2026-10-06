import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import AuthForm from './pages/AuthForm';
import Dashboard from './pages/Dashboard';
import CreatePlan from './pages/CreatePlan';
import History from './pages/History';
import PlanDetail from './pages/PlanDetail';
import NotFound from './pages/NotFound';

/**
 * Application routes.
 *  /                      landing page (public)
 *  /login /register       authentication (public)
 *  /dashboard             requires a signed-in user
 *  /dashboard/plans/new   create a plan
 *  /dashboard/plans       saved plans / history
 *  /dashboard/plans/:id   one saved plan
 */
export default function App() {
  return (
    <div className="app">
      {/*
        The skip link must be the very first focusable element in the document
        so keyboard users can jump straight to the page content.
      */}
      <a className="skip-link" href="#main">
        Skip to main content
      </a>

      <Navbar />

      {/* The skip link target wraps every page so it works on all routes. */}
      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<AuthForm mode="login" />} />
          <Route path="/register" element={<AuthForm mode="register" />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/plans/new"
            element={
              <ProtectedRoute>
                <CreatePlan />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/plans"
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/plans/:id"
            element={
              <ProtectedRoute>
                <PlanDetail />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <footer className="footer">
        <div className="container">
          <p>NutriPlan AI — a student meal-planning project.</p>
          <p className="muted">
            Meal planning and wellness only. NutriPlan AI does not provide medical advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
