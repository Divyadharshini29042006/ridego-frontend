// src/components/Sidebar/ManagerSidebar.jsx

import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Car, Users, BookOpen, CreditCard, MessageSquare } from 'lucide-react';
import styles from '../../styles/ManagerSidebar.module.css';

const ManagerSidebar = () => {
  return (
    <div className={styles.managerSidebar}>
      <h3>Manager Panel</h3>
      <nav>
        <NavLink to="/manager/dashboard" className={({ isActive }) => isActive ? styles.activeLink : ''}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/manager/vehicles" className={({ isActive }) => isActive ? styles.activeLink : ''}>
          <Car size={20} />
          <span>Manage Vehicles</span>
        </NavLink>

        <NavLink to="/manager/drivers" className={({ isActive }) => isActive ? styles.activeLink : ''}>
          <Users size={20} />
          <span>Manage Drivers</span>
        </NavLink>

        <NavLink to="/manager/bookings" className={({ isActive }) => isActive ? styles.activeLink : ''}>
          <BookOpen size={20} />
          <span>Manage Bookings</span>
        </NavLink>

        <NavLink to="/manager/payments" className={({ isActive }) => isActive ? styles.activeLink : ''}>
          <CreditCard size={20} />
          <span>Payments</span>
        </NavLink>

        <NavLink to="/manager/queries" className={({ isActive }) => isActive ? styles.activeLink : ''}>
          <MessageSquare size={20} />
          <span>Manage Queries</span>
        </NavLink>
      </nav>
    </div>
  );
};

export default ManagerSidebar;