import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TrendingUp, DollarSign, Calendar, MapPin, Car, Users } from 'lucide-react';
import styles from '../../styles/AdminAnalytics.module.css';

function AdminAnalytics() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const response = await fetch(`${backendUrl}/api/admin/analytics`, { headers });
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      const data = await response.json();
      setAnalyticsData(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching analytics data:', err.message);
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.luxuryAdminAnalytics}>
        <div className={styles.analyticsLoading}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.luxuryAdminAnalytics}>
        <div className={styles.analyticsError}>
          <h2>Error Loading Analytics</h2>
          <p>{error}</p>
          <button onClick={fetchAnalyticsData} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const {
    totalRevenue = 0,
    totalBookings = 0,
    completedTrips = 0,
    cancelledTrips = 0,
    topLocationsByRevenue = [],
    topVehiclesByBookings = [],
    monthlyRevenue = []
  } = analyticsData || {};

  // Prepare data for charts
  const locationChartData = topLocationsByRevenue.slice(0, 5).map(item => ({
    name: item._id.length > 15 ? item._id.substring(0, 15) + '...' : item._id,
    revenue: item.revenue,
    bookings: item.bookings
  }));

  const vehicleChartData = topVehiclesByBookings.slice(0, 5).map(item => ({
    name: `${item.brand} ${item.vehicleName}`.length > 15
      ? `${item.brand} ${item.vehicleName}`.substring(0, 15) + '...'
      : `${item.brand} ${item.vehicleName}`,
    bookings: item.bookings
  }));

  const monthlyChartData = monthlyRevenue.map(item => ({
    month: item.month,
    revenue: item.revenue,
    bookings: item.bookings
  }));

  const tripStatusData = [
    { name: 'Completed', value: completedTrips, color: '#82ca9d' },
    { name: 'Cancelled', value: cancelledTrips, color: '#ff7c7c' },
    { name: 'Other', value: totalBookings - completedTrips - cancelledTrips, color: '#8884d8' }
  ].filter(item => item.value > 0);

  const summaryCards = [
    {
      label: 'Total Revenue',
      value: `₹${totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      colorClass: 'cardEmerald',
      change: '+12%'
    },
    {
      label: 'Total Bookings',
      value: totalBookings.toLocaleString(),
      icon: Calendar,
      colorClass: 'cardBlue',
      change: '+8%'
    },
    {
      label: 'Completed Trips',
      value: completedTrips.toLocaleString(),
      icon: TrendingUp,
      colorClass: 'cardGreen',
      change: '+15%'
    },
    {
      label: 'Top Location',
      value: topLocationsByRevenue[0]?._id || 'N/A',
      icon: MapPin,
      colorClass: 'cardPurple',
      change: null
    }
  ];

  return (
    <div className={styles.luxuryAdminAnalytics}>
      {/* Header */}
      <div className={styles.analyticsHeader}>
        <h1 className={styles.analyticsTitle}>Analytics Dashboard</h1>
        <div className={styles.titleDivider}></div>
        <p className={styles.analyticsSubtitle}>Comprehensive insights into your platform performance</p>
      </div>

      {/* Summary Cards */}
      <div className={styles.analyticsSummaryGrid}>
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className={`${styles.analyticsSummaryCard} ${styles[card.colorClass]}`}>
              <div className={styles.summaryHeader}>
                <div className={styles.summaryIconWrapper}>
                  <Icon className={styles.summaryIcon} strokeWidth={2.5} />
                </div>
              </div>
              <div className={styles.summaryContent}>
                <p className={styles.summaryLabel}>{card.label}</p>
                <p className={styles.summaryValue}>{card.value}</p>
                {card.change && (
                  <span className={`${styles.summaryChange} ${styles.summaryChangePositive}`}>{card.change}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className={styles.analyticsChartsGrid}>
        {/* Monthly Revenue Trend */}
        <div className={styles.analyticsChartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Monthly Revenue Trend</h3>
            <TrendingUp className={styles.chartIcon} />
          </div>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8884d8"
                  strokeWidth={3}
                  dot={{ fill: '#8884d8', strokeWidth: 2, r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Locations by Revenue */}
        <div className={styles.analyticsChartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Top Locations by Revenue</h3>
            <MapPin className={styles.chartIcon} />
          </div>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={locationChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                <Legend />
                <Bar dataKey="revenue" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Vehicles by Bookings */}
        <div className={styles.analyticsChartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Top Vehicles by Bookings</h3>
            <Car className={styles.chartIcon} />
          </div>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={vehicleChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="bookings" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trip Status Distribution */}
        <div className={styles.analyticsChartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>Trip Status Distribution</h3>
            <Users className={styles.chartIcon} />
          </div>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={tripStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {tripStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Data Tables */}
      <div className={styles.analyticsTablesGrid}>
        {/* Top Locations Table */}
        <div className={styles.analyticsTableCard}>
          <h3 className={styles.tableTitle}>Top Locations by Revenue</h3>
          <div className={styles.tableContainer}>
            <table className={styles.analyticsTable}>
              <thead>
                <tr>
                  <th>Location</th>
                  <th>Revenue</th>
                  <th>Bookings</th>
                </tr>
              </thead>
              <tbody>
                {topLocationsByRevenue.slice(0, 5).map((item, index) => (
                  <tr key={index}>
                    <td>{item._id}</td>
                    <td>₹{item.revenue.toLocaleString()}</td>
                    <td>{item.bookings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Vehicles Table */}
        <div className={styles.analyticsTableCard}>
          <h3 className={styles.tableTitle}>Top Vehicles by Bookings</h3>
          <div className={styles.tableContainer}>
            <table className={styles.analyticsTable}>
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Bookings</th>
                </tr>
              </thead>
              <tbody>
                {topVehiclesByBookings.slice(0, 5).map((item, index) => (
                  <tr key={index}>
                    <td>{item.brand} {item.vehicleName}</td>
                    <td>{item.bookings}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminAnalytics;