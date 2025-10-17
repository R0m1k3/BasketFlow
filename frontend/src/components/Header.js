import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <Link to="/" className="logo">
          <h1>🏀 Basket Flow</h1>
        </Link>

        <nav className="header-nav">
          {user ? (
            <>
              <span className="user-info">
                Bonjour, {user.name}
                {user.role === 'admin' && <span className="admin-badge">Admin</span>}
              </span>
              {user.role === 'admin' && (
                <Link to="/admin" className="nav-link">
                  ⚙️ Administration
                </Link>
              )}
              <button onClick={handleLogout} className="btn-logout">
                Déconnexion
              </button>
            </>
          ) : (
            <Link to="/login" className="nav-link">Connexion</Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
