# Backend → React contract map

Inspected source: all nine controllers, request/response DTOs, use cases, entities,
JWT generation, role enforcement, exception handling, mapping and EF repositories.
No backend files were modified.

| Method | Endpoint                          | Screen / purpose                   | Payload / query                               |
| ------ | --------------------------------- | ---------------------------------- | --------------------------------------------- |
| POST   | /api/auth/register                | Register, immediate session        | name, email, password, averageDailyTrips      |
| POST   | /api/auth/login                   | Login                              | email, password                               |
| GET    | /api/dashboard                    | Personal dashboard                 | Bearer token                                  |
| GET    | /api/vehicles/available           | Available fleet                    | Bearer token                                  |
| GET    | /api/vehicles/mine                | Current vehicle                    | Bearer token; nullable response/204 supported |
| POST   | /api/vehicles/select              | Allocate one available vehicle     | vehicleId; 204                                |
| POST   | /api/flights                      | Record completed flight            | date; 204; vehicle inferred by server         |
| GET    | /api/manager/dashboard            | Fleet/participation overview       | Manager token                                 |
| GET    | /api/manager/vehicles             | Entire fleet                       | Manager token                                 |
| POST   | /api/manager/vehicles             | Add vehicle                        | isPersonalExperimental                        |
| PATCH  | /api/manager/vehicles/{id}/status | Permitted status changes           | targetStatus                                  |
| GET    | /api/manager/users                | Participant activity               | Manager token                                 |
| GET    | /api/manager/flights              | Filtered, paginated flight records | userId, vehicleId, from, to, page, pageSize   |
| GET    | /api/manager/flights/stats        | All-time aggregate activity        | No filters in actual API                      |
| GET    | /api/manager/assignments/active   | Active assignment monitoring       | No filters in actual API                      |
| GET    | /api/manager/assignments/history  | Ended assignments                  | userId, vehicleId                             |

## Important source findings

- Register and login return `Id, Name, Email, Token` through `LoginApiResponse`.
  Role is read from the JWT, not a nonexistent response property.
- Roles use `ClaimTypes.Role`; the UI supports its full URI and `role` JWT key.
- `UserRole.User` is assigned on public registration. No role picker is exposed.
- Assignment duration: exactly one month, inclusive start/end checks in Domain.
- A participant may not select a second vehicle while an assignment is active.
- Concurrency conflicts are HTTP 409. The UI retains the message and refreshes
  selection-related data instead of retrying a write automatically.
- Manager cannot set InUse; only selection does that. InUse/Retired vehicles
  cannot change status. Retired is terminal. Retirement requires confirmation.
- User VehicleResponse.status = integer; ManagerVehicleResponse.status = name.
- Dashboard.completedFlights counts flights within the active trial. It is not
  an all-time total and is not labeled as one.
- The monthly goal and completion percentage come from the server; progress
  bar graphics are capped at 100%, but the actual numeric value is preserved.
- Lottery eligibility comes directly from the server. 80% is explanatory text
  matching LotteryEligibilityService, not a frontend eligibility calculation.
- Flight filters use Flight.Date; activity trends use Flight.CreatedAt.
- Flight list defaults: page 1, pageSize 20, maximum pageSize 100.
- UserActivity exposes HasActiveAssignment, not an invented IsActiveUser.
- Assignment monitoring exposes IDs, dates and IsActive, without mutation routes.
- Vehicle model/speed/seats/image fields are frontend visual preview data only,
  as explicitly requested. They live outside the real API DTO types.

## HTTP states

400: validation details; 401: failed login or expired token; 403: Manager required;
404: missing resource; 409: conflict/business rule; 500: safe server error.
Successful 204 writes are handled without JSON parsing. New-user null/empty
responses, loading, retryable errors, no fleet/no flights/no assignments and
pending/disabled actions have dedicated UI states.
