//src/pages/common/Home.jsx
import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import {
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaWhatsapp,
  FaCarSide,
  FaGasPump,
  FaCogs,
  FaUsers,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import carImg from "../../assets/carhome.png";
import styles from "../../styles/Home.module.css";

const Home = () => {
  // ✅ Search states
  const [pickupCity, setPickupCity] = useState("");
  const [pickupDate, setPickupDate] = useState(null);
  const [returnDate, setReturnDate] = useState(null);
  const [locations, setLocations] = useState([]);
  const [locationsLoading, setLocationsLoading] = useState(true);

  // ✅ Vehicle states
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);

  // ✅ Newsletter state
  const [email, setEmail] = useState("");

  const navigate = useNavigate();

  // ✅ Fetch locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/locations/public");
        setLocations(res.data);
      } catch (err) {
        console.error("Error fetching locations", err);
      } finally {
        setLocationsLoading(false);
      }
    };
    fetchLocations();
  }, []);

  // ✅ Fetch vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/vehicles/public/vehicles");
        setVehicles(res.data);
      } catch (err) {
        console.error("Error fetching vehicles", err);
      } finally {
        setLoadingVehicles(false);
      }
    };
    fetchVehicles();
  }, []);

  const uniqueCities = Array.from(new Set(locations.map((loc) => loc.city)));

  // ✅ Handle Search
  const handleSearch = () => {
    if (!pickupCity || !pickupDate || !returnDate) {
      alert("Please fill all fields before searching!");
      return;
    }
    if (pickupDate > returnDate) {
      alert("Return date cannot be before pickup date!");
      return;
    }
    navigate(
      `/search-results?city=${encodeURIComponent(
        pickupCity
      )}&pickupDate=${pickupDate.toISOString()}&returnDate=${returnDate.toISOString()}`
    );
  };

  // ✅ Handle Newsletter Subscription
  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (email) {
      alert("Thank you for subscribing!");
      setEmail("");
    }
  };

  // ✅ Handle Explore All Cars
  const handleExploreAllCars = () => {
    navigate('/vehicles');
  };

  // ✅ Handle Vehicle Card Click - Navigate to Vehicle Details
  const handleVehicleClick = (vehicle) => {
    navigate(`/vehicle/${vehicle._id}`, {
      state: {
        selectedLocation: vehicle.assignedLocation?.city || pickupCity || null,
        selectedSubLocation: ''
      }
    });
  };

  return (
    <div className={styles.homeContainer}>
      {/* Title */}
      <h1 className={styles.title}>
        <FaCarSide className={styles.titleIcon} /> Luxury Cars on Rent
      </h1>

      {/* Search Box */}
      <div className={styles.searchBox}>
        {/* Pickup Location */}
        <div className={styles.inputGroup}>
          <label htmlFor="pickup-city">Pickup Location</label>
          <div className={styles.inputWrapper}>
            <FaMapMarkerAlt className={styles.icon} />
            <select
              id="pickup-city"
              value={pickupCity}
              onChange={(e) => setPickupCity(e.target.value)}
              disabled={locationsLoading}
              aria-label="Select pickup location"
            >
              <option value="">
                {locationsLoading ? "Loading locations..." : "Select a location"}
              </option>
              {uniqueCities.map((city, index) => (
                <option key={index} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Pickup Date */}
        <div className={styles.inputGroup}>
          <label htmlFor="pickup-date">Pick-up Date</label>
          <div className={styles.inputWrapper}>
            <FaCalendarAlt className={styles.icon} />
            <DatePicker
              id="pickup-date"
              selected={pickupDate}
              onChange={(date) => setPickupDate(date)}
              dateFormat="dd-MM-yyyy"
              placeholderText="dd-mm-yyyy"
              minDate={new Date()}
              aria-label="Select pickup date"
            />
          </div>
        </div>

        {/* Return Date */}
        <div className={styles.inputGroup}>
          <label htmlFor="return-date">Return Date</label>
          <div className={styles.inputWrapper}>
            <FaCalendarAlt className={styles.icon} />
            <DatePicker
              id="return-date"
              selected={returnDate}
              onChange={(date) => setReturnDate(date)}
              dateFormat="dd-MM-yyyy"
              placeholderText="dd-mm-yyyy"
              minDate={pickupDate || new Date()}
              aria-label="Select return date"
            />
          </div>
        </div>

        {/* Search Button */}
        <button onClick={handleSearch} className={styles.searchBtn} aria-label="Search for vehicles">
          Search
        </button>
      </div>

      {/* Car Banner */}
      <div className={styles.carImage}>
        <img src={carImg} alt="Luxury Car Banner" />
      </div>


      {/* Featured Vehicles Section */}
      <section className={styles.featuredVehiclesSection}>
        <h2 className={styles.sectionTitle}>Featured Vehicles</h2>
        <p className={styles.sectionSubtitle}>
          Explore our selection of premium vehicles available for your next adventure.
        </p>

        {loadingVehicles ? (
          <div className={styles.loadingContainer}>
            <p>Loading vehicles...</p>
          </div>
        ) : (
          <>
            <div className={styles.vehicleGridHome}>
              {vehicles.slice(0, 6).map((vehicle, index) => (
                <article
                  key={vehicle._id || index}
                  className={styles.homeVehicleCard}
                  onClick={() => handleVehicleClick(vehicle)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={styles.imageWrapper}>
                    <img
                      src={vehicle.vehicleImage ? `http://localhost:5000/uploads/vehicles/${vehicle.vehicleImage}` : carImg}
                      alt={`${vehicle.brand} ${vehicle.vehicleModel}`}
                      onError={(e) => {
                        e.target.src = carImg;
                      }}
                      loading={index < 3 ? "eager" : "lazy"}
                    />
                    <span className={styles.badge}>Available Now</span>
                    <span className={styles.price}>{vehicle.rentPerDay} / day</span>
                  </div>
                  <div className={styles.vehicleInfo}>
                    <h3>{vehicle.brand} {vehicle.vehicleModel}</h3>
                    <p>
                      {vehicle.vehicleType} · {vehicle.modelYear}
                    </p>
                    <div className={styles.vehicleMeta}>
                      <span>
                        <FaUsers aria-hidden="true" /> {vehicle.seatingCapacity} Seats
                      </span>
                      <span>
                        <FaGasPump aria-hidden="true" /> {vehicle.fuelType}
                      </span>
                      <span>
                        <FaCogs aria-hidden="true" /> {vehicle.transmission}
                      </span>
                      <span>
                        <FaMapMarkerAlt aria-hidden="true" /> {vehicle.assignedLocation?.city || 'N/A'}{vehicle.subLocation ? ` - ${vehicle.subLocation}` : ''}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <div className={styles.exploreButtonContainer}>
              <button onClick={handleExploreAllCars} className={styles.exploreAllBtn} aria-label="Explore all cars">
                Explore all cars →
              </button>
            </div>
          </>
        )}
      </section>

      {/* Promotional Section */}
      <section className={styles.promoSection}>
        <div className={styles.promoContent}>
          <div className={styles.promoText}>
            <h2>Do You Own a Luxury Car?</h2>
            <p>
              Monetize your vehicle effortlessly by listing it on CarRental.
              We take care of insurance, driver verification and secure payments — so
              you can earn passive income, stress-free.
            </p>
            <button className={styles.listCarBtn} onClick={() => navigate('/list-car')}>
              List your car
            </button>
          </div>
          <div className={styles.promoImage}>
            <img src={carImg} alt="BMW Luxury Car" />
          </div>
        </div>
      </section>

      {/* Customer Testimonials */}
      <section className={styles.testimonialsSection}>
        <h2 className={styles.sectionTitle}>What Our Customers Say</h2>
        <p className={styles.sectionSubtitle}>
          Discover why discerning travelers choose CarRental for their luxury accommodations
          around the world.
        </p>
        <div className={styles.testimonialsGrid}>
          <article className={styles.testimonialCard}>
            <div className={styles.reviewerInfo}>
              <img
                src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face"
                alt="Emma Rodriguez"
                className={styles.reviewerAvatar}
                loading="lazy"
              />
              <div>
                <h4>Emma Rodriguez</h4>
                <p>Barcelona, Spain</p>
              </div>
            </div>
            <div className={styles.stars} aria-label="5 out of 5 stars">⭐⭐⭐⭐⭐</div>
            <p className={styles.testimonialText}>
              "I've rented cars from various companies, but the experience with CarRental was exceptional."
            </p>
          </article>

          <article className={styles.testimonialCard}>
            <div className={styles.reviewerInfo}>
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face"
                alt="John Smith"
                className={styles.reviewerAvatar}
                loading="lazy"
              />
              <div>
                <h4>John Smith</h4>
                <p>New York, USA</p>
              </div>
            </div>
            <div className={styles.stars} aria-label="5 out of 5 stars">⭐⭐⭐⭐⭐</div>
            <p className={styles.testimonialText}>
              "CarRental made my trip so much easier. The car was delivered right to my door, and the customer service was fantastic!"
            </p>
          </article>

          <article className={styles.testimonialCard}>
            <div className={styles.reviewerInfo}>
              <img
                src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face"
                alt="Ava Johnson"
                className={styles.reviewerAvatar}
                loading="lazy"
              />
              <div>
                <h4>Ava Johnson</h4>
                <p>Sydney, Australia</p>
              </div>
            </div>
            <div className={styles.stars} aria-label="5 out of 5 stars">⭐⭐⭐⭐⭐</div>
            <p className={styles.testimonialText}>
              "I highly recommend CarRental! Their fleet is amazing, and I always feel like I'm getting the best deal with excellent service."
            </p>
          </article>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className={styles.newsletterSection}>
        <h2 className={styles.sectionTitle}>Never Miss a Deal!</h2>
        <p className={styles.sectionSubtitle}>
          Subscribe to get the latest offers, new arrivals, and exclusive discounts
        </p>
        <form onSubmit={handleNewsletterSubmit} className={styles.newsletterForm}>
          <input
            type="email"
            placeholder="Enter your email id"
            className={styles.newsletterInput}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-label="Email address for newsletter subscription"
          />
          <button type="submit" className={styles.newsletterBtn}>Subscribe</button>
        </form>
      </section>

      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/6379527577"
        className={styles.whatsappFloat}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contact us on WhatsApp"
      >
        <FaWhatsapp size={30} />
      </a>
    </div>
  );
};

export default Home;