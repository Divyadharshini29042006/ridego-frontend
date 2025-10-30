import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  TrendingUp,
  Car,
  Users,
  FileText,
  MapPin,
  CreditCard,
  UserCog,
  BarChart3,
  Activity
} from 'lucide-react';
import styles from '../../styles/AdminDashboard.module.css';

function AdminDashboard() {
  const [totalBookings, setTotalBookings] = useState(0);
  const [totalPayments, setTotalPayments] = useState(0);
  const [totalDrivers, setTotalDrivers] = useState(0);
  const [totalManagers, setTotalManagers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const response = await fetch(`${backendUrl}/api/admin/metrics`, { headers });
      const data = await response.json();

      setTotalBookings(data.totalBookings || 0);
      setTotalPayments(data.totalPayments || 0);
      setTotalDrivers(data.totalDrivers || 0);
      setTotalManagers(data.totalManagers || 0);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err.message);
      setLoading(false);
    }
  };

  const dashboardLinks = [
    { to: '/admin/analytics', icon: BarChart3, label: 'Analytics', gradient: styles.gradientAmber },
    { to: '/admin/query-metrics', icon: TrendingUp, label: 'Query Metrics', gradient: styles.gradientBlue },
    { to: '/admin/vehicles', icon: Car, label: 'Manage Vehicles', gradient: styles.gradientPurple },
    { to: '/admin/drivers', icon: Users, label: 'Manage Drivers', gradient: styles.gradientGreen },
    { to: '/admin/bookings/manage', icon: FileText, label: 'Manage Bookings', gradient: styles.gradientRose },
    { to: '/admin/locations', icon: MapPin, label: 'Manage Locations', gradient: styles.gradientIndigo },
    { to: '/admin/payments', icon: CreditCard, label: 'Manage Payments', gradient: styles.gradientTeal },
    { to: '/admin/managers', icon: UserCog, label: 'Manage Managers', gradient: styles.gradientViolet },
  ];

  const summaryCards = [
    { label: 'Total Bookings', value: totalBookings, icon: Calendar, colorClass: styles.cardAmber },
    { label: 'Total Payments', value: `${totalPayments.toLocaleString()}`, icon: CreditCard, colorClass: styles.cardEmerald },
    { label: 'Total Drivers', value: totalDrivers, icon: Users, colorClass: styles.cardBlue },
    { label: 'Total Managers', value: totalManagers, icon: UserCog, colorClass: styles.cardPurple },
  ];

  return (
    <div className={styles.luxuryAdminDashboard}>
      {/* Header */}
      <div className={styles.dashboardHeader}>
        <h1 className={styles.dashboardTitle}>Admin Control Panel</h1>
        <div className={styles.titleDivider}></div>
        <p className={styles.dashboardSubtitle}>Manage your platform with elegance</p>
      </div>

      {/* Dashboard Links Grid */}
      <div className={styles.dashboardLinksGrid}>
        {dashboardLinks.map((link, index) => {
          const Icon = link.icon;
          return (
            <Link
              key={index}
              to={link.to}
              className={styles.dashboardLinkCard}
            >
              <div className={styles.cardOverlay}></div>
              <div className={styles.cardContent}>
                <div className={`${styles.iconWrapper} ${link.gradient}`}>
                  <Icon className={styles.cardIcon} strokeWidth={2} />
                </div>
                <span className={styles.cardLabel}>{link.label}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Dashboard Widgets */}
      <div className={styles.dashboardWidgetsGrid}>
        {/* Booking Trends Widget */}
        <div className={styles.widgetCard}>
          <div className={styles.widgetContent}>
            <div className={`${styles.widgetIconWrapper} ${styles.gradientAmber}`}>
              <BarChart3 className={styles.widgetIcon} strokeWidth={2} />
            </div>
            <div className={styles.widgetText}>
              <h3 className={styles.widgetTitle}>Booking Trends</h3>
              <p className={styles.widgetDescription}>
                Go to <Link to="/admin/bookings/manage" className={`${styles.widgetLink} ${styles.linkAmber}`}>Manage Bookings</Link> to filter and analyze booking patterns.
              </p>
            </div>
          </div>
        </div>

        {/* Query Response Widget */}
        <div className={styles.widgetCard}>
          <div className={styles.widgetContent}>
            <div className={`${styles.widgetIconWrapper} ${styles.gradientBlue}`}>
              <Activity className={styles.widgetIcon} strokeWidth={2} />
            </div>
            <div className={styles.widgetText}>
              <h3 className={styles.widgetTitle}>Query Response Overview</h3>
              <p className={styles.widgetDescription}>
                Check <Link to="/admin/query-metrics" className={`${styles.widgetLink} ${styles.linkBlue}`}>Query Metrics</Link> for response times and assignments.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryCardsGrid}>
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className={`${styles.summaryCard} ${card.colorClass}`}>
              <div className={styles.summaryHeader}>
                <div className={styles.summaryIconWrapper}>
                  <Icon className={styles.summaryIcon} strokeWidth={2.5} />
                </div>
                {loading && <div className={styles.loadingSpinner}></div>}
              </div>
              <div className={styles.summaryContent}>
                <p className={styles.summaryLabel}>{card.label}</p>
                <p className={styles.summaryValue}>{loading ? '...' : card.value}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AdminDashboard;