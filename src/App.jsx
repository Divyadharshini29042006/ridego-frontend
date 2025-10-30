import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { AuthProvider } from './context/AuthContext';
import { BookingProvider } from './context/BookingContext'; // ✅ NEW: Import BookingProvider

// 🌐 Common Pages
import VerifyOtp from './pages/common/VerifyOtp';
import Home from './pages/common/Home.jsx';
import Login from './pages/common/Login.jsx';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Signup from './pages/common/Signup.jsx';
import ContactForm from './pages/common/ContactForm.jsx';
import PublicVehicleDetails from './pages/common/VehicleDetails.jsx';
import Vehicles from './pages/common/Vehicles.jsx';
import VerifyPasswordResetOtp from './pages/auth/VerifyPasswordResetOtp';
import ConfirmBooking from './pages/common/ConfirmBooking.jsx';
import BookingSuccess from './pages/common/BookingSuccess.jsx';

// 🛠️ Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminAnalytics from './pages/admin/AdminAnalytics.jsx';
import ManageVehicles from './pages/admin/ManageVehicles.jsx';
import AdminBookings from './pages/admin/AdminBookings.jsx';
import ManageBookings from './pages/admin/ManageBookings.jsx';
import AdminQueryMetrics from './pages/admin/AdminQueryMetrics.jsx';
import ManageDrivers from './pages/admin/ManageDrivers.jsx';
import ManagePayments from './pages/admin/ManagePayments.jsx';
import ManageManagers from './pages/admin/ManageManagers.jsx';
import ManageLocations from './pages/admin/ManageLocations.jsx';

// 👨‍💼 Manager Pages
import ManagerDashboard from './pages/manager/ManagerDashboard.jsx';
import ManagerProfile from './pages/manager/ManageProfile.jsx';
import ManageVehiclesPage from './pages/manager/ManageVehiclesPage.jsx';
import VehicleDetails from './pages/manager/VehicleDetails.jsx';

import MDriver from './pages/manager/MDriver.jsx';
import AddDriver from './pages/manager/AddDriver.jsx';
import ManageBookingsPage from './pages/manager/ManageBookingsPage';
import Payments from './pages/manager/Payments.jsx';
import ManagerQueryDashboard from './pages/manager/ManagerQueryDashboard.jsx';

// 👤 Customer Pages
import MyBookings from './pages/common/MyBookings.jsx';
import ProfileSettings from './pages/common/ProfileSettings.jsx';
import BookingForm from '../src/components/BookingForm.jsx'; // ✅ FIXED: Import from pages/common instead of components

function App() {
  return (
    <AuthProvider>
      {/* ✅ NEW: Wrap everything with BookingProvider */}
      <BookingProvider>
        <Navbar />
        <Routes>
          {/* 🌐 Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-password-reset-otp" element={<VerifyPasswordResetOtp />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/contact" element={<ContactForm />} />
          <Route path="/vehicle/:id" element={<PublicVehicleDetails />} />
          <Route path="/vehicles" element={<Vehicles />} />

          {/* 🛠️ Protected Admin Routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/vehicles" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageVehicles />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/admin/bookings"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/bookings/manage"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/query-metrics"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminQueryMetrics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/queries"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminQueryMetrics />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/admin/drivers" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageDrivers />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/payments" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManagePayments />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/managers" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageManagers />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/admin/locations"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageLocations />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminAnalytics />
              </ProtectedRoute>
            }
          />

          {/* 👨‍💼 Protected Manager Routes */}
          <Route 
            path="/manager" 
            element={
              <ProtectedRoute allowedRoles={['manager']}>
                <ManagerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/manager/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['manager']}>
                <ManagerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/manager/profile" 
            element={
              <ProtectedRoute allowedRoles={['manager']}>
                <ManagerProfile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/manager/vehicles" 
            element={
              <ProtectedRoute allowedRoles={['manager']}>
                <ManageVehiclesPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/manager/vehicles/:id" 
            element={
              <ProtectedRoute allowedRoles={['manager']}>
                <VehicleDetails />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/manager/drivers" 
            element={
              <ProtectedRoute allowedRoles={['manager']}>
                <MDriver />
              </ProtectedRoute>
            } 
          />
          <Route
            path="/manager/drivers/add"
            element={
              <ProtectedRoute allowedRoles={['manager']}>
                <AddDriver />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/queries"
            element={
              <ProtectedRoute allowedRoles={['manager']}>
                <ManagerQueryDashboard />
              </ProtectedRoute>
            }
          />

          {/* 👤 Protected Customer Routes */}
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <ProfileSettings />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/my-bookings" 
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <MyBookings />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile-settings" 
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <ProfileSettings />
              </ProtectedRoute>
            } 
          />
          
          {/* ✅ UPDATED: Booking flow routes with proper protection */}
          <Route 
            path="/booking" 
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <BookingForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/confirm-booking" 
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <ConfirmBooking />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/booking-success" 
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <BookingSuccess />
              </ProtectedRoute>
            } 
          />
          <Route
  path="/manager/bookings"
  element={
    <ProtectedRoute allowedRoles={['manager']}>
      <ManageBookingsPage />
    </ProtectedRoute>
  }
/>
          <Route
  path="/manager/payments"
  element={
    <ProtectedRoute allowedRoles={['manager']}>
      <Payments />
    </ProtectedRoute>
  }
/>
        </Routes>

        <Footer />
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </BookingProvider>
    </AuthProvider>
  );
}

export default App;