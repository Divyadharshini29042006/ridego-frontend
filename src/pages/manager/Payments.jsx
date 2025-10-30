// frontend/src/pages/manager/Payments.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import managerAPI from '../../api/managerAPI.js';
import { 
  RefreshCw, 
  Search, 
  Wallet, 
  CheckCircle, 
  Clock, 
  XCircle,
  CreditCard,
  User,
  Car,
  Phone,
  Mail,
  Calendar,
  DollarSign
} from 'lucide-react';
import '../../styles/Payments.css';

const Payments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPayments, setTotalPayments] = useState(0);
  const [pageSize] = useState(10);

  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [payments, statusFilter, searchTerm]);

  const fetchPayments = async (page = currentPage) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await managerAPI.getManagerPayments(token, page, pageSize);
      console.log('Fetched payments:', response);
      console.log('Payment amounts:', response.payments?.map(p => ({ id: p._id, amount: p.amount, status: p.status })));
      setPayments(response.payments || []);
      setFilteredPayments(response.payments || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalPayments(response.pagination?.totalPayments || 0);
      setCurrentPage(page);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError(err.response?.data?.message || 'Failed to load payments');
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...payments];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p._id.toLowerCase().includes(term) ||
        p.customer?.name?.toLowerCase().includes(term) ||
        p.customer?.email?.toLowerCase().includes(term) ||
        p.booking?.vehicle?.vehicleModel?.toLowerCase().includes(term) ||
        p.booking?.vehicle?.vehicleNumber?.toLowerCase().includes(term)
      );
    }

    setFilteredPayments(filtered);
  };

  const calculateTotalAmount = () => {
    return payments.reduce((sum, payment) => {
      if (payment.status === 'success') {
        // Handle different possible amount field names
        const amount = payment.amount || payment.totalAmount || 0;
        console.log('Payment:', payment._id, 'Amount:', amount, 'Status:', payment.status);
        return sum + amount;
      }
      return sum;
    }, 0);
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      'initiated': 'status-pending',
      'success': 'status-completed',
      'invalid': 'status-failed',
      'failed': 'status-failed',
      'refunded': 'status-refunded',
      'Waiting to pay penalty': 'status-warning'
    };
    return statusMap[status] || 'status-default';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle size={16} />;
      case 'initiated':
        return <Clock size={16} />;
      case 'invalid':
      case 'failed':
        return <XCircle size={16} />;
      default:
        return <Wallet size={16} />;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="manage-payments-container">
        <div className="loading-spinner">Loading payments...</div>
      </div>
    );
  }

  return (
    <div className="manage-payments-container">
      {/* Header */}
      <div className="payments-header">
        <div>
          <h1>Payment Management</h1>
          <p className="subtitle">View and manage payments for your location</p>
        </div>
        <button onClick={fetchPayments} className="refresh-btn">
          <RefreshCw size={18} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card total-revenue">
          <div className="stat-icon">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Revenue</p>
            <h3 className="stat-value">{formatCurrency(calculateTotalAmount())}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Wallet size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Payments</p>
            <h3 className="stat-value">{totalPayments}</h3>
          </div>
        </div>

        <div className="stat-card completed">
          <div className="stat-icon">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Completed</p>
            <h3 className="stat-value">{payments.filter(p => p.status === 'success').length}</h3>
          </div>
        </div>

        <div className="stat-card pending">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Pending</p>
            <h3 className="stat-value">{payments.filter(p => p.status === 'initiated').length}</h3>
          </div>
        </div>

        <div className="stat-card failed">
          <div className="stat-icon">
            <XCircle size={24} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Failed</p>
            <h3 className="stat-value">{payments.filter(p => p.status === 'invalid' || p.status === 'failed').length}</h3>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Status Filter</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="initiated">Initiated</option>
            <option value="success">Success</option>
            <option value="invalid">Invalid</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        <div className="filter-group search-group">
          <label>Search Payments</label>
          <div className="search-input-wrapper">
            <Search size={18} />
            <input
              type="text"
              placeholder="Payment ID, Customer, Vehicle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <XCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Payments Table */}
      <div className="payments-table-container">
        {filteredPayments.length === 0 ? (
          <div className="no-payments">
            <Wallet size={48} />
            <p>No payments found</p>
          </div>
        ) : (
          <>
            <table className="payments-table">
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Payment Method</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment._id}>
                    <td>
                      <span className="payment-id">
                        {payment._id.slice(-8)}
                      </span>
                    </td>
                    <td>
                      <div className="customer-info">
                        <div className="info-row">
                          <User size={14} />
                          <strong>{payment.customer?.name}</strong>
                        </div>
                        <div className="info-row small">
                          <Mail size={12} />
                          <small>{payment.customer?.email}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="vehicle-info">
                        <div className="info-row">
                          <Car size={14} />
                          <strong>{payment.booking?.vehicle?.vehicleModel}</strong>
                        </div>
                        <small>{payment.booking?.vehicle?.vehicleNumber}</small>
                      </div>
                    </td>
                    <td>
                      {payment.booking?.driver ? (
                        <div className="driver-info">
                          <div className="info-row">
                            <User size={14} />
                            <strong>{payment.booking.driver.name}</strong>
                          </div>
                          <div className="info-row small">
                            <Phone size={12} />
                            <small>{payment.booking.driver.phone}</small>
                          </div>
                        </div>
                      ) : (
                        <span className="badge badge-self-drive">
                          <Car size={12} />
                          Self Drive
                        </span>
                      )}
                    </td>
                    <td>
                      <strong className="amount">{formatCurrency(payment.amount || payment.totalAmount || 0)}</strong>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(payment.status)}`}>
                        {getStatusIcon(payment.status)}
                        <span>{payment.status}</span>
                      </span>
                    </td>
                    <td>
                      <div className="date-info">
                        <Calendar size={14} />
                        <span>{formatDate(payment.createdAt)}</span>
                      </div>
                    </td>
                    <td>
                      <span className="payment-method">
                        <CreditCard size={14} />
                        <span>{payment.paymentMethod || 'Razorpay'}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => fetchPayments(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => fetchPayments(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Payments;