const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import { confirmAlert } from 'react-confirm-alert';
import { MapPin, Edit2, Trash2, Download } from 'lucide-react';
import 'react-toastify/dist/ReactToastify.css';
import 'react-confirm-alert/src/react-confirm-alert.css';
import styles from '../../styles/ManageLocations.module.css';

function ManageLocations() {
  const [form, setForm] = useState({ name: '', city: '', state: '', managerId: '' });
  const [locations, setLocations] = useState([]);
  const [managers, setManagers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [searchCity, setSearchCity] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const pageSize = 5;

  const userRole = localStorage.getItem('role') || '';

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${backendUrl}/api/locations`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      const locationsWithManager = res.data.map(loc => ({
        ...loc,
        managerId: loc.managerId || null
      }));
      setLocations(locationsWithManager);
    } catch (err) {
      toast.error('Error fetching locations');
    } finally {
      setLoading(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/users?role=manager`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setManagers(res.data);
    } catch (err) {
      toast.error('Error fetching managers');
    }
  };

  useEffect(() => {
    fetchLocations();
    fetchManagers();
  }, []);

  useEffect(() => {
    if (editingId) {
      setTimeout(() => {
        const form = document.querySelector('form');
        if (form) {
          form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [editingId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      if (editingId) {
        await axios.put(`${backendUrl}/api/locations/${editingId}`, form, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        toast.success('Location updated');
      } else {
        await axios.post(`${backendUrl}/api/locations/create`, form, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        toast.success('Location created');
      }
      setForm({ name: '', city: '', state: '', managerId: '' });
      setEditingId(null);
      fetchLocations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving location');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (loc) => {
    setForm({
      name: loc.name || '',
      city: loc.city || '',
      state: loc.state || '',
      managerId: loc.managerId?._id || ''
    });
    setEditingId(loc._id);
  };

  const handleDelete = (id) => {
    confirmAlert({
      title: 'Confirm Delete',
      message: 'Are you sure you want to delete this location?',
      buttons: [
        {
          label: 'Yes',
          onClick: () => deleteLocation(id)
        },
        {
          label: 'No'
        }
      ]
    });
  };

  const deleteLocation = async (id) => {
    try {
      await axios.delete(`${backendUrl}/api/locations/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      toast.info('Location deleted');
      fetchLocations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting location');
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'City', 'State', 'Manager'];
    const rows = locations.map(loc => [
      loc.name,
      loc.city,
      loc.state || '',
      loc.managerId?.name || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(val => `"${val}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'locations.csv';
    link.click();
  };

  const filteredLocations = locations
    .filter((loc) => loc.city.toLowerCase().includes(searchCity.toLowerCase()))
    .sort((a, b) => a.city.localeCompare(b.city));
  const paginatedLocations = filteredLocations.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className={styles.container}>
      <ToastContainer />
      <h2>
        <MapPin />
        {editingId ? 'Edit Location' : 'Create Location'}
      </h2>

      <form onSubmit={handleSubmit}>
        <input name="name" placeholder="Location Name" value={form.name} onChange={handleChange} required />
        <input name="city" placeholder="City" value={form.city} onChange={handleChange} required />
        <input name="state" placeholder="State" value={form.state} onChange={handleChange} />
        <select name="managerId" value={form.managerId} onChange={handleChange}>
          <option value="">Select Manager (optional)</option>
          {managers.map((manager) => (
            <option key={manager._id} value={manager._id}>
              {manager.name} ({manager.email})
            </option>
          ))}
        </select>
        <button type="submit">{editingId ? 'Update' : 'Create'}</button>
        {editingId && (
          <button type="button" onClick={() => {
            setForm({ name: '', city: '', state: '', managerId: '' });
            setEditingId(null);
          }}>
            Cancel
          </button>
        )}
      </form>

      <h3>
        <MapPin />
        Existing Locations
      </h3>
      <input
        type="text"
        className={styles.searchInput}
        placeholder="Search by city"
        value={searchCity}
        onChange={(e) => {
          setSearchCity(e.target.value);
          setPage(1);
        }}
      />

      {userRole === 'admin' && (
        <button className={styles.exportBtn} onClick={exportToCSV}>
          <Download />
          Export to CSV
        </button>
      )}

      {loading ? (
        <div className={styles.spinner}>Loading...</div>
      ) : !paginatedLocations.length ? (
        <div className={styles.emptyState}>No locations found for "{searchCity}"</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>City</th>
              <th>State</th>
              <th>Manager</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLocations.map((loc) => (
              <tr key={loc._id}>
                <td data-label="Name">{loc.name}</td>
                <td data-label="City">{loc.city}</td>
                <td data-label="State">{loc.state || '—'}</td>
                <td data-label="Manager">{loc.managerId?.name || '—'}</td>
                <td data-label="Actions">
                  <div className={styles.actionButtons}>
                    <button
                      className={`${styles.actionBtn} ${styles.editBtn}`}
                      onClick={() => handleEdit(loc)}
                      aria-label="Edit location"
                    >
                      <Edit2 />
                    </button>
                    {userRole === 'admin' && (
                      <button
                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                        onClick={() => handleDelete(loc._id)}
                        aria-label="Delete location"
                      >
                        <Trash2 />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className={styles.pagination}>
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>◀ Prev</button>
        <button disabled={page * pageSize >= filteredLocations.length} onClick={() => setPage(page + 1)}>Next ▶</button>
      </div>
    </div>
  );
}

export default ManageLocations;