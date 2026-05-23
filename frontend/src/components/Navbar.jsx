import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext.jsx';

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to={user ? '/dashboard' : '/'} className="nav-brand">
        <span>Itinera</span>
      </Link>

      <div className="nav-right">
        {user ? (
          <>
            <span className="nav-context">
              Planning as <strong>{user.name}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="btn btn-ghost btn-sm"
              id="btn-logout"
            >
              Sign out
            </button>
          </>
        ) : (
          <Link to="/login" className="btn btn-ghost btn-sm" id="btn-signin-nav">
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
