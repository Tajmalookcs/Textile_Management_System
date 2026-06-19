import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Login from '../pages/auth/Login'
import Dashboard from '../pages/dashboard/Dashboard'
import ProductList from '../pages/products/ProductList'
import PCTCodes from '../pages/products/PCTCodes'
import Inventory from '../pages/inventory/Inventory'
import Suppliers from '../pages/purchases/Suppliers'
import PurchaseOrders from '../pages/purchases/PurchaseOrders'
import Batches from '../pages/production/Batches'
import InvoiceList from '../pages/sales/InvoiceList'
import InvoiceForm from '../pages/sales/InvoiceForm'
import InvoicePrint from '../pages/sales/InvoicePrint'
import CustomerList from '../pages/customers/CustomerList'
import Reports from '../pages/reports/Reports'
import Settings from '../pages/settings/Settings'

function Protected({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"      element={<Login />} />
        <Route path="/dashboard"  element={<Protected><Dashboard /></Protected>} />
        <Route path="/products"   element={<Protected><ProductList /></Protected>} />
        <Route path="/pct-codes"  element={<Protected><PCTCodes /></Protected>} />
        <Route path="/inventory"  element={<Protected><Inventory /></Protected>} />
        <Route path="/suppliers"  element={<Protected><Suppliers /></Protected>} />
        <Route path="/purchases"  element={<Protected><PurchaseOrders /></Protected>} />
        <Route path="/production" element={<Protected><Batches /></Protected>} />
        <Route path="/invoices"          element={<Protected><InvoiceList /></Protected>} />
        <Route path="/invoices/new"      element={<Protected><InvoiceForm /></Protected>} />
        <Route path="/invoices/:id/edit" element={<Protected><InvoiceForm /></Protected>} />
        <Route path="/invoices/:id/print" element={<Protected><InvoicePrint /></Protected>} />
        <Route path="/customers"  element={<Protected><CustomerList /></Protected>} />
        <Route path="/reports"    element={<Protected><Reports /></Protected>} />
        <Route path="/settings"   element={<Protected><Settings /></Protected>} />
        <Route path="*"           element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
