import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, Search, X, Phone, CreditCard, MapPin, UserCheck, Zap, FileText, Filter } from 'lucide-react';
import styles from '../../styles/ManageDrivers.module.css';

const ManageDrivers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [cityFilter, setCityFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Unique options for dropdowns
  const [uniqueCities, setUniqueCities] = useState([]);
  const [uniqueLocations, setUniqueLocations] = useState([]);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${backendUrl}/api/admin/drivers`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setDrivers(res.data);
    } catch (err) {
      console.error('❌ Error fetching drivers:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  // Extract unique cities and locations when drivers data changes
  useEffect(() => {
    const cities = [...new Set(drivers.map(driver => driver.location?.city).filter(Boolean))].sort();
    const locations = [...new Set(drivers.map(driver => driver.location?.name).filter(Boolean))].sort();
    setUniqueCities(cities);
    setUniqueLocations(locations);
  }, [drivers]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const filteredDrivers = drivers.filter(driver => {
    const searchLower = searchTerm.toLowerCase();
    const status = (driver.status || '').toLowerCase();

    // Search filter
    const matchesSearch = (
      driver.name?.toLowerCase().includes(searchLower) ||
      driver.phone?.toLowerCase().includes(searchLower) ||
      driver.licenseNumber?.toLowerCase().includes(searchLower) ||
      driver.location?.name?.toLowerCase().includes(searchLower) ||
      driver.location?.city?.toLowerCase().includes(searchLower) ||
      driver.manager?.name?.toLowerCase().includes(searchLower) ||
      status.includes(searchLower) ||
      (searchLower === 'available' && status === 'available') ||
      (searchLower === 'assigned' && status === 'assigned') ||
      (searchLower === 'busy' && status === 'busy')
    );

    // City filter
    const matchesCity = !cityFilter || driver.location?.city === cityFilter;

    // Location filter
    const matchesLocation = !locationFilter || driver.location?.name === locationFilter;

    // Status filter
    const matchesStatus = statusFilter === 'all' || status === statusFilter.toLowerCase();

    return matchesSearch && matchesCity && matchesLocation && matchesStatus;
  });

  const getManagerName = (driver) => {
    if (driver.manager?.name) {
      return driver.manager.name;
    }
    return 'Not Assigned';
  };

  const availableCount = drivers.filter(d => d.status?.toLowerCase() === 'available').length;
  const assignedCount = drivers.filter(d => d.status?.toLowerCase() === 'assigned').length;

  return (
    <div className={styles['luxury-manage-drivers-container']}>
      <div className={styles['luxury-manage-drivers-content']}>
        <header className={styles['luxury-page-header']}>
          <h1 className={styles['luxury-page-title']}>
            <Users />
            Driver Management Hub
          </h1>
          <p className={styles['luxury-page-subtitle']}>
            View and monitor all drivers across your organization
          </p>
          <div className={styles['header-stats']}>
            <div className={styles['stat-card']}>
              <div className={styles['stat-number']}>{drivers.length}</div>
              <div className={styles['stat-label']}>Total Drivers</div>
            </div>
            <div className={styles['stat-card']}>
              <div className={styles['stat-number']}>{availableCount}</div>
              <div className={styles['stat-label']}>Available</div>
            </div>
            <div className={styles['stat-card']}>
              <div className={styles['stat-number']}>{assignedCount}</div>
              <div className={styles['stat-label']}>Assigned</div>
            </div>
          </div>
        </header>

        <div className={styles['luxury-search-section']}>
          <div className={styles['search-container']}>
            <div className={styles['search-input-wrapper']}>
              <input
                type="text"
                placeholder="Search by name, phone, license, location, manager, or status (available/assigned)..."
                value={searchTerm}
                onChange={handleSearchChange}
                className={styles['luxury-search-input']}
              />
              <div className={styles['search-icon-wrapper']}>
                <Search />
              </div>
            </div>
            <button
              className={styles['filter-toggle-btn']}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={18} />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className={styles['filters-panel']}>
              <div className={styles['filter-group']}>
                <label className={styles['filter-label']}>
                  <MapPin size={16} />
                  City
                </label>
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className={styles['filter-select']}
                >
                  <option value="">All Cities</option>
                  {uniqueCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div className={styles['filter-group']}>
                <label className={styles['filter-label']}>
                  <MapPin size={16} />
                  Location Name
                </label>
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className={styles['filter-select']}
                >
                  <option value="">All Locations</option>
                  {uniqueLocations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>

              <div className={styles['filter-group']}>
                <label className={styles['filter-label']}>
                  <Zap size={16} />
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={styles['filter-select']}
                >
                  <option value="all">All Status</option>
                  <option value="available">Available</option>
                  <option value="assigned">Assigned</option>
                  <option value="busy">Busy</option>
                </select>
              </div>

              <button
                className={styles['reset-btn']}
                onClick={() => {
                  setCityFilter('');
                  setLocationFilter('');
                  setStatusFilter('all');
                }}
              >
                Reset Filters
              </button>
            </div>
          )}

          <div className={styles['search-summary']}>
            <div className={styles['results-info']}>
              Showing <span className={styles['highlight']}>{filteredDrivers.length}</span> of <span className={styles['highlight']}>{drivers.length}</span> drivers
              {searchTerm && (
                <div className={styles['search-term']}>
                  Searching for: "<span className={styles['search-query']}>{searchTerm}</span>"
                  <button onClick={clearSearch} className={styles['luxury-clear-btn']}>
                    <span>Clear</span>
                    <X />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className={styles['luxury-loading-state']}>
            <div className={styles['luxury-loading-spinner']}></div>
            <h3>Loading Drivers</h3>
            <p>Please wait while we fetch the driver information...</p>
          </div>
        ) : filteredDrivers.length > 0 ? (
          <div className={styles['luxury-drivers-grid']}>
            {filteredDrivers.map((driver, index) => {
              const imageUrl = driver.image
                ? `${backendUrl}/${driver.image.replace(/\\/g, '/')}`
                : 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face';

              const managerName = getManagerName(driver);
              const statusClass = (driver.status || 'unknown').toLowerCase();

              return (
                <div key={driver._id || index} className={styles['luxury-driver-card']}>
                  <div className={styles['card-header']}>
                    <div className={styles['avatar-section']}>
                      <div
                        className={styles['luxury-driver-avatar']}
                        style={{ backgroundImage: `url(${imageUrl})` }}
                      />
                      <div className={`${styles['luxury-status-indicator']} ${styles[statusClass]}`}>
                        <div className={styles['status-pulse']}></div>
                      </div>
                    </div>
                    <h3 className={styles['luxury-driver-name']}>{driver.name || 'Unknown Driver'}</h3>
                  </div>

                  <div className={styles['card-body']}>
                    <div className={styles['driver-details-grid']}>
                      <div className={styles['detail-row']}>
                        <div className={`${styles['detail-icon-wrapper']} ${styles['phone']}`}>
                          <Phone />
                        </div>
                        <div className={styles['detail-content']}>
                          <span className={styles['detail-label']}>Phone</span>
                          <span className={styles['detail-value']}>{driver.phone || 'Not provided'}</span>
                        </div>
                      </div>

                      <div className={styles['detail-row']}>
                        <div className={`${styles['detail-icon-wrapper']} ${styles['license']}`}>
                          <CreditCard />
                        </div>
                        <div className={styles['detail-content']}>
                          <span className={styles['detail-label']}>License</span>
                          <span className={styles['detail-value']}>{driver.licenseNumber || 'Not provided'}</span>
                        </div>
                      </div>

                      {driver.licenseFile && (
                        <div className={styles['detail-row']}>
                          <div className={`${styles['detail-icon-wrapper']} ${styles['documents']}`}>
                            <FileText />
                          </div>
                          <div className={styles['detail-content']}>
                            <span className={styles['detail-label']}>Documents</span>
                            <button
                              className={styles['view-document-btn']}
                              onClick={() => window.open(`${backendUrl}/${driver.licenseFile.replace(/\\/g, '/')}`, '_blank')}
                            >
                              View License
                            </button>
                          </div>
                        </div>
                      )}

                      <div className={styles['detail-row']}>
                        <div className={`${styles['detail-icon-wrapper']} ${styles['location']}`}>
                          <MapPin />
                        </div>
                        <div className={styles['detail-content']}>
                          <span className={styles['detail-label']}>Location</span>
                          <span className={styles['detail-value']}>
                            {driver.location?.name && driver.location?.city
                              ? `${driver.location.name}, ${driver.location.city}`
                              : 'Unknown Location'}
                          </span>
                        </div>
                      </div>

                      <div className={styles['detail-row']}>
                        <div className={`${styles['detail-icon-wrapper']} ${styles['manager']}`}>
                          <UserCheck />
                        </div>
                        <div className={styles['detail-content']}>
                          <span className={styles['detail-label']}>Manager</span>
                          <span className={`${styles['detail-value']} ${styles['manager-name']}`}>{managerName}</span>
                        </div>
                      </div>

                      {driver.status && (
                        <div className={`${styles['detail-row']} ${styles['status-row']}`}>
                          <div className={`${styles['detail-icon-wrapper']} ${styles['status']}`}>
                            <Zap />
                          </div>
                          <div className={styles['detail-content']}>
                            <span className={styles['detail-label']}>Status</span>
                            <span className={`${styles['status-badge']} ${styles[statusClass]}`}>
                              {driver.status}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles['luxury-empty-state']}>
            <div className={styles['empty-icon-wrapper']}>
              <Users />
            </div>
            <h3 className={styles['empty-title']}>
              {searchTerm ? 'No Matching Drivers Found' : 'No Drivers Available'}
            </h3>
            <p className={styles['empty-message']}>
              {searchTerm
                ? 'Try adjusting your search criteria. You can search by status like "available" or "assigned".'
                : 'No drivers have been added to the system yet. Please contact a Manager to add drivers.'}
            </p>
            {searchTerm && (
              <button onClick={clearSearch} className={`${styles['luxury-clear-btn']} ${styles['large']}`}>
                <span>Clear Search</span>
                <X />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageDrivers;
