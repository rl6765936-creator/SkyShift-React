import { useI18n } from "./i18n";
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  Link,
} from "react-router-dom";
import { useAuth } from "./auth";
import { Layout } from "./layout";
import { AuthPage, Home } from "./public-pages";
import {
  MyVehicle,
  RecordFlight,
  UserDashboard,
  VehiclesPage,
} from "./user-pages";
import {
  ManagerAssignments,
  ManagerFlights,
  ManagerHome,
  ManagerUsers,
  ManagerVehicles,
} from "./manager-pages";
import { Empty } from "./components";
const Protected = ({ manager = false }: { manager?: boolean }) => {
  const { session } = useAuth();
  const location = useLocation();
  if (!session)
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (manager && session.role !== "Manager")
    return <Navigate to="/dashboard" replace />;
  return <Outlet />;
};
export const App = () => {
  const { t, language } = useI18n();
  void language;
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/register" element={<AuthPage register />} />
      <Route element={<Protected />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/my-vehicle" element={<MyVehicle />} />
          <Route path="/record-flight" element={<RecordFlight />} />
        </Route>
      </Route>
      <Route element={<Protected manager />}>
        <Route element={<Layout manager />}>
          <Route path="/manager" element={<ManagerHome />} />
          <Route path="/manager/vehicles" element={<ManagerVehicles />} />
          <Route path="/manager/users" element={<ManagerUsers />} />
          <Route path="/manager/flights" element={<ManagerFlights />} />
          <Route path="/manager/assignments" element={<ManagerAssignments />} />
        </Route>
      </Route>
      <Route
        path="*"
        element={
          <div className="not-found">
            <Empty title={t("This page has drifted out of view")}>
              {t("Let’s take you back to SkyShift.")}
            </Empty>
            <Link className="button" to="/">
              {t("Back home")}
            </Link>
          </div>
        }
      />
    </Routes>
  );
};
