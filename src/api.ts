import type {
  CreateVehicleRequest,
  CatalogItem,
  Assignment,
  AuthResponse,
  Dashboard,
  Flight,
  FlightFilters,
  FlightStats,
  ManagerDashboard,
  ManagerVehicle,
  Paged,
  RegisterRequest,
  UserActivity,
  Vehicle,
  VehicleStatus,
} from "./types";
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fieldErrors: Record<string, string[]> = {},
    public path = "",
    public code?: string,
    public messageHe?: string,
    public messageEn?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
const origin = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
let bearer: string | null = null;
export const setBearer = (token: string | null) => {
  bearer = token;
};
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;
export const request = async <T>(
  path: string,
  options: RequestInit = {},
): Promise<T> => {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  headers.set("Accept-Language", document.documentElement.lang === "he" ? "he" : "en");
  if (options.body) headers.set("Content-Type", "application/json");
  if (bearer) headers.set("Authorization", `Bearer ${bearer}`);
  let response: Response;
  try {
    response = await fetch(`${origin}/api${path}`, { ...options, headers });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError")
      throw cause;
    throw new ApiError(
      "Unable to reach SkyShift. Check that the backend is running and try again.",
      0,
    );
  }
  const raw = await response.text();
  let body: unknown;
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    body = null;
  }
  if (!response.ok) {
    const errors: Record<string, string[]> = {};
    if (isRecord(body) && isRecord(body.errors)) {
      for (const [key, value] of Object.entries(body.errors))
        if (Array.isArray(value) && value.every((v) => typeof v === "string"))
          errors[key] = value;
    }
    const fallback =
      response.status === 401
        ? path.startsWith("/auth/")
          ? "The email or password is incorrect."
          : "Your session has expired. Please sign in again."
        : response.status === 403
          ? "This action requires a Manager account."
          : response.status === 409
            ? "This action conflicts with the current state. Refresh and try again."
            : "The request could not be completed.";
    const detail =
      isRecord(body) && typeof body.detail === "string"
        ? body.detail
        : Object.values(errors).flat().join(" ") || fallback;
    if (response.status === 401 && !path.startsWith("/auth/"))
      window.dispatchEvent(new Event("skyshift:unauthorized"));
    throw new ApiError(detail, response.status, errors, path,
      isRecord(body) && typeof body.code === "string" ? body.code : undefined,
      isRecord(body) && typeof body.messageHe === "string" ? body.messageHe : undefined,
      isRecord(body) && typeof body.messageEn === "string" ? body.messageEn : undefined);
  }
  if (raw && body === null)
    throw new ApiError(
      "The API returned an unexpected response. Check the API address.",
      0,
    );
  // Contracts are deliberately mirrored from the supplied C# DTOs.
  return body as T;
};
const json = (method: string, body: unknown): RequestInit => ({
  method,
  body: JSON.stringify(body),
});
const query = (values: object) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values))
    if (value !== undefined && value !== "") params.set(key, String(value));
  return params.size ? `?${params}` : "";
};
export const api = {
  login: (email: string, password: string) =>
    request<AuthResponse>("/auth/login", json("POST", { email, password })),
  register: (body: RegisterRequest) =>
    request<AuthResponse>("/auth/register", json("POST", body)),
  dashboard: (signal?: AbortSignal) =>
    request<Dashboard>("/dashboard", { signal }),
  available: (signal?: AbortSignal) =>
    request<Vehicle[]>("/vehicles/available", { signal }),
  mine: (signal?: AbortSignal) =>
    request<Vehicle | null>("/vehicles/mine", { signal }),
  select: (vehicleId: number) =>
    request<void>("/vehicles/select", json("POST", { vehicleId })),
  recordFlight: (date: string) =>
    request<void>("/flights", json("POST", { date })),
  managerDashboard: (signal?: AbortSignal) =>
    request<ManagerDashboard>("/manager/dashboard", { signal }),
  catalog: (signal?: AbortSignal) => request<CatalogItem[]>("/manager/vehicles/catalog", { signal }),
  vehicles: (signal?: AbortSignal) =>
    request<ManagerVehicle[]>("/manager/vehicles", { signal }),
  createVehicle: (body: CreateVehicleRequest) =>
    request<ManagerVehicle>(
      "/manager/vehicles",
      json("POST", body),
    ),
  changeStatus: (id: number, targetStatus: VehicleStatus) =>
    request<ManagerVehicle>(
      `/manager/vehicles/${id}/status`,
      json("PATCH", { targetStatus }),
    ),
  flights: (filters: FlightFilters, signal?: AbortSignal) =>
    request<Paged<Flight>>(`/manager/flights${query(filters)}`, { signal }),
  stats: (signal?: AbortSignal) =>
    request<FlightStats>("/manager/flights/stats", { signal }),
  users: (signal?: AbortSignal) =>
    request<UserActivity[]>("/manager/users", { signal }),
  activeAssignments: (signal?: AbortSignal) =>
    request<Assignment[]>("/manager/assignments/active", { signal }),
  history: (
    filters: { userId?: number; vehicleId?: number },
    signal?: AbortSignal,
  ) =>
    request<Assignment[]>(`/manager/assignments/history${query(filters)}`, {
      signal,
    }),
};
