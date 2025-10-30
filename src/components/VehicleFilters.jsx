import React, { useState, useEffect } from "react";
import { FaMapMarkerAlt, FaCar, FaMotorcycle, FaGasPump, FaRoad } from "react-icons/fa";
import axios from "axios";
import "../styles/VehicleFilters.css";



const vehicleTypes = [
  { label: "Car", icon: <FaCar /> },
  { label: "Bike", icon: <FaMotorcycle /> },
];

const fuelTypes = ["Petrol", "Diesel", "Electric"];


const VehicleFilters = ({
  selectedMainLocation,
  setSelectedMainLocation,
  selectedSubLocation,
  setSelectedSubLocation,
  selectedVehicleType,
  setSelectedVehicleType,
  selectedFuelType,
  setSelectedFuelType,
}) => {
  const [locations, setLocations] = useState([]);
  const [availableSubCities, setAvailableSubCities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all locations on component mount
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:5000/api/locations/public");
        console.log('📍 Fetched locations:', res.data);
        setLocations(res.data);
      } catch (error) {
        console.error("❌ Error fetching locations:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLocations();
  }, []);

  // Update available subCities when main location changes
 useEffect(() => {
  if (selectedMainLocation) {
    // Get all locations with the selected city
    const cityLocations = locations.filter(
      loc => loc.city.trim().toLowerCase() === selectedMainLocation.trim().toLowerCase()
    );

    // Extract location names as subLocations
    const subLocs = cityLocations.map(loc => loc.name);
    
    console.log(`SubLocations for ${selectedMainLocation}:`, subLocs);
    setAvailableSubCities(subLocs);
  } else {
    setAvailableSubCities([]);
  }
}, [selectedMainLocation, locations]);
  const handleMainLocationChange = (e) => {
    const newCity = e.target.value;
    console.log('📍 Main location changed to:', newCity);
    setSelectedMainLocation(newCity);
    setSelectedSubLocation(""); // Reset sub-location when main location changes
  };

  const handleSubLocationChange = (e) => {
    const newSubLocation = e.target.value;
    console.log('🏘️ Sub-location changed to:', newSubLocation);
    setSelectedSubLocation(newSubLocation);
  };

  // Get unique cities from locations
  const uniqueCities = [...new Set(locations.map(loc => loc.city))].sort();

  return (
    <aside className="vehicle-filters-sidebar" role="complementary" aria-label="Vehicle Filters Sidebar">
      {/* Location Section */}
      <div className="filter-section location-section">
        <label className="filter-label" htmlFor="main-location-select">
          <FaMapMarkerAlt className="filter-icon" aria-hidden="true" /> Location
        </label>
        
        {loading ? (
          <div className="loading-select">Loading locations...</div>
        ) : (
          <>
            {/* Main Location (City) Dropdown */}
            <select
              id="main-location-select"
              className="filter-select"
              value={selectedMainLocation}
              onChange={handleMainLocationChange}
              aria-controls="sub-location-select"
              aria-haspopup="listbox"
            >
              <option value="">Select City</option>
              {uniqueCities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>

            {/* Sub-Location Dropdown - Only show when main location is selected */}
            {selectedMainLocation && (
              availableSubCities.length > 0 ? (
                <select
                  id="sub-location-select"
                  className="filter-select sub-location-select"
                  value={selectedSubLocation}
                  onChange={handleSubLocationChange}
                  aria-label="Select Sub-Location"
                >
                  <option value="">All Areas</option>
                  {availableSubCities.map((subCity) => (
                    <option key={subCity} value={subCity}>
                      {subCity}
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  id="sub-location-select"
                  className="filter-select sub-location-select"
                  disabled
                  aria-label="No sub-locations available"
                >
                  <option>No sub-locations available</option>
                </select>
              )
            )}

            {/* Display selected location info */}
            {selectedMainLocation && (
              <div className="selected-location-info">
                <small>
                  📍 {selectedMainLocation}
                  {selectedSubLocation && ` • ${selectedSubLocation}`}
                </small>
              </div>
            )}
          </>
        )}
      </div>



      {/* Vehicle Type Section */}
      <div className="filter-section vehicle-type-section" role="radiogroup" aria-labelledby="vehicle-type-label">
        <label id="vehicle-type-label" className="filter-label">
          <FaCar className="filter-icon" aria-hidden="true" /> Vehicle Type
        </label>
        {vehicleTypes.map(({ label, icon }) => (
          <label key={label} className="filter-radio-label">
            <input
              type="radio"
              name="vehicleType"
              value={label}
              checked={selectedVehicleType === label}
              onChange={() => setSelectedVehicleType(label)}
              aria-checked={selectedVehicleType === label}
            />
            <span className="vehicle-icon" aria-hidden="true">{icon}</span> {label}
          </label>
        ))}
      </div>

      {/* Fuel Type Section */}
      <div className="filter-section fuel-type-section" role="radiogroup" aria-labelledby="fuel-type-label">
        <label id="fuel-type-label" className="filter-label">
          <FaGasPump className="filter-icon" aria-hidden="true" /> Fuel Type
        </label>
        {fuelTypes.map((fuel) => (
          <label key={fuel} className="filter-radio-label">
            <input
              type="radio"
              name="fuelType"
              value={fuel}
              checked={selectedFuelType === fuel}
              onChange={() => setSelectedFuelType(fuel)}
              aria-checked={selectedFuelType === fuel}
            />
            {fuel}
          </label>
        ))}
      </div>
    </aside>
  );
};

export default VehicleFilters;
