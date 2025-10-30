import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/Navbar.css';

function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const dropdownRef = useRef(null);

  const isLoggedIn = !!user;
  const isAdmin = isLoggedIn && user.role === 'admin';
  const isManager = isLoggedIn && user.role === 'manager';
  const isDriver = isLoggedIn && user.role === 'driver';
  const isRegularUser = isLoggedIn && (user.role === 'customer' || user.role === 'user');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileMenuOpen && !event.target.closest('.navbar')) {
        setIsMobileMenuOpen(false);
      }
      if (isProfileDropdownOpen && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobileMenuOpen, isProfileDropdownOpen]);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const isActiveLink = (path) => location.pathname === path;

  const getDashboardPath = () => {
    if (isAdmin) return '/admin';
    if (isManager) return '/manager/dashboard';
    if (isDriver) return '/driver/dashboard';
    return '/dashboard';
  };

  const getDashboardLabel = () => {
    if (isAdmin) return 'Admin Panel';
    if (isManager) return 'Manager Panel';
    if (isDriver) return 'Driver Panel';
    return 'Dashboard';
  };

  const handleLogout = () => {
    logout();
    setIsProfileDropdownOpen(false);
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name || name === 'User') return 'U';
    const names = name.trim().split(' ').filter(n => n.length > 0);
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getUserName = () => {
    return user?.name || 'User';
  };

  const getUserEmail = () => {
    return user?.email || 'user@email.com';
  };

  const dashboardPath = getDashboardPath();
  const dashboardLabel = getDashboardLabel();

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-logo">
        <Link to="/">RideGo</Link>
      </div>

      <button
        className={`mobile-menu-btn ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={toggleMobileMenu}
        aria-label="Toggle mobile menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <ul className={`navbar-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <li>
          <Link to="/" className={isActiveLink('/') ? 'active' : ''}>Home</Link>
        </li>
        <li>
          <Link to="/vehicles" className={isActiveLink('/vehicles') ? 'active' : ''}>Vehicles</Link>
        </li>
        <li>
          <Link to="/contact" className={isActiveLink('/contact') ? 'active' : ''}>Contact</Link>
        </li>

        {!isLoggedIn ? (
          <>
            <li>
              <Link to="/login" className={isActiveLink('/login') ? 'active' : ''}>Login</Link>
            </li>
            <li>
              <Link to="/signup" className={isActiveLink('/signup') ? 'active' : ''}>Sign Up</Link>
            </li>
          </>
        ) : isRegularUser ? (
          <li className="user-profile-container" ref={dropdownRef}>
            <button 
              className="user-avatar-btn" 
              onClick={toggleProfileDropdown}
              aria-label="User menu"
            >
              <div className="user-initials">
                {getInitials(getUserName())}
              </div>
              <span className="user-name-display">{getUserName()}</span>
            </button>

            {isProfileDropdownOpen && (
              <div className="user-dropdown">
                <div className="user-dropdown-header">
                  <div className="user-dropdown-avatar">
                    {getInitials(getUserName())}
                  </div>
                  <div className="user-dropdown-info">
                    <div className="user-dropdown-name">{getUserName()}</div>
                    <div className="user-dropdown-email">{getUserEmail()}</div>
                  </div>
                </div>
                
                <div className="user-dropdown-divider"></div>
                
                <div className="user-dropdown-menu">
                  <Link 
                    to="/settings" 
                    className="user-dropdown-item"
                    onClick={() => setIsProfileDropdownOpen(false)}
                  >
                    <svg className="dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Profile Settings</span>
                  </Link>
                  <Link 
                    to="/my-bookings" 
                    className="user-dropdown-item"
                    onClick={() => setIsProfileDropdownOpen(false)}
                  >
                    <svg className="dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>My Bookings</span>
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="user-dropdown-item logout-item"
                  >
                    <svg className="dropdown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </li>
        ) : (
          <>
            <li>
              <Link
                to={dashboardPath}
                className={isActiveLink(dashboardPath) ? 'active' : ''}
              >
                {dashboardLabel}
              </Link>
            </li>
            <li>
              <button onClick={handleLogout} className="logout-btn">
                Logout
              </button>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;