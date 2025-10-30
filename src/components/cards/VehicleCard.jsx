// VehicleCard.jsx
import React from 'react';
import { FaEdit, FaTrash, FaMapMarkerAlt } from 'react-icons/fa';
import { getVehicleImageUrl, handleImageError } from '../../utils/imageUtils';
import styles from '../../styles/VehicleCard.module.css';

const VehicleCard = ({ vehicle, onEdit, onDelete, onStatusChange, onTrack }) => {
  const {
    vehicleModel,
    brand,
    color,
    vehicleType,
    fuelType,
    transmission,
    seatingCapacity,
    rentPerDay,
    depositAmount,
    vehicleNumber,
    vehicleImage,
    status,
    modelYear,
    assignedDriver,
  } = vehicle;

  const imageURL = getVehicleImageUrl(vehicleImage);

  return (
    <div className={styles['vehicle-card']}>
      <img
        src={imageURL}
        alt={`${brand} ${vehicleModel}`}
        className={styles['vehicle-image']}
        onError={handleImageError}
      />

      <div className={styles['vehicle-status']}>
        <select
          value={status}
          onChange={(e) => onStatusChange(vehicle._id, e.target.value)}
        >
          <option value="Available">Available</option>
          <option value="Booked">Booked</option>
          <option value="Maintenance">Maintenance</option>
        </select>
      </div>

      <div className={styles['vehicle-details']}>
        <h4>{brand} {vehicleModel} • {modelYear}</h4>

        <div className={styles['details-row']}>
          <div className={styles['detail-item']}>
            <span className={styles['detail-label']}>TYPE:</span>
            <span className={styles['detail-value']}>{vehicleType}</span>
          </div>
          <div className={`${styles['detail-badge']} ${styles['fuel-badge']}`}>{fuelType}</div>
        </div>

        <div className={styles['details-row']}>
          <div className={styles['detail-item']}>
            <span className={styles['detail-label']}>COLOR:</span>
            <span className={styles['detail-value']}>{color}</span>
          </div>
          <div className={`${styles['detail-badge']} ${styles['transmission-badge']}`}>{transmission}</div>
        </div>

        <div className={styles['details-row']}>
          <div className={styles['detail-item']}>
            <span className={styles['detail-label']}>SEATS:</span>
            <span className={styles['detail-value']}>{seatingCapacity}</span>
          </div>
          <div className={styles['detail-item']}>
            <span className={styles['detail-label']}>PLATE:</span>
            <span className={styles['detail-value']}>{vehicleNumber}</span>
          </div>
        </div>

        <div className={styles['price-section']}>
          <div>
            <div className={styles['rent-price']}>₹{rentPerDay}</div>
            <div className={styles['price-label']}>per day</div>
          </div>
          <div>
            <div className={styles['deposit-amount']}>₹{depositAmount}</div>
            <div className={styles['deposit-label']}>deposit</div>
          </div>
        </div>

        {assignedDriver && (
          <div className={styles['driver-info']}>
            <h5>Assigned Driver</h5>
            <div className={styles['driver-details']}>
              <div className={styles['driver-item']}>
                <span className={styles['driver-label']}>NAME:</span>
                <span className={styles['driver-value']}>{assignedDriver.name}</span>
              </div>
              <div className={styles['driver-item']}>
                <span className={styles['driver-label']}>PHONE:</span>
                <span className={styles['driver-value']}>{assignedDriver.phone}</span>
              </div>
              <div className={styles['driver-item']}>
                <span className={styles['driver-label']}>LOCATION:</span>
                <span className={styles['driver-value']}>{assignedDriver.subLocation}</span>
              </div>
              <div className={`${styles['driver-badge']} ${styles[`status-${assignedDriver.status?.toLowerCase()}`]}`}>
                {assignedDriver.status}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={styles['vehicle-actions']}>
        <button onClick={() => onEdit(vehicle)}>
          <FaEdit />
          <span>Edit</span>
        </button>
        <button onClick={() => onDelete(vehicle._id)}>
          <FaTrash />
          <span>Delete</span>
        </button>
        <button onClick={() => onTrack(vehicle)} className={styles['track-btn']}>
          <FaMapMarkerAlt />
          <span>Track</span>
        </button>
      </div>
    </div>
  );
};

export default VehicleCard;