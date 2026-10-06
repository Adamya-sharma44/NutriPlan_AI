import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Top navigation. The links change depending on whether the user is signed in,
 * and the current page is marked with aria-current for assistive technology.
 */
export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/', { replace: true });
  }

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Link to="/" className="navbar__brand">
          <span className="navbar__logo" aria-hidden="true">
            NP
          </span>
          <span>NutriPlan AI</span>
        </Link>

        <nav className="navbar__nav" aria-label="Main navigation">
          {user ? (
            <>
              <NavLink to="/dashboard" className="navbar__link">
                Dashboard
              </NavLink>
              <NavLink to="/dashboard/plans/new" className="navbar__link">
                Create Plan
              </NavLink>
              <NavLink to="/dashboard/plans" className="navbar__link">
                My Meal Plans
              </NavLink>
              <span className="navbar__user">Hi, {user.name.split(' ')[0]}</span>
              <button type="button" className="btn btn--ghost btn--sm" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="navbar__link">
                Log in
              </NavLink>
              <Link to="/register" className="btn btn--primary btn--sm">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
