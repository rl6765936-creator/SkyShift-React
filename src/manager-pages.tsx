import { useI18n } from "./i18n";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Car,
  ClipboardList,
  Plane,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { api } from "./api";
import {
  Button,
  Card,
  decimal,
  Empty,
  ErrorNotice,
  formatDate,
  Modal,
  PageHeading,
  QueryGate,
  Stat,
  Status,
  SuccessNotice,
  TableWrap,
  TextLink,
  Trend,
  VehicleArt,
  VehicleSpecs,
  AccuracyBadge,
  CatalogNotes,
} from "./components";
import type { FlightFilters, ManagerVehicle, VehicleStatus } from "./types";
import { vehicleDisplay } from "./vehicle-display";
const useManagerDashboard = () =>
  useQuery({
    queryKey: ["manager", "dashboard"],
    queryFn: ({ signal }) => api.managerDashboard(signal),
  });
const useStats = () =>
  useQuery({
    queryKey: ["manager", "stats"],
    queryFn: ({ signal }) => api.stats(signal),
  });
const useUsers = () =>
  useQuery({
    queryKey: ["manager", "users"],
    queryFn: ({ signal }) => api.users(signal),
  });
const useFleet = () =>
  useQuery({
    queryKey: ["manager", "vehicles"],
    queryFn: ({ signal }) => api.vehicles(signal),
  });
export const ManagerHome = () => {
  const { t, language } = useI18n();
  void language;

  const query = useManagerDashboard();
  const stats = useStats();
  const users = useUsers();
  const data = query.data;
  return (
    <>
      <PageHeading
        eyebrow={t("Fleet workspace")}
        title={t("Manager dashboard")}
        description={t(
          "A clear view of your fleet, flights and participation.",
        )}
        action={
          <Link className="button" to="/manager/vehicles">
            <Car size={17} />
            {t("Manage fleet")}
          </Link>
        }
      />
      <QueryGate
        pending={query.isPending}
        error={query.error}
        retry={() => {
          void query.refetch();
        }}
      >
        {data && (
          <>
            <div className="stats-grid four">
              <Stat
                label={t("Users")}
                value={data.totalUsers}
                note={t("Registered participants")}
                icon={Users}
              />
              <Stat
                label={t("Vehicles")}
                value={Object.values(data.vehiclesByStatus).reduce(
                  (a, b) => a + b,
                  0,
                )}
                note={t("Across all fleet statuses")}
                icon={Car}
              />
              <Stat
                label={t("Flights")}
                value={data.totalFlights}
                note={t("Completed trips recorded")}
                icon={Plane}
                tone="gold"
              />
              <Stat
                label={t("Assignments")}
                value={data.activeAssignments}
                note={t("Currently active")}
                icon={ClipboardList}
                tone="lavender"
              />
            </div>
            <div className="manager-dashboard-grid">
              <Card
                title={t("Flights over time")}
                action={
                  <TextLink to="/manager/flights">{t("View flights")}</TextLink>
                }
              >
                <QueryGate
                  pending={stats.isPending}
                  error={stats.error}
                  retry={() => {
                    void stats.refetch();
                  }}
                >
                  {stats.data && <Trend points={stats.data.activityTrend} />}
                </QueryGate>
              </Card>
              <Card title={t("Vehicle status")}>
                <div className="fleet-status">
                  <div
                    className="progress-ring small"
                    style={
                      {
                        "--progress": `${data.currentUtilizationPercentage}%`,
                      } as React.CSSProperties
                    }
                  >
                    <div>
                      <strong>
                        {decimal(data.currentUtilizationPercentage)}
                        <small>{t("%")}</small>
                      </strong>
                      <span>{t("in use")}</span>
                    </div>
                  </div>
                  <dl>
                    {Object.entries(data.vehiclesByStatus).map(
                      ([key, value]) => (
                        <div key={key}>
                          <dt>
                            <span className={`legend-dot ${key}`} />
                            {key === "inUse"
                              ? t("In use")
                              : key.charAt(0).toUpperCase() + key.slice(1)}
                          </dt>
                          <dd>{value}</dd>
                        </div>
                      ),
                    )}
                  </dl>
                </div>
                <p className="caption">
                  {t("Utilization excludes retired vehicles.")}
                </p>
              </Card>
              <Card
                title={t("Participant activity")}
                action={
                  <TextLink to="/manager/users">{t("View all")}</TextLink>
                }
              >
                <QueryGate
                  pending={users.isPending}
                  error={users.error}
                  retry={() => {
                    void users.refetch();
                  }}
                >
                  {users.data?.length ? (
                    <TableWrap>
                      <table>
                        <caption className="sr-only">
                          {t("Participant activity overview")}
                        </caption>
                        <thead>
                          <tr>
                            <th>{t("Name")}</th>
                            <th>{t("Flights")}</th>
                            <th>{t("Assignment")}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.data.slice(0, 5).map((user) => (
                            <tr key={user.userId}>
                              <td>
                                <strong>{user.name}</strong>
                                <small>{user.email}</small>
                              </td>
                              <td>{user.totalFlights}</td>
                              <td>
                                <span
                                  className={`status ${user.hasActiveAssignment ? "available" : "unavailable"}`}
                                >
                                  <span />
                                  {user.hasActiveAssignment
                                    ? t("Active")
                                    : t("None")}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </TableWrap>
                  ) : (
                    <Empty title={t("No participants yet")} />
                  )}
                </QueryGate>
              </Card>
              <Card title={t("Participation")}>
                <div className="participation">
                  <div>
                    <span>{t("Engagement")}</span>
                    <strong>
                      {decimal(data.engagementRatePercentage)}
                      {t("%")}
                    </strong>
                    <progress
                      max={100}
                      value={Math.min(data.engagementRatePercentage, 100)}
                    />
                    <small>{t("Users who have ever held an assignment")}</small>
                  </div>
                  <div>
                    <span>{t("Compliance")}</span>
                    <strong>
                      {decimal(data.complianceRatePercentage)}
                      {t("%")}
                    </strong>
                    <progress
                      max={100}
                      value={Math.min(data.complianceRatePercentage, 100)}
                    />
                    <small>
                      {t("Average progress across active participants")}
                    </small>
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}
      </QueryGate>
    </>
  );
};
export const ManagerVehicles = () => {
  const { t, language } = useI18n();
  void language;

  const query = useFleet();
  const client = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [creating, setCreating] = useState(false);
  const [catalogId, setCatalogId] = useState<number | null>(null);
  const catalog = useQuery({queryKey: ["manager", "catalog"], queryFn: ({signal}) => api.catalog(signal), enabled: creating});
  const selected = catalog.data?.find(item => item.id === catalogId) ?? catalog.data?.[0];
  const [editing, setEditing] = useState<ManagerVehicle | null>(null);
  const [target, setTarget] = useState<VehicleStatus>("Available");
  const invalidate = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ["manager"] }),
      client.invalidateQueries({ queryKey: ["available"] }),
      client.invalidateQueries({ queryKey: ["dashboard"] }),
      client.invalidateQueries({ queryKey: ["mine"] }),
    ]);
  };
  const create = useMutation({
    mutationFn: api.createVehicle,
    onError: () => { void client.invalidateQueries({queryKey: ["manager", "catalog"]}); },
    onSuccess: async () => {
      await invalidate();
      setCreating(false);
    },
  });
  const change = useMutation({
    mutationFn: ({ id, status }: { id: number; status: VehicleStatus }) =>
      api.changeStatus(id, status),
    onSuccess: async () => {
      await invalidate();
      setEditing(null);
    },
  });
  const list =
    query.data?.filter((v) => filter === "all" || v.status === filter) || [];
  return (
    <>
      <PageHeading
        eyebrow={t("Fleet management")}
        title={t("Vehicles")}
        description={t("Keep your fleet ready for its next journey.")}
        action={
          <Button
            onClick={() => {
              create.reset();
              setCatalogId(null);
              setCreating(true);
            }}
          >
            <Plus size={17} />
            {t("Add vehicle")}
          </Button>
        }
      />
      <div className="toolbar">
        <span>
          {query.data
            ? t(`${query.data.length} vehicles in the fleet`)
            : t("Fleet overview")}
        </span>
        <label className="compact-label">
          {t("Status")}
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">{t("All statuses")}</option>
            {(
              [
                "Available",
                "InUse",
                "Maintenance",
                "Unavailable",
                "Retired",
              ] as const
            ).map((v) => (
              <option key={v} value={v}>
                {t(v === "InUse" ? "In use" : v)}
              </option>
            ))}
          </select>
        </label>
      </div>
      {create.isSuccess && (
        <SuccessNotice>{t("Vehicle created successfully.")}</SuccessNotice>
      )}
      {change.isSuccess && (
        <SuccessNotice>{t("Vehicle status updated.")}</SuccessNotice>
      )}
      <QueryGate
        pending={query.isPending}
        error={query.error}
        retry={() => {
          void query.refetch();
        }}
      >
        {list.length ? (
          <div className="vehicle-grid">
            {list.map((vehicle) => (
              <Card className="vehicle-card" key={vehicle.id}>
                <VehicleArt vehicle={vehicle} />
                <div className="vehicle-card-body">
                  <div className="vehicle-title">
                    <div>
                      <h2>{vehicleDisplay(vehicle).modelName}</h2>
                      <span className="caption">
                        {t("Vehicle #")}
                        {vehicle.id}
                      </span>
                    </div>
                    <Status value={vehicle.status} />
                  </div>
                  <VehicleSpecs vehicle={vehicle} />
                  <p className="caption">
                    {t("Added")}
                    {formatDate(vehicle.createdAt)}
                  </p>
                  <Button
                    className="outline full"
                    disabled={
                      vehicle.status === "InUse" || vehicle.status === "Retired"
                    }
                    onClick={() => {
                      change.reset();
                      setEditing(vehicle);
                      setTarget(vehicle.status);
                    }}
                  >
                    {t("Change status")}
                    <ArrowRight size={15} />
                  </Button>
                  {(vehicle.status === "InUse" ||
                    vehicle.status === "Retired") && (
                    <small className="muted">
                      {vehicle.status === "InUse"
                        ? t("Assigned vehicles cannot change status.")
                        : t("Retired vehicles remain retired.")}
                    </small>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <Empty
              title={
                filter === "all"
                  ? t("Your fleet starts here")
                  : t("No matching vehicles")
              }
            >
              {filter === "all"
                ? t(
                    "Add your first vehicle to make it available to participants.",
                  )
                : t("Try a different status.")}
            </Empty>
          </Card>
        )}
      </QueryGate>
      <p className="caption">
        {t(
          "Vehicle details are saved in the fleet. Vehicles without specifications show a general illustration.",
        )}
      </p>
      {creating && (
        <Modal
          title={t("Add a vehicle")}
          onClose={() => {
            if (!create.isPending) setCreating(false);
          }}
        >
          <p>
            {t(
              "A new vehicle starts as Available. Participants can then choose it for a one-month trial.",
            )}
          </p>
          <form onSubmit={(event) => {
            event.preventDefault();
            if (selected) create.mutate({ isPersonalExperimental: false, catalogItemId: selected.id });
          }}>
          <QueryGate pending={catalog.isPending} error={catalog.error} retry={() => { void catalog.refetch(); }}>
          {selected ? <>
          <label>{t("Catalog model")}
            <select value={selected.id} onChange={(event) => setCatalogId(Number(event.target.value))}>
              {catalog.data?.map(item => <option key={item.id} value={item.id}>{vehicleDisplay(item).modelName}</option>)}
            </select>
          </label>
          <VehicleArt vehicle={selected} />
          <small>{t("Details are filled automatically from the selected catalog model.")}</small>
          <label>{t("Manufacturer")}<input value={selected.manufacturer} readOnly aria-readonly="true" /></label>
          <label>{t("Model name")}<input value={selected.modelName} readOnly aria-readonly="true" /></label>
          <label>
            <span className="label-row">{t("Maximum road speed (km/h)")}<AccuracyBadge accuracy={selected.maxRoadSpeedAccuracy} /></span>
            <input type="number" value={selected.maxRoadSpeedKmh} readOnly aria-readonly="true" />
          </label>
          <label>
            <span className="label-row">{t("Number of seats")}<AccuracyBadge accuracy={selected.seatsAccuracy} /></span>
            <input type="number" value={selected.seats} readOnly aria-readonly="true" />
          </label>
          <label>{t("Vehicle description")}<textarea value={language === "he" ? selected.descriptionHe : selected.description} readOnly aria-readonly="true" /></label>
          <CatalogNotes
            isCatalog
            accuracies={[selected.seatsAccuracy, selected.maxRoadSpeedAccuracy]}
            identification={selected.identification}
          />
          </> : <Empty title={t("All catalog models are already in the fleet")} />}
          </QueryGate>
          {create.error && <ErrorNotice error={create.error} />}
          <div className="modal-actions">
            <Button
              className="outline"
              disabled={create.isPending}
              type="button" onClick={() => setCreating(false)}
            >
              {t("Cancel")}
            </Button>
            <Button
              disabled={create.isPending || catalog.isPending || !!catalog.error || !selected}
              type="submit"
            >
              {create.isPending ? t("Creating…") : t("Create vehicle")}
            </Button>
          </div>
          </form>
        </Modal>
      )}
      {editing && (
        <Modal
          title={t(`Change status · Vehicle #${editing.id}`)}
          onClose={() => {
            if (!change.isPending) setEditing(null);
          }}
        >
          <p>
            {t("Current status:")}
            <Status value={editing.status} />
          </p>
          <label>
            {t("New status")}
            <select
              value={target}
              onChange={(e) => {
                const next = e.target.value;
                if (
                  next === "Available" ||
                  next === "Maintenance" ||
                  next === "Unavailable" ||
                  next === "Retired"
                )
                  setTarget(next);
              }}
            >
              {(
                ["Available", "Maintenance", "Unavailable", "Retired"] as const
              ).map((v) => (
                <option key={v} value={v}>
                  {t(v)}
                </option>
              ))}
            </select>
          </label>
          {target === "Retired" && (
            <div className="notice">
              {t(
                "Retiring permanently removes this vehicle from the active fleet.",
              )}
            </div>
          )}
          {change.error && <ErrorNotice error={change.error} />}
          <div className="modal-actions">
            <Button
              className="outline"
              disabled={change.isPending}
              onClick={() => setEditing(null)}
            >
              {t("Cancel")}
            </Button>
            <Button
              disabled={change.isPending || target === editing.status}
              onClick={() => change.mutate({ id: editing.id, status: target })}
            >
              {change.isPending ? t("Updating…") : t("Confirm status")}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
};
export const ManagerUsers = () => {
  const { t, language } = useI18n();
  void language;

  const query = useUsers();
  const [search, setSearch] = useState("");
  const users =
    query.data?.filter((user) =>
      `${user.name} ${user.email} ${user.userId}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    ) || [];
  return (
    <>
      <PageHeading
        eyebrow={t("People behind the journeys")}
        title={t("Users")}
        description={t("Participant activity and current assignment status.")}
      />
      <Card
        title={t("Participants")}
        action={
          <label className="search-field">
            <Search size={16} />
            <input
              aria-label={t("Search participants by name, email or ID")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("Search participants")}
            />
          </label>
        }
      >
        <QueryGate
          pending={query.isPending}
          error={query.error}
          retry={() => {
            void query.refetch();
          }}
        >
          {users.length ? (
            <TableWrap>
              <table>
                <caption className="sr-only">{t("User activity")}</caption>
                <thead>
                  <tr>
                    <th>{t("Participant")}</th>
                    <th>{t("ID")}</th>
                    <th>{t("Flights")}</th>
                    <th>{t("Assignment")}</th>
                    <th>{t("Last recorded flight")}</th>
                    <th>{t("View")}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.userId}>
                      <td>
                        <div className="table-user">
                          <span className="avatar">
                            {user.name.slice(0, 1)}
                          </span>
                          <div>
                            <strong>{user.name}</strong>
                            <small>{user.email}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        {t("#")}
                        {user.userId}
                      </td>
                      <td>{user.totalFlights}</td>
                      <td>
                        <span
                          className={`status ${user.hasActiveAssignment ? "available" : "unavailable"}`}
                        >
                          <span />
                          {user.hasActiveAssignment
                            ? t("Active assignment")
                            : t("No assignment")}
                        </span>
                      </td>
                      <td>{formatDate(user.lastFlightCreatedAt, true)}</td>
                      <td>
                        <TextLink to={`/manager/flights?userId=${user.userId}`}>
                          {t("Flights")}
                        </TextLink>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          ) : (
            <Empty
              title={
                search
                  ? t("No matching participants")
                  : t("No participants yet")
              }
            />
          )}
        </QueryGate>
      </Card>
    </>
  );
};
const positiveId = (value: FormDataEntryValue | null) =>
  value && Number(value) > 0 ? Number(value) : undefined;
export const ManagerFlights = () => {
  const { t, language } = useI18n();
  void language;

  const initialId = new URLSearchParams(window.location.search).get("userId");
  const [filters, setFilters] = useState<FlightFilters>({
    page: 1,
    pageSize: 20,
    ...(initialId && Number(initialId) > 0
      ? { userId: Number(initialId) }
      : {}),
  });
  const query = useQuery({
    queryKey: ["manager", "flights", filters],
    queryFn: ({ signal }) => api.flights(filters, signal),
  });
  const stats = useStats();
  const apply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setFilters({
      page: 1,
      pageSize: Number(form.get("pageSize")),
      userId: positiveId(form.get("userId")),
      vehicleId: positiveId(form.get("vehicleId")),
      from: form.get("from")
        ? new Date(`${form.get("from")}T00:00:00`).toISOString()
        : undefined,
      to: form.get("to")
        ? new Date(`${form.get("to")}T23:59:59.999`).toISOString()
        : undefined,
    });
  };
  return (
    <>
      <PageHeading
        eyebrow={t("Flight monitoring")}
        title={t("Flights")}
        description={t("Completed trips across the SkyShift initiative.")}
      />
      <Card title={t("Find a flight")}>
        <form className="filter-form" onSubmit={apply}>
          <label>
            {t("User ID")}
            <input
              name="userId"
              type="number"
              min={1}
              step={1}
              defaultValue={filters.userId}
              placeholder={t("All users")}
            />
          </label>
          <label>
            {t("Vehicle ID")}
            <input
              name="vehicleId"
              type="number"
              min={1}
              step={1}
              placeholder={t("All vehicles")}
            />
          </label>
          <label>
            {t("From")}
            <input name="from" type="date" />
          </label>
          <label>
            {t("To")}
            <input name="to" type="date" />
          </label>
          <label>
            {t("Per page")}
            <select name="pageSize" defaultValue={20}>
              <option>{t("10")}</option>
              <option>{t("20")}</option>
              <option>{t("50")}</option>
              <option>{t("100")}</option>
            </select>
          </label>
          <Button type="submit">{t("Apply")}</Button>
          <Button
            className="outline"
            type="reset"
            onClick={() => setFilters({ page: 1, pageSize: 20 })}
          >
            {t("Reset")}
          </Button>
        </form>
      </Card>
      <Card
        title={t("Recorded flights")}
        action={
          query.data ? (
            <span className="mini-label">
              {query.data.totalCount}
              {t("flights")}
            </span>
          ) : undefined
        }
      >
        <QueryGate
          pending={query.isPending}
          error={query.error}
          retry={() => {
            void query.refetch();
          }}
        >
          {query.data?.items.length ? (
            <>
              <TableWrap>
                <table>
                  <caption className="sr-only">
                    {t("Paginated flight records")}
                  </caption>
                  <thead>
                    <tr>
                      <th>{t("Flight")}</th>
                      <th>{t("User")}</th>
                      <th>{t("Vehicle")}</th>
                      <th>{t("Flight date")}</th>
                      <th>{t("Recorded at")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {query.data.items.map((flight) => (
                      <tr key={flight.id}>
                        <td>
                          <span className="flight-id">
                            <Plane size={16} />
                            {t("#")}
                            {flight.id}
                          </span>
                        </td>
                        <td>
                          {t("#")}
                          {flight.userId}
                        </td>
                        <td>
                          {flight.vehicleId
                            ? t(`#${flight.vehicleId}`)
                            : t("—")}
                        </td>
                        <td>{formatDate(flight.date, true)}</td>
                        <td>{formatDate(flight.createdAt, true)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
              <div className="pagination">
                <span>
                  {t("Page")} {query.data.page} {t("of")}{" "}
                  {query.data.totalPages}
                </span>
                <div>
                  <Button
                    className="outline"
                    disabled={query.data.page <= 1 || query.isFetching}
                    onClick={() =>
                      setFilters((f) => ({ ...f, page: (f.page || 1) - 1 }))
                    }
                  >
                    {t("Previous")}
                  </Button>
                  <Button
                    className="outline"
                    disabled={
                      query.data.page >= query.data.totalPages ||
                      query.isFetching
                    }
                    onClick={() =>
                      setFilters((f) => ({ ...f, page: (f.page || 1) + 1 }))
                    }
                  >
                    {t("Next")}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <Empty title={t("No flights found")}>
              {Object.values(filters).filter(Boolean).length > 2
                ? t("Try another set of filters.")
                : t(
                    "Flights will appear when participants record completed trips.",
                  )}
            </Empty>
          )}
        </QueryGate>
      </Card>
      <Card title={t("All-time flight activity")}>
        <QueryGate
          pending={stats.isPending}
          error={stats.error}
          retry={() => {
            void stats.refetch();
          }}
        >
          {stats.data && (
            <>
              <Trend points={stats.data.activityTrend} />
              <div className="stats-breakdown">
                <section>
                  <h3>{t("Flights per participant")}</h3>
                  {stats.data.flightsPerUser.length ? (
                    stats.data.flightsPerUser.map((item) => (
                      <div key={item.userId}>
                        <span>
                          {t("User #")}
                          {item.userId}
                        </span>
                        <strong>{item.count}</strong>
                      </div>
                    ))
                  ) : (
                    <p className="muted">{t("No flight records yet.")}</p>
                  )}
                </section>
                <section>
                  <h3>{t("Flights per vehicle")}</h3>
                  {stats.data.flightsPerVehicle.length ? (
                    stats.data.flightsPerVehicle.map((item) => (
                      <div key={item.vehicleId}>
                        <span>
                          {t("Vehicle #")}
                          {item.vehicleId}
                        </span>
                        <strong>{item.count}</strong>
                      </div>
                    ))
                  ) : (
                    <p className="muted">{t("No flight records yet.")}</p>
                  )}
                </section>
              </div>
            </>
          )}
        </QueryGate>
      </Card>
    </>
  );
};
export const ManagerAssignments = () => {
  const { t, language } = useI18n();
  void language;

  const [tab, setTab] = useState<"active" | "history">("active");
  const [filters, setFilters] = useState<{
    userId?: number;
    vehicleId?: number;
  }>({});
  const query = useQuery({
    queryKey: ["manager", "assignments", tab, filters],
    queryFn: ({ signal }) =>
      tab === "active"
        ? api.activeAssignments(signal)
        : api.history(filters, signal),
  });
  const apply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setFilters({
      userId: positiveId(form.get("userId")),
      vehicleId: positiveId(form.get("vehicleId")),
    });
  };
  return (
    <>
      <PageHeading
        eyebrow={t("One vehicle. One journey.")}
        title={t("Assignments")}
        description={t(
          "Monitor current trial allocations and completed assignment history.",
        )}
      />
      <div className="tabs" role="group" aria-label={t("Assignment view")}>
        <button
          aria-pressed={tab === "active"}
          className={tab === "active" ? "active" : ""}
          onClick={() => setTab("active")}
        >
          {t("Active assignments")}
        </button>
        <button
          aria-pressed={tab === "history"}
          className={tab === "history" ? "active" : ""}
          onClick={() => setTab("history")}
        >
          {t("History")}
        </button>
      </div>
      {tab === "history" && (
        <Card>
          <form className="filter-form" onSubmit={apply}>
            <label>
              {t("User ID")}
              <input
                type="number"
                name="userId"
                min={1}
                step={1}
                placeholder={t("All users")}
              />
            </label>
            <label>
              {t("Vehicle ID")}
              <input
                type="number"
                name="vehicleId"
                min={1}
                step={1}
                placeholder={t("All vehicles")}
              />
            </label>
            <Button>{t("Apply filters")}</Button>
            <Button
              type="reset"
              className="outline"
              onClick={() => setFilters({})}
            >
              {t("Reset")}
            </Button>
          </form>
        </Card>
      )}
      <Card
        title={
          tab === "active"
            ? t("Current allocations")
            : t("Completed allocations")
        }
        action={
          query.data ? (
            <span className="mini-label">
              {query.data.length}
              {t("assignments")}
            </span>
          ) : undefined
        }
      >
        <QueryGate
          pending={query.isPending}
          error={query.error}
          retry={() => {
            void query.refetch();
          }}
        >
          {query.data?.length ? (
            <TableWrap>
              <table>
                <caption className="sr-only">
                  {tab}
                  {t("vehicle assignments")}
                </caption>
                <thead>
                  <tr>
                    <th>{t("Assignment")}</th>
                    <th>{t("User")}</th>
                    <th>{t("Vehicle")}</th>
                    <th>{t("Starts")}</th>
                    <th>{t("Ends")}</th>
                    <th>{t("Status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.map((item) => (
                    <tr key={item.id}>
                      <td>
                        {t("#")}
                        {item.id}
                      </td>
                      <td>
                        {t("#")}
                        {item.userId}
                      </td>
                      <td>
                        {t("#")}
                        {item.vehicleId}
                      </td>
                      <td>{formatDate(item.startDate, true)}</td>
                      <td>{formatDate(item.endDate, true)}</td>
                      <td>
                        <span
                          className={`status ${item.isActive ? "available" : "unavailable"}`}
                        >
                          <span />
                          {item.isActive ? t("Active") : t("Ended")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          ) : (
            <Empty
              title={
                tab === "active"
                  ? t("No active assignments")
                  : t("No assignment history")
              }
            >
              {tab === "active"
                ? t("Allocations appear when participants select vehicles.")
                : t("Ended trial periods appear here.")}
            </Empty>
          )}
        </QueryGate>
      </Card>
    </>
  );
};
