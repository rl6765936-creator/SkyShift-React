export type Role = "User" | "Manager";
export type VehicleStatus =
  "Available" | "InUse" | "Maintenance" | "Unavailable" | "Retired";
// The original user contract uses numeric enums; manager DTOs use strings.
export type UserGender = "Male" | "Female";
// "Verified" = official manufacturer source; "Illustrative" = SkyShift sample data.
export type SpecificationAccuracy = "Verified" | "Illustrative";
// How confidently the road-car model was identified (independent of accuracy).
export type CatalogIdentification = "Identified" | "VisualInspiration";
export interface VehicleMetadata {
  catalogItemId?: number | null;
  manufacturer?: string | null;
  catalogIdentification?: CatalogIdentification | null;
  description?: string | null;
  descriptionHe?: string | null;
  modelName?: string | null;
  // Legacy free-form speed for old vehicles; equals maxRoadSpeedKmh for catalog vehicles.
  maxSpeedKmh?: number | null;
  maxRoadSpeedKmh?: number | null;
  maxRoadSpeedAccuracy?: SpecificationAccuracy | null;
  seats?: number | null;
  seatsAccuracy?: SpecificationAccuracy | null;
  imageUrl?: string | null;
}
// GET /api/manager/vehicles/catalog: every field is always present.
export interface CatalogItem extends VehicleMetadata {
  id: number;
  manufacturer: string;
  modelName: string;
  seats: number;
  seatsAccuracy: SpecificationAccuracy;
  maxRoadSpeedKmh: number;
  maxSpeedKmh: number;
  maxRoadSpeedAccuracy: SpecificationAccuracy;
  imageUrl: string;
  description: string;
  descriptionHe: string;
  identification: CatalogIdentification;
}
export interface CreateVehicleRequest {
  catalogItemId: number;
  isPersonalExperimental: boolean;
}
export interface Vehicle extends VehicleMetadata {
  id: number;
  status: 0 | 1 | 2 | 3 | 4;
  isPersonalExperimental: boolean;
}
export interface ManagerVehicle extends VehicleMetadata {
  id: number;
  status: VehicleStatus;
  isPersonalExperimental: boolean;
  createdAt: string;
}
export interface AuthResponse {
  gender?: UserGender | null;
  id: number;
  name: string;
  email: string;
  token: string;
}
export interface Session extends AuthResponse {
  isNewAccount?: boolean;
  role: Role;
  expiresAt: number;
}
export interface RegisterRequest {
  gender: UserGender;
  name: string;
  email: string;
  password: string;
  averageDailyTrips: number;
}
export interface Dashboard {
  expectedMonthlyTrips: number;
  completedFlights: number;
  percentage: number;
  isLotteryEligible: boolean;
  currentVehicle: Vehicle | null;
}
export interface StatusBreakdown {
  available: number;
  inUse: number;
  maintenance: number;
  unavailable: number;
  retired: number;
}
export interface ManagerDashboard {
  totalUsers: number;
  totalFlights: number;
  activeAssignments: number;
  vehiclesByStatus: StatusBreakdown;
  currentUtilizationPercentage: number;
  engagementRatePercentage: number;
  complianceRatePercentage: number;
}
export interface Flight {
  id: number;
  userId: number;
  vehicleId: number | null;
  date: string;
  createdAt: string;
}
export interface Assignment {
  id: number;
  userId: number;
  vehicleId: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}
export interface UserActivity {
  userId: number;
  name: string;
  email: string;
  totalFlights: number;
  hasActiveAssignment: boolean;
  lastFlightCreatedAt: string | null;
}
export interface FlightStats {
  totalFlights: number;
  flightsPerUser: { userId: number; count: number }[];
  flightsPerVehicle: { vehicleId: number; count: number }[];
  activityTrend: { date: string; count: number }[];
}
export interface Paged<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
export interface FlightFilters {
  userId?: number;
  vehicleId?: number;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}
