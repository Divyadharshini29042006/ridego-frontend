//src/pages/common/Vehicles.jsx

import React, { useEffect, useState } from "react";
import vehicleAPI from "../../api/vehicleAPI";
import { useNavigate } from "react-router-dom";
import {
  FaUsers,
  FaGasPump,
  FaCogs,
} from "react-icons/fa";
import carImg from "../../assets/carhome.png";
import "../../styles/Vehicles.css";
import VehicleFilters from "../../components/VehicleFilters";
import Chatbot from "../../components/Chatbot";

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);

  // Filter states lifted here
  const [selectedMainLocation, setSelectedMainLocation] = useState("");
  const [selectedSubLocation, setSelectedSubLocation] = useState("");
  const [selectedVehicleType, setSelectedVehicleType] = useState("");
  const [selectedFuelType, setSelectedFuelType] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchVehicles = async () => {
      setLoadingVehicles(true);
      try {
        // Prepare filters for API call
        const filters = {};
        if (selectedMainLocation) filters.city = selectedMainLocation;
        if (selectedSubLocation && selectedSubLocation !== "") filters.subLocation = selectedSubLocation;
        if (selectedVehicleType) filters.vehicleType = selectedVehicleType;
        if (selectedFuelType) filters.fuelType = selectedFuelType;

        const data = await vehicleAPI.getPublicVehicles(filters);
        setVehicles(data);
      } catch (err) {
        console.error("Error fetching vehicles", err);
        setVehicles([]);
      } finally {
        setLoadingVehicles(false);
      }
    };

    fetchVehicles();
  }, [selectedMainLocation, selectedSubLocation, selectedVehicleType, selectedFuelType]);

  const filteredVehicles = vehicles;

  if (loadingVehicles) {
    return (
      <div className="vehicles-page-container">
        <div className="vehicles-loading-container">
          <p>Loading vehicles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="vehicles-page-layout">
      <VehicleFilters
        selectedMainLocation={selectedMainLocation}
        setSelectedMainLocation={setSelectedMainLocation}
        selectedSubLocation={selectedSubLocation}
        setSelectedSubLocation={setSelectedSubLocation}
        selectedVehicleType={selectedVehicleType}
        setSelectedVehicleType={setSelectedVehicleType}
        selectedFuelType={selectedFuelType}
        setSelectedFuelType={setSelectedFuelType}
      />
      <div className="vehicles-page-container">
        {/* Vehicle Listing */}
        <section className="vehicles-featured-section">
          {filteredVehicles.length === 0 ? (
            <div className="vehicles-empty-state">
              <h3>No vehicles found</h3>
              <p>Try searching with different filters.</p>
            </div>
          ) : (
            <div className="vehicles-grid">
              {filteredVehicles.map((car, index) => (
                <article
                  key={car._id || index}
                  className="vehicles-card"
                  onClick={() => navigate(`/vehicle/${car._id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="vehicles-image-wrapper">
                    <img
                      src={
                        car.vehicleImage
                          ? `http://localhost:5000/uploads/vehicles/${car.vehicleImage}`
                          : carImg
                      }
                      alt={`${car.brand} ${car.vehicleModel}`}
                      onError={(e) => {
                        e.target.src = carImg;
                      }}
                      loading={index < 6 ? "eager" : "lazy"}
                    />
                    <span className="vehicles-badge">Available Now</span>
                    <div className="vehicles-price-tag">
                      <span className="vehicles-price-amount">${car.rentPerDay}</span>
                      <span className="vehicles-price-period">/ day</span>
                    </div>
                  </div>
                  <div className="vehicles-info">
                    <h3>
                      {car.brand} {car.vehicleModel}
                    </h3>
                    <p>
                      {car.vehicleType} · {car.modelYear}
                    </p>
                    <div className="vehicles-meta">
                      <span>
                        <FaUsers aria-hidden="true" /> {car.seatingCapacity} Seats
                      </span>
                      <span>
                        <FaGasPump aria-hidden="true" /> {car.fuelType}
                      </span>
                      <span>
                        <FaCogs aria-hidden="true" /> {car.transmission}
                      </span>
                      <span>
                        {car.assignedLocation?.city || "N/A"}{car.subLocation ? ` - ${car.subLocation}` : ''}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
      <Chatbot />
    </div>
  );
};

export default Vehicles;

