import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Users,
  Search,
  Filter,
  X,
  Download,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  User,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import styles from '../../styles/ManageManagers.module.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function ManageManagers() {
  const normalizeImagePath = (path) => {
    if (!path) return '';
    let normalized = path.replace(/\\\\/g, '/').replace(/\\/g, '/');
    if (!normalized.startsWith('uploads/managers/')) {
      normalized = 'uploads/managers/' + normalized;
    }
    return normalized;
  };

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    assignedLocation: ''
  });

  const [imageFile, setImageFile] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState('');
  const [managers, setManagers] = useState([]);
  const [filteredManagers, setFilteredManagers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('all');

  const fetchManagers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users?role=manager', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setManagers(res.data);
      setFilteredManagers(res.data);
    } catch (err) {
      toast.error('Error fetching managers');
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/locations', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setLocations(res.data);
    } catch (err) {
      toast.error('Error fetching locations');
    }
  };

  useEffect(() => {
    fetchManagers();
    fetchLocations();
  }, []);

  useEffect(() => {
    if (editingId) {
      setShowForm(true);
      setShowPasswordField(false);
      // Scroll to the edit form after a short delay to ensure it's rendered
      setTimeout(() => {
        const form = document.getElementById('edit-form');
        if (form) {
          form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [editingId]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredManagers(managers);
      return;
    }

    const filtered = managers.filter(manager => {
      const query = searchQuery.toLowerCase();
      const managerName = manager.name.toLowerCase();
      const managerEmail = manager.email.toLowerCase();
      const locationName = manager.assignedLocation?.name?.toLowerCase() || '';
      const locationCity = manager.assignedLocation?.city?.toLowerCase() || '';
      const fullLocation = `${locationName} ${locationCity}`.trim();

      switch (searchFilter) {
        case 'manager':
          return managerName.includes(query) || managerEmail.includes(query);
        case 'location':
          return locationName.includes(query) || locationCity.includes(query) || fullLocation.includes(query);
        default:
          return managerName.includes(query) ||
                 managerEmail.includes(query) ||
                 locationName.includes(query) ||
                 locationCity.includes(query) ||
                 fullLocation.includes(query);
      }
    });

    setFilteredManagers(filtered);
  }, [searchQuery, searchFilter, managers]);

  const exportToCSV = () => {
    if (filteredManagers.length === 0) {
      toast.warning('No data to export');
      return;
    }

    const headers = ['Name', 'Email', 'Location Name', 'Location City', 'Has Profile Image', 'Created Date'];
    const csvData = filteredManagers.map(manager => [
      manager.name,
      manager.email,
      manager.assignedLocation?.name || 'Not Assigned',
      manager.assignedLocation?.city || 'Not Assigned',
      manager.profileImage ? 'Yes' : 'No',
      new Date(manager.createdAt || Date.now()).toLocaleDateString()
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `managers_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${filteredManagers.length} managers to CSV`);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();

    formData.append('name', form.name);
    formData.append('email', form.email);
    formData.append('assignedLocation', form.assignedLocation);

    if (!editingId || form.password.trim()) {
      formData.append('password', form.password);
    }

    if (imageFile) {
      formData.append('profileImage', imageFile);
    }

    const url = editingId
      ? `http://localhost:5000/api/admin/managers/${editingId}`
      : 'http://localhost:5000/api/auth/register-manager';
    const method = editingId ? 'put' : 'post';

    try {
      const prevLoc = locations.find(loc => loc.managerId === editingId)?._id;

      await axios[method](url, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success(editingId ? 'Manager updated' : 'Manager registered');

      if (editingId && prevLoc !== form.assignedLocation) {
        const newLoc = locations.find(loc => loc._id === form.assignedLocation);
        toast.info(`Location reassigned to ${newLoc?.name} (${newLoc?.city})`);
      }

      setForm({ name: '', email: '', password: '', assignedLocation: '' });
      setImageFile(null);
      setEditingId(null);
      setShowForm(false);
      await fetchManagers();
      await fetchLocations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving manager');
    }
  };

  const handleEdit = (manager) => {
    setForm({
      name: manager.name,
      email: manager.email,
      password: '',
      assignedLocation: manager.assignedLocation?._id || ''
    });
    setImageFile(null);
    setExistingImageUrl(manager.profileImage || '');
    setEditingId(manager._id);
  };

  const handleDelete = (id) => {
    toast.info('Delete operation is not supported.');
  };

  const resetForm = () => {
    setForm({ name: '', email: '', password: '', assignedLocation: '' });
    setImageFile(null);
    setExistingImageUrl('');
    setEditingId(null);
    setShowForm(false);
    setShowPasswordField(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchFilter('all');
  };

  const assignedLocationIds = locations
    .filter((loc) => loc.managerId && loc.managerId !== editingId)
    .map((loc) => loc._id);

  return (
    <div className={styles.manageManagersContainer}>
      <ToastContainer />

      <div className={styles.pageHeader}>
        <div className={styles.headerIcon}>
          <Users size={40} strokeWidth={2} />
        </div>
        <h2>Manage Managers</h2>
      </div>

      {/* Search Section */}
      <div className={styles.searchSection}>
        <div className={styles.searchBox}>
          <Search className={styles.searchIconLeft} size={20} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search managers or locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className={styles.clearBtn} onClick={clearSearch}>
              <X size={18} />
            </button>
          )}
        </div>

        <div className={styles.filterBox}>
          <Filter size={18} />
          <select
            className={styles.filterSelect}
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="manager">Manager</option>
            <option value="location">Location</option>
          </select>
        </div>
      </div>

      <div className={styles.resultsInfo}>
        <span>
          {searchQuery ? (
            `Found ${filteredManagers.length} manager${filteredManagers.length !== 1 ? 's' : ''}`
          ) : (
            `Showing ${managers.length} manager${managers.length !== 1 ? 's' : ''}`
          )}
        </span>
      </div>

      {/* Action Buttons */}
      <div className={styles.actionButtons}>
        <button className={styles.btnPrimary} onClick={() => setShowForm((prev) => !prev)}>
          <Plus size={18} />
          {showForm ? 'Hide Form' : 'Add Manager'}
        </button>

        <button
          onClick={exportToCSV}
          className={styles.btnSecondary}
          disabled={filteredManagers.length === 0}
        >
          <Download size={18} />
          Export CSV ({filteredManagers.length})
        </button>
      </div>

      {showForm && (
        <form id="edit-form" className={styles.managerForm} onSubmit={handleSubmit}>
          <div className={styles.formRow}>
            <input
              name="name"
              placeholder="Name"
              value={form.name}
              onChange={handleChange}
              required
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formRow}>
            {!editingId || showPasswordField ? (
              <div className={styles.passwordField}>
                <input
                  name="password"
                  placeholder="Password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  required={!editingId}
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            ) : (
              <button
                type="button"
                className={styles.changePasswordBtn}
                onClick={() => setShowPasswordField(true)}
              >
                <Lock size={18} />
                Change Password
              </button>
            )}

            <select
              name="assignedLocation"
              value={form.assignedLocation}
              onChange={handleChange}
              required
            >
              <option value="">Select Location</option>
              {locations.map((loc) => {
                const isAssigned = assignedLocationIds.includes(loc._id);
                return (
                  <option
                    key={loc._id}
                    value={loc._id}
                    disabled={isAssigned}
                  >
                    {loc.name} ({loc.city})
                  </option>
                );
              })}
            </select>
          </div>

          <div className={styles.fileUploadSection}>
            <label className={styles.fileLabel}>Profile Image</label>
            <input
              type="file"
              name="profileImage"
              accept="image/*"
              onChange={handleImageUpload}
              className={styles.fileInput}
            />
          </div>

          {existingImageUrl && !imageFile && (
            <img
              src={`http://localhost:5000/${existingImageUrl}`}
              alt="Current Profile"
              className={styles.previewImage}
            />
          )}

          {imageFile && (
            <img
              src={URL.createObjectURL(imageFile)}
              alt="Preview"
              className={styles.previewImage}
            />
          )}

          <div className={styles.formActions}>
            <button type="submit" className={styles.btnSubmit}>
              {editingId ? 'Update Manager' : 'Register Manager'}
            </button>
            <button type="button" onClick={resetForm} className={styles.btnCancel}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Manager Cards Grid */}
      {managers.length === 0 ? (
        <div className={styles.emptyState}>
          <User size={60} strokeWidth={1.5} />
          <h3>Loading Managers...</h3>
          <p>Please wait while we fetch the manager data.</p>
        </div>
      ) : (
        <div className={styles.managersGrid}>
          {filteredManagers.length === 0 ? (
            <div className={styles.emptyState}>
              <Search size={60} strokeWidth={1.5} />
              <h3>No Results Found</h3>
              <p>No managers found matching your search.</p>
            </div>
          ) : (
            filteredManagers.map((manager) => (
              <div key={manager._id} className={styles.managerCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.profileImageContainer}>
                    {manager.profileImage ? (
                      <img
                        src={`http://localhost:5000/${encodeURI(normalizeImagePath(manager.profileImage))}`}
                        alt={`${manager.name}'s profile`}
                        className={styles.profileImage}
                      />
                    ) : (
                      <div className={styles.profilePlaceholder}>
                        <User size={40} strokeWidth={1.5} />
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.cardContent}>
                  <h3 className={styles.managerName}>{manager.name}</h3>
                  <p className={styles.managerEmail}>{manager.email}</p>

                  <div className={styles.locationInfo}>
                    <MapPin size={16} />
                    <span>
                      {manager.assignedLocation?.name
                        ? `${manager.assignedLocation.name} (${manager.assignedLocation.city})`
                        : 'No location assigned'
                      }
                    </span>
                  </div>
                </div>

                <div className={styles.cardActions}>
                  <button
                    className={styles.editBtn}
                    onClick={() => handleEdit(manager)}
                  >
                    <Edit2 size={16} />
                    Edit
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(manager._id)}
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default ManageManagers;