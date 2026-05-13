import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { CountryProvider } from "./contexts/CountryContext";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import InvoicesPage from "./pages/InvoicesPage";
import InvoiceFormPage from "./pages/InvoiceFormPage";
import InvoiceDetailPage from "./pages/InvoiceDetailPage";
import ClientsPage from "./pages/ClientsPage";
import MissionsPage from "./pages/MissionsPage";

function AppRoutes() {
  const { session } = useAuth();
  if (session) {
    return (
      <CountryProvider>
        <Layout>
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/invoices/new" element={<InvoiceFormPage />} />
            <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/missions" element={<MissionsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Layout>
      </CountryProvider>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
