import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { PlantProvider, usePlants } from "./context/PlantContext";
import { ThemeProvider } from "./context/ThemeContext";
import { Toast } from "./components/Toast";
import BottomNav from "./components/BottomNav";
import Gallery from "./pages/Gallery";
import Passport from "./pages/Passport";
import Manage from "./pages/Manage";
import PlantForm from "./pages/PlantForm";
import ScanScreen from "./pages/ScanScreen";
import "./styles/app.css";

function AppLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { toast, clearToast } = usePlants();

  // Show bottom nav only on gallery and manage pages
  const showNav = pathname === "/" || pathname === "/manage";

  return (
    <div className="app-shell">
      <div className="content-area">
        <Routes>
          <Route path="/" element={<Gallery />} />
          <Route path="/manage" element={<Manage />} />
        </Routes>
      </div>

      {showNav && <BottomNav onScan={() => navigate("/scan")} />}

      {/* Full-screen overlay routes */}
      <Routes>
        <Route path="/plant/:id" element={<Passport />} />
        <Route path="/add" element={<PlantForm />} />
        <Route path="/edit/:id" element={<PlantForm />} />
        <Route path="/scan" element={<ScanScreen />} />
      </Routes>

      {toast && <Toast msg={toast} onDone={clearToast} />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <PlantProvider>
          <AppLayout />
        </PlantProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
