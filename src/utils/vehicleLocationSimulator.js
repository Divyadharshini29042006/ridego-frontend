// src/utils/vehicleLocationSimulator.js

import vehicleAPI from '../api/vehicleAPI.js';

/**
 * Vehicle Location Simulator
 * Simulates vehicle location updates within the vehicle's assigned city/location
 */
class VehicleLocationSimulator {
  constructor() {
    this.intervals = new Map(); // Store interval IDs for each vehicle
    this.isRunning = new Map(); // Track running state for each vehicle
    this.vehicleCache = new Map(); // Cache vehicle data to avoid repeated API calls
    this.lastLocation = new Map(); // Track last known location for incremental movement
    this.speedMultiplier = new Map(); // Speed multiplier for each vehicle (default 1.0)

    // City bounds mapping (can be expanded or fetched dynamically)
    this.cityBounds = {
      'Chennai': { north: 13.2, south: 12.8, east: 80.3, west: 80.1 },
      'Mumbai': { north: 19.3, south: 18.9, east: 72.9, west: 72.8 },
      'Delhi': { north: 28.9, south: 28.4, east: 77.3, west: 77.0 },
      'Bangalore': { north: 13.1, south: 12.9, east: 77.7, west: 77.5 },
      'Hyderabad': { north: 17.5, south: 17.3, east: 78.5, west: 78.4 },
      'Kolkata': { north: 22.7, south: 22.5, east: 88.4, west: 88.3 },
      'Pune': { north: 18.6, south: 18.4, east: 73.9, west: 73.8 },
      // Add more cities as needed
    };
  }

  /**
   * Get city bounds for a given city name
   * @param {string} city - City name
   * @returns {Object} Bounds object with north, south, east, west
   */
  getCityBounds(city) {
    const normalizedCity = city.trim().toLowerCase();
    const bounds = Object.keys(this.cityBounds).find(key =>
      key.toLowerCase() === normalizedCity
    );

    if (bounds) {
      return this.cityBounds[bounds];
    }

    // Default to Chennai if city not found
    console.warn(`⚠️ City "${city}" not found in bounds mapping, using Chennai as default`);
    return this.cityBounds['Chennai'];
  }

  /**
   * Fetch and cache vehicle data
   * @param {string} vehicleId - Vehicle ID
   * @returns {Object} Vehicle data with assignedLocation
   */
  async getVehicleData(vehicleId) {
    if (this.vehicleCache.has(vehicleId)) {
      return this.vehicleCache.get(vehicleId);
    }

    try {
      const vehicle = await vehicleAPI.getPublicVehicleById(vehicleId);
      this.vehicleCache.set(vehicleId, vehicle);
      return vehicle;
    } catch (error) {
      console.error(`❌ Failed to fetch vehicle data for ${vehicleId}:`, error);
      throw error;
    }
  }

  /**
   * Generate random latitude/longitude within the vehicle's assigned location bounds
   * @param {string} vehicleId - Vehicle ID
   * @returns {Object} {lat, lng}
   */
  async generateRandomLocation(vehicleId) {
    const vehicle = await this.getVehicleData(vehicleId);
    const location = vehicle.assignedLocation;

    if (!location || !location.lat || !location.lng || !location.radius) {
      throw new Error(`Vehicle ${vehicleId} has no valid assigned location coordinates`);
    }

    // Generate random point within the location's radius
    const angle = Math.random() * 2 * Math.PI;
    const radius = Math.random() * location.radius;

    const lat = location.lat + radius * Math.cos(angle);
    const lng = location.lng + radius * Math.sin(angle);

    return { lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) };
  }

  /**
   * Generate incremental location from current position
   * @param {string} vehicleId - Vehicle ID
   * @returns {Object} {lat, lng}
   */
  async generateIncrementalLocation(vehicleId) {
    const vehicle = await this.getVehicleData(vehicleId);
    const location = vehicle.assignedLocation;
    const speedMultiplier = this.speedMultiplier.get(vehicleId) || 1.0;

    if (!location || !location.lat || !location.lng || !location.radius) {
      throw new Error(`Vehicle ${vehicleId} has no valid assigned location coordinates`);
    }

    // Get current location or generate random starting point
    let currentLat, currentLng;
    if (this.lastLocation.has(vehicleId)) {
      const lastLoc = this.lastLocation.get(vehicleId);
      currentLat = lastLoc.lat;
      currentLng = lastLoc.lng;
    } else if (vehicle.currentLocation?.lat && vehicle.currentLocation?.lng) {
      currentLat = vehicle.currentLocation.lat;
      currentLng = vehicle.currentLocation.lng;
    } else {
      // Generate random starting location
      const randomLoc = await this.generateRandomLocation(vehicleId);
      currentLat = randomLoc.lat;
      currentLng = randomLoc.lng;
    }

    // Available vehicles should stay stationary at their sublocation
    if (vehicle.status === 'Available') {
      const newLocation = {
        lat: parseFloat(currentLat.toFixed(6)),
        lng: parseFloat(currentLng.toFixed(6))
      };
      this.lastLocation.set(vehicleId, newLocation);
      return newLocation;
    }

    // Calculate small random increments (simulate realistic movement) for non-available vehicles
    const maxIncrement = 0.001 * speedMultiplier; // ~100 meters at equator
    const latIncrement = (Math.random() - 0.5) * 2 * maxIncrement;
    const lngIncrement = (Math.random() - 0.5) * 2 * maxIncrement;

    let newLat = currentLat + latIncrement;
    let newLng = currentLng + lngIncrement;

    // Calculate distance from location center
    const distanceFromCenter = Math.sqrt(
      Math.pow(newLat - location.lat, 2) + Math.pow(newLng - location.lng, 2)
    );

    // If new location is outside the radius, generate a new random location within bounds
    if (distanceFromCenter > location.radius) {
      console.warn(`⚠️ Location out of bounds for ${vehicleId}, generating new random location`);
      const randomLoc = await this.generateRandomLocation(vehicleId);
      newLat = randomLoc.lat;
      newLng = randomLoc.lng;
    }

    const newLocation = {
      lat: parseFloat(newLat.toFixed(6)),
      lng: parseFloat(newLng.toFixed(6))
    };

    // Store as last location
    this.lastLocation.set(vehicleId, newLocation);

    return newLocation;
  }

  /**
   * Start simulating location updates for a vehicle
   * @param {string} vehicleId - Vehicle ID
   * @param {number} intervalMs - Update interval in milliseconds (default: 5000ms)
   */
  async startSimulation(vehicleId, intervalMs = 5000) {
    if (this.isRunning.get(vehicleId)) {
      console.log(`📍 Simulation already running for vehicle ${vehicleId}`);
      return;
    }

    try {
      // Validate vehicle exists and has location
      await this.getVehicleData(vehicleId);

      console.log(`🚀 Starting location simulation for vehicle ${vehicleId} (every ${intervalMs}ms)`);

      this.isRunning.set(vehicleId, true);

      const intervalId = setInterval(async () => {
        try {
          const location = await this.generateIncrementalLocation(vehicleId);

          console.log(`📍 Updating vehicle ${vehicleId} location: lat=${location.lat}, lng=${location.lng}`);

          const response = await vehicleAPI.updateVehicleLocation(vehicleId, location.lat, location.lng);

          console.log(`✅ Location updated successfully for vehicle ${vehicleId}`, response);
        } catch (error) {
          console.error(`❌ Failed to update location for vehicle ${vehicleId}:`, error);
          // Optionally stop simulation on persistent errors
          // this.stopSimulation(vehicleId);
        }
      }, intervalMs);

      this.intervals.set(vehicleId, intervalId);
    } catch (error) {
      console.error(`❌ Failed to start simulation for vehicle ${vehicleId}:`, error);
      this.isRunning.set(vehicleId, false);
    }
  }

  /**
   * Stop simulating location updates for a vehicle
   * @param {string} vehicleId - Vehicle ID
   */
  stopSimulation(vehicleId) {
    const intervalId = this.intervals.get(vehicleId);

    if (intervalId) {
      clearInterval(intervalId);
      this.intervals.delete(vehicleId);
      this.isRunning.set(vehicleId, false);
      console.log(`🛑 Stopped location simulation for vehicle ${vehicleId}`);
    } else {
      console.log(`📍 No active simulation found for vehicle ${vehicleId}`);
    }
  }

  /**
   * Stop all running simulations
   */
  stopAllSimulations() {
    console.log('🛑 Stopping all vehicle location simulations');

    for (const [vehicleId, intervalId] of this.intervals) {
      clearInterval(intervalId);
      this.isRunning.set(vehicleId, false);
    }

    this.intervals.clear();
    this.isRunning.clear();
  }

  /**
   * Check if simulation is running for a vehicle
   * @param {string} vehicleId - Vehicle ID
   * @returns {boolean} True if running
   */
  isSimulationRunning(vehicleId) {
    return this.isRunning.get(vehicleId) || false;
  }

  /**
   * Get all currently running simulations
   * @returns {Array} Array of vehicle IDs with active simulations
   */
  getRunningSimulations() {
    return Array.from(this.isRunning.entries())
      .filter(([_, running]) => running)
      .map(([vehicleId, _]) => vehicleId);
  }

  /**
   * Clear vehicle cache (useful if vehicle data changes)
   * @param {string} vehicleId - Optional: specific vehicle ID to clear, or all if not provided
   */
  clearCache(vehicleId) {
    if (vehicleId) {
      this.vehicleCache.delete(vehicleId);
      this.lastLocation.delete(vehicleId);
      this.speedMultiplier.delete(vehicleId);
    } else {
      this.vehicleCache.clear();
      this.lastLocation.clear();
      this.speedMultiplier.clear();
    }
  }

  /**
   * Reset vehicle position to a random location within its assigned city bounds
   * @param {string} vehicleId - Vehicle ID
   * @returns {Promise<Object>} New random location
   */
  async resetVehiclePosition(vehicleId) {
    try {
      const randomLocation = await this.generateRandomLocation(vehicleId);
      this.lastLocation.set(vehicleId, randomLocation);

      console.log(`🔄 Reset vehicle ${vehicleId} position to: lat=${randomLocation.lat}, lng=${randomLocation.lng}`);

      const response = await vehicleAPI.updateVehicleLocation(vehicleId, randomLocation.lat, randomLocation.lng);
      console.log(`✅ Vehicle position reset successfully for ${vehicleId}`, response);

      return randomLocation;
    } catch (error) {
      console.error(`❌ Failed to reset vehicle position for ${vehicleId}:`, error);
      throw error;
    }
  }

  /**
   * Increase speed multiplier for a vehicle
   * @param {string} vehicleId - Vehicle ID
   * @param {number} increment - Amount to increase speed (default: 0.5)
   */
  increaseSpeed(vehicleId, increment = 0.5) {
    const currentSpeed = this.speedMultiplier.get(vehicleId) || 1.0;
    const newSpeed = Math.min(currentSpeed + increment, 5.0); // Cap at 5.0
    this.speedMultiplier.set(vehicleId, newSpeed);
    console.log(`⚡ Increased speed for vehicle ${vehicleId} to ${newSpeed}x`);
  }

  /**
   * Decrease speed multiplier for a vehicle
   * @param {string} vehicleId - Vehicle ID
   * @param {number} decrement - Amount to decrease speed (default: 0.5)
   */
  decreaseSpeed(vehicleId, decrement = 0.5) {
    const currentSpeed = this.speedMultiplier.get(vehicleId) || 1.0;
    const newSpeed = Math.max(currentSpeed - decrement, 0.1); // Minimum 0.1
    this.speedMultiplier.set(vehicleId, newSpeed);
    console.log(`🐌 Decreased speed for vehicle ${vehicleId} to ${newSpeed}x`);
  }

  /**
   * Get current speed multiplier for a vehicle
   * @param {string} vehicleId - Vehicle ID
   * @returns {number} Speed multiplier
   */
  getSpeedMultiplier(vehicleId) {
    return this.speedMultiplier.get(vehicleId) || 1.0;
  }
}

// Export singleton instance
const vehicleLocationSimulator = new VehicleLocationSimulator();
export default vehicleLocationSimulator;
