import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MenuManager from './pages/MenuManager';
import GalleryManager from './pages/GalleryManager';
import TestimonialsManager from './pages/TestimonialsManager';
import Settings from './pages/Settings';
import CheckoutManagement from './pages/CheckoutManagement';
import ContentManager from './pages/ContentManager';
import ContactManager from './pages/ContactManager';
import Enquiries from './pages/Enquiries';
import Orders from './pages/Orders';
import ResetPassword from './pages/ResetPassword';
import HeroImageManager from './pages/HeroImageManager';
import AboutImageManager from './pages/AboutImageManager';
import AuditHistory from './pages/AuditHistory';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/menu" element={<MenuManager />} />
            <Route path="/dashboard/gallery" element={<GalleryManager />} />
            <Route path="/dashboard/hero-image" element={<HeroImageManager />} />
            <Route path="/dashboard/about-image" element={<AboutImageManager />} />
            <Route path="/dashboard/testimonials" element={<TestimonialsManager />} />
            <Route path="/dashboard/enquiries" element={<Enquiries />} />
            <Route path="/dashboard/orders" element={<Orders />} />
            <Route path="/dashboard/services" element={<ContentManager kind="services" />} />
            <Route path="/dashboard/faqs" element={<ContentManager kind="faqs" />} />
            <Route path="/dashboard/contact" element={<ContactManager />} />
            <Route path="/dashboard/audit-history" element={<AuditHistory />} />
            <Route path="/dashboard/settings" element={<Settings />} />
            <Route path="/dashboard/checkout" element={<CheckoutManagement />} />
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
