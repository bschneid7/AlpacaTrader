import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "./components/ui/theme-provider"
import { Toaster } from "./components/ui/toaster"
import { AuthProvider } from "./contexts/AuthContext"
import { Login } from "./pages/Login"
import { Register } from "./pages/Register"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { DashboardLayout } from "./components/DashboardLayout"
import { Dashboard } from "./pages/Dashboard"
import { Strategy } from "./pages/Strategy"
import { Analytics } from "./pages/Analytics"
import { Monitoring } from "./pages/Monitoring"
import { Risk } from "./pages/Risk"
import { Settings } from "./pages/Settings"
import { BlankPage } from "./pages/BlankPage"

function App() {
  return (
  <AuthProvider>
    <ThemeProvider defaultTheme="light" storageKey="ui-theme">
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute> <DashboardLayout /> </ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="strategy" element={<Strategy />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="monitoring" element={<Monitoring />} />
            <Route path="risk" element={<Risk />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<BlankPage />} />
        </Routes>
      </Router>
      <Toaster />
    </ThemeProvider>
  </AuthProvider>
  )
}

export default App