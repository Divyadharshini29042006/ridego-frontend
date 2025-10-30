import { NavLink } from 'react-router-dom';
import '../../styles/AdminSidebar.css';

function AdminSidebar() {
  return (
    <aside className="admin-sidebar">
      <h3>RideGo Admin</h3>
      <nav>
        <NavLink to="/admin" end>Dashboard</NavLink>
        <NavLink to="/admin/vehicles">Manage Vehicles</NavLink>
        <NavLink to="/admin/drivers">Manage Drivers</NavLink>
        <NavLink to="/admin/bookings">Manage Bookings</NavLink>
        <NavLink to="/admin/locations">Manage Locations</NavLink>
      </nav>
    </aside>
  );
}

export default AdminSidebar;