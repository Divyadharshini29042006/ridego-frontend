// frontend/src/components/VehicleMap.jsx
import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons based on vehicle status
const createCustomIcon = (status) => {
  const colorMap = {
    'Available': '#22c55e',
    'Booked': '#3b82f6',
    'Maintenance': '#ef4444',
    'Completed': '#6b7280'
  };

  const color = colorMap[status] || '#6b7280';

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
          <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
        </svg>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });
};

// Component to auto-fit bounds when vehicles change
const MapBoundsUpdater = ({ vehicles }) => {
  const map = useMap();

  useEffect(() => {
    if (vehicles && vehicles.length > 0) {
      const bounds = L.latLngBounds(
        vehicles.map(v => [v.currentLocation.lat, v.currentLocation.lng])
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
  }, [vehicles, map]);

  return null;
};

const VehicleMap = ({ vehicles }) => {
  const mapRef = useRef(null);

  // Set default center to Puducherry
  const defaultCenter = [11.9416, 79.8083];

  const getCenter = () => {
    if (!vehicles || vehicles.length === 0) {
      return defaultCenter;
    }

    const validVehicles = vehicles.filter(
      v => v.location?.lat && v.location?.lng
    );

    if (validVehicles.length === 0) {
      return defaultCenter;
    }

    const avgLat = validVehicles.reduce((sum, v) => sum + v.location.lat, 0) / validVehicles.length;
    const avgLng = validVehicles.reduce((sum, v) => sum + v.location.lng, 0) / validVehicles.length;

    return [avgLat, avgLng];
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const validVehicles = vehicles?.filter(
    v => v.location?.lat && v.location?.lng
  ) || [];

  return (
    <div style={{
      height: '400px',
      width: '100%',
      borderRadius: '12px',
      overflow: 'hidden',
      border: '1px solid #e5e5e5'
    }}>
      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {validVehicles.map((vehicle) => {
          if (!vehicle.location?.lat || !vehicle.location?.lng) return null;

          return (
            <Marker
              key={vehicle._id}
              position={[vehicle.location.lat, vehicle.location.lng]}
              icon={createCustomIcon(vehicle.status)}
            >
              <Popup>
                {vehicle.vehicleModel} ({vehicle.vehicleNumber})<br/>
                Status: {vehicle.status}<br/>
                Location: {vehicle.subLocation}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default VehicleMap;