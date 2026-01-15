import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>🏆 Poll Winner</h2>
          <p>Admin Panel</p>
        </div>
        <nav className="sidebar-nav">
          <Link
            to="/"
            className={`nav-item ${isActive('/') ? 'active' : ''}`}
          >
            📊 Dashboard
          </Link>
          <Link
            to="/polls"
            className={`nav-item ${isActive('/polls') || isActive('/polls/create') ? 'active' : ''}`}
          >
            📋 Polls
          </Link>
          <Link
            to="/users"
            className={`nav-item ${isActive('/users') ? 'active' : ''}`}
          >
            👥 Users
          </Link>
          <Link
            to="/transactions"
            className={`nav-item ${isActive('/transactions') ? 'active' : ''}`}
          >
            💳 Transactions
          </Link>
          <Link
            to="/withdrawals"
            className={`nav-item ${isActive('/withdrawals') ? 'active' : ''}`}
          >
            💸 Withdrawals
          </Link>
        </nav>
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="btn btn-danger" style={{ width: '100%' }}>
            Logout
          </button>
        </div>
      </aside>
      <main className="main-content">
        <div className="container">{children}</div>
      </main>
    </div>
  );
};

export default Layout;