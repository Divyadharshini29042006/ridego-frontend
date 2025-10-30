import React, { useState, useEffect } from 'react';
import { Search, MapPin, Car, Bike, Truck, Fuel, CreditCard, User, ChevronRight, Filter, X } from 'lucide-react';
import styles from '../../styles/ManageVehicles.module.css';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const ManageVehicles = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [locations, setLocations] = useState([]);
  const [selectedCity, setSelectedCity] = useState('All');

  const categoryMap = {
    suv: 'SUV',
    bike: 'Bike',
    car: 'Car',
    truck: 'Truck',
  };

  const rawCategories = [...new Set(vehicles.map(v => v.category?.toLowerCase()).filter(Boolean))];
  const mappedCategories = rawCategories.map(cat => categoryMap[cat] || (cat.charAt(0).toUpperCase() + cat.slice(1)));

  let categories = ['All', ...mappedCategories];

  if (!mappedCategories.includes('SUV') && vehicles.some(v => v.category?.toLowerCase() === 'suv')) {
    categories = ['All', 'SUV', ...mappedCategories.filter(cat => cat !== 'SUV')];
  }



  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/admin/vehicles`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });

        if (!res.ok) throw new Error('Failed to fetch vehicles');
        const data = await res.json();

        const formatted = data.vehicles.map((v) => ({
          model: `${v.brand} ${v.vehicleModel}`,
          license: v.vehicleNumber,
          status: v.status,
          rate: `₹${v.rentPerDay}/day`,
          location: `${v.assignedLocation?.name || 'N/A'}, ${v.assignedLocation?.city || ''}`,
          image: v.vehicleImage || '',
          category: v.vehicleType || 'CAR',
          brand: v.brand,
          fuel: v.fuelType || 'Petrol',
          managerName: v.managerId?.name || 'N/A',
        }));

        setVehicles(formatted);
      } catch (err) {
        console.error('❌ Error fetching vehicles:', err.message);
        setError('Failed to load vehicles. Please check your connection or try again later.');
      } finally {
        setLoading(false);
      }
    };

    const fetchLocations = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/admin/locations`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });

        if (!res.ok) throw new Error('Failed to fetch locations');
        const data = await res.json();
        setLocations(data);
      } catch (err) {
        console.error('❌ Error fetching locations:', err.message);
      }
    };

    fetchVehicles();
    fetchLocations();
  }, []);

  // Extract unique cities from locations
  const cities = ['All', ...new Set(locations.map(loc => loc.city).filter(Boolean))];

  // Filter locations based on selected city
  const filteredLocations = selectedCity === 'All' ? locations : locations.filter(loc => loc.city === selectedCity);

  const filteredVehicles = vehicles.filter((vehicle) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      vehicle.model.toLowerCase().includes(term) ||
      vehicle.license.toLowerCase().includes(term) ||
      vehicle.brand.toLowerCase().includes(term);

    const vehicleCategoryNormalized = vehicle.category?.toLowerCase();
    const selectedCategoryNormalized = Object.keys(categoryMap).find(key => categoryMap[key] === selectedCategory) || selectedCategory.toLowerCase();

    const matchesCategory = selectedCategory === 'All' || vehicleCategoryNormalized === selectedCategoryNormalized;

    // Hierarchical filtering: first by city, then by location
    const matchesCity = selectedCity === 'All' || vehicle.location.includes(selectedCity);
    const matchesLocation = selectedLocation === 'All' || vehicle.location.includes(selectedLocation);

    return matchesSearch && matchesCategory && matchesCity && matchesLocation;
  });

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'available': return '#000000';
      case 'rented': return '#666666';
      case 'maintenance': return '#999999';
      default: return '#cccccc';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'car': return <Car size={16} />;
      case 'bike': return <Bike size={16} />;
      case 'suv': return <Car size={16} />;
      case 'truck': return <Truck size={16} />;
      default: return <Car size={16} />;
    }
  };

  return (
    <div className={styles.vehicleManagement}>
      <div className={styles.header}>
        <h1 className={styles.title}>Vehicle Fleet Dashboard</h1>
        <p className={styles.subtitle}>Comprehensive vehicle management and monitoring system</p>
      </div>

      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by model, brand, or license plate..."
            value={searchTerm}
            onChange={handleSearchChange}
            className={styles.searchField}
          />
        </div>

        <div className={styles.filterRow}>
          <div className={styles.filterItem}>
            <label className={styles.filterLabel}>
              <Filter size={14} />
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={styles.selectField}
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'All' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterItem}>
            <label className={styles.filterLabel}>
              <MapPin size={14} />
              City
            </label>
            <select
              value={selectedCity}
              onChange={(e) => {
                setSelectedCity(e.target.value);
                setSelectedLocation('All'); // Reset location when city changes
              }}
              className={styles.selectField}
            >
              {cities.map(city => (
                <option key={city} value={city}>
                  {city === 'All' ? 'All Cities' : city}
                </option>
              ))}
            </select>
          </div>

          {selectedCity !== 'All' && (
            <div className={styles.filterItem}>
              <label className={styles.filterLabel}>
                <MapPin size={14} />
                Location
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className={styles.selectField}
              >
                <option value="All">All Locations</option>
                {filteredLocations.map(location => (
                  <option key={location._id} value={location.name}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={styles.resultCount}>
            <span className={styles.countText}>
              {filteredVehicles.length} {filteredVehicles.length === 1 ? 'Vehicle' : 'Vehicles'}
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading vehicle fleet...</p>
        </div>
      ) : error ? (
        <div className={styles.error}>
          <X size={48} />
          <p className={styles.errorText}>{error}</p>
        </div>
      ) : filteredVehicles.length > 0 ? (
        <div className={styles.grid}>
          {filteredVehicles.map((vehicle, index) => (
            <div key={index} className={styles.card}>
              <div className={styles.imageWrapper}>
                <img
                  src={`${backendUrl}/uploads/vehicles/${encodeURIComponent(vehicle.image)}`}
                  alt={vehicle.model}
                  className={styles.image}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/assets/default-vehicle.png';
                  }}
                />
                <div className={styles.rate}>{vehicle.rate}</div>
              </div>

              <div className={styles.content}>
                <div className={styles.categoryBadge}>
                  {getCategoryIcon(vehicle.category)}
                  <span>{vehicle.category}</span>
                </div>

                <h3 className={styles.vehicleName}>{vehicle.model}</h3>

                <div className={styles.details}>
                  <div className={styles.detail}>
                    <CreditCard size={16} />
                    <span className={styles.detailLabel}>License:</span>
                    <span className={styles.detailText}>{vehicle.license}</span>
                  </div>

                  <div className={styles.detail}>
                    <Fuel size={16} />
                    <span className={styles.detailLabel}>Fuel:</span>
                    <span className={styles.detailText}>{vehicle.fuel}</span>
                  </div>

                  <div className={styles.detail}>
                    <MapPin size={16} />
                    <span className={styles.detailLabel}>Location:</span>
                    <span className={styles.detailText}>{vehicle.location}</span>
                  </div>

                  <div className={styles.detail}>
                    <User size={16} />
                    <span className={styles.detailLabel}>Manager:</span>
                    <span className={styles.detailText}>{vehicle.managerName}</span>
                  </div>
                </div>

                <div className={styles.statusWrapper}>
                  <div
                    className={styles.status}
                    style={{ backgroundColor: getStatusColor(vehicle.status) }}
                  >
                    {vehicle.status}
                  </div>
                </div>
              </div>

              <div className={styles.footer}>
                <button className={styles.actionBtn}>
                  View Details
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <Car size={64} strokeWidth={1} />
          <h3 className={styles.emptyTitle}>No Vehicles Found</h3>
          <p className={styles.emptyText}>
            {searchTerm || selectedCategory !== 'All' || selectedLocation !== 'All'
              ? 'Try adjusting your search criteria or filters.'
              : 'No vehicles have been added to the system yet. Please contact a Manager to add vehicles.'}
          </p>
          {(searchTerm || selectedCategory !== 'All' || selectedCity !== 'All' || selectedLocation !== 'All') && (
            <button
              className={styles.clearBtn}
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
                setSelectedCity('All');
                setSelectedLocation('All');
              }}
            >
              <X size={16} />
              Clear Filters
            </button>
          )}
        </div>
      )}


    </div>
  );
};

export default ManageVehicles;