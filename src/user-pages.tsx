import { useI18n } from "./i18n";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarDays,
  Car,
  CheckCircle2,
  Plane,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { api, ApiError } from "./api";
import { useAuth } from "./auth";
import {
  Button,
  Card,
  Empty,
  ErrorNotice,
  Modal,
  PageHeading,
  QueryGate,
  Stat,
  Status,
  SuccessNotice,
  TextLink,
  VehicleArt,
  VehicleSpecs,
} from "./components";
import type { Vehicle } from "./types";
import { vehicleDisplay } from "./vehicle-display";

// The API's percentage is a whole number (rounded down), so a few flights against a high
// monthly goal stay at 0%. Show one decimal from the same counts; eligibility stays server-side.
const progressValue = (d: { completedFlights: number; expectedMonthlyTrips: number; percentage: number }) =>
  d.expectedMonthlyTrips > 0 ? (d.completedFlights * 100) / d.expectedMonthlyTrips : d.percentage;
const progressLabel = (d: { completedFlights: number; expectedMonthlyTrips: number; percentage: number }) => {
  const v = progressValue(d);
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
};
const useDashboard = () =>
  useQuery({
    queryKey: ["dashboard"],
    queryFn: ({ signal }) => api.dashboard(signal),
  });
const useMine = () =>
  useQuery({ queryKey: ["mine"], queryFn: ({ signal }) => api.mine(signal) });
const useAvailable = () =>
  useQuery({
    queryKey: ["available"],
    queryFn: ({ signal }) => api.available(signal),
  });
const invalidateParticipant = async (
  client: ReturnType<typeof useQueryClient>,
) => {
  await Promise.all([
    client.invalidateQueries({ queryKey: ["dashboard"] }),
    client.invalidateQueries({ queryKey: ["mine"] }),
    client.invalidateQueries({ queryKey: ["available"] }),
    client.invalidateQueries({ queryKey: ["manager"] }),
  ]);
};
export const UserDashboard = () => {
  const { t, language } = useI18n();
  void language;

  const { session } = useAuth();
  const query = useDashboard();
  const available = useAvailable();
  const data = query.data;
  return (
    <>
      <PageHeading
        eyebrow={t("Your flight space")}
        title={t(`${session?.isNewAccount ? "Welcome" : "Welcome back"}, ${session?.name.split(" ")[0] || "traveler"}`)}
        description={t("Your journey, your progress, your next perspective.")}
        action={
          <Link className="button" to="/record-flight">
            <Plane size={17} />
            {t("Record a flight")}
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
            <div className="stats-grid">
              <Stat
                label={t("Completed flights")}
                value={data.completedFlights}
                note={t("During your current trial")}
                icon={Plane}
              />
              <Stat
                label={t("Monthly goal")}
                value={data.expectedMonthlyTrips}
                note={t("Based on your daily trips")}
                icon={Target}
                tone="lavender"
              />
              <Stat
                label={t("Your progress")}
                value={`${progressLabel(data)}%`}
                note={t("Of your expected trips")}
                icon={Sparkles}
                tone="turquoise"
              />
            </div>
            <div className="dashboard-grid">
              <Card
                className="journey-card"
                title={t("Your month above the ordinary")}
                action={
                  <span className="mini-label">
                    {t("One journey at a time")}
                  </span>
                }
              >
                <div className="journey-content">
                  <div
                    className="progress-ring"
                    style={
                      {
                        "--progress": `${Math.min(Math.max(progressValue(data), 0), 100)}%`,
                      } as React.CSSProperties
                    }
                  >
                    <div>
                      <strong>
                        {progressLabel(data)}
                        <small>{t("%")}</small>
                      </strong>
                      <span>{t("completed")}</span>
                    </div>
                  </div>
                  <div>
                    <h3>
                      {data.currentVehicle
                        ? t("You’re on your way.")
                        : t("Your journey starts here.")}
                    </h3>
                    <p>
                      {data.currentVehicle
                        ? t(
                            `${data.completedFlights} completed flights toward ${data.expectedMonthlyTrips} expected trips.`,
                          )
                        : t(
                            "Choose an available vehicle to begin your one-month trial.",
                          )}
                    </p>
                    <Link
                      className="button outline"
                      to={data.currentVehicle ? "/record-flight" : "/vehicles"}
                    >
                      {data.currentVehicle
                        ? t("Record your next flight")
                        : t("Explore available vehicles")}
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
                <div
                  className={`eligibility ${data.isLotteryEligible ? "eligible" : ""}`}
                >
                  <Trophy size={20} />
                  <div>
                    <strong>
                      {data.isLotteryEligible
                        ? t("You’re eligible for the lottery")
                        : t("Keep going toward lottery eligibility")}
                    </strong>
                    <span>
                      {data.isLotteryEligible
                        ? t(
                            "Your participation has met the required threshold.",
                          )
                        : t(
                            "Eligibility begins at 80% of your expected monthly trips.",
                          )}
                    </span>
                  </div>
                  {data.isLotteryEligible && <CheckCircle2 size={20} />}
                </div>
              </Card>
              <Card
                title={
                  data.currentVehicle
                    ? t("Your current vehicle")
                    : t("A sky full of possibilities")
                }
                action={
                  <TextLink
                    to={data.currentVehicle ? "/my-vehicle" : "/vehicles"}
                  >
                    {t("View")}
                  </TextLink>
                }
              >
                {data.currentVehicle ? (
                  <>
                    <VehicleArt vehicle={data.currentVehicle} />
                    <div className="featured-vehicle">
                      <h3>
                        {vehicleDisplay(data.currentVehicle).modelName}
                      </h3>
                      <span className="caption">
                        {t("Vehicle #")}
                        {data.currentVehicle.id}
                      </span>
                      <VehicleSpecs vehicle={data.currentVehicle} />
                      <Status value={data.currentVehicle.status} />
                      <Link className="button outline full" to="/my-vehicle">
                        {t("My vehicle")}
                        <ArrowRight size={15} />
                      </Link>
                    </div>
                  </>
                ) : (
                  <QueryGate
                    pending={available.isPending}
                    error={available.error}
                    retry={() => {
                      void available.refetch();
                    }}
                  >
                    {available.data?.length ? (
                      <>
                        <VehicleArt vehicle={available.data[0]} />
                        <div className="featured-vehicle">
                          <h3>
                            {vehicleDisplay(available.data[0]).modelName}
                          </h3>
                          <span className="caption">
                            {t("Vehicle #")}
                            {available.data[0].id}
                          </span>
                          <VehicleSpecs vehicle={available.data[0]} />
                          <Status value={available.data[0].status} />
                          <Link className="button outline full" to="/vehicles">
                            {t("Explore the fleet")}
                            <ArrowRight size={15} />
                          </Link>
                        </div>
                      </>
                    ) : (
                      <Empty title={t("No available vehicles")}>
                        {t(
                          "Check back when a vehicle joins the available fleet.",
                        )}
                      </Empty>
                    )}
                  </QueryGate>
                )}
              </Card>
            </div>
            <div className="soft-banner">
              <Plane size={24} />
              <div>
                <h3>{t("Every flight is part of your story.")}</h3>
                <p>
                  {t(
                    "Record each completed trip to keep your participation progress up to date.",
                  )}
                </p>
              </div>
              <TextLink to="/record-flight">{t("Record a flight")}</TextLink>
            </div>
          </>
        )}
      </QueryGate>
    </>
  );
};
export const VehiclesPage = () => {
  const { t, language } = useI18n();
  void language;

  const query = useAvailable();
  const mine = useMine();
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const client = useQueryClient();
  const navigate = useNavigate();
  const select = useMutation({
    mutationFn: api.select,
    onSuccess: async () => {
      await invalidateParticipant(client);
      setSelected(null);
      navigate("/my-vehicle");
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409)
        void invalidateParticipant(client);
    },
  });
  const vehicles = query.data || [];
  const blocked = mine.isPending || !!mine.error || !!mine.data;
  return (
    <>
      <PageHeading
        eyebrow={t("Explore. Choose. Fly.")}
        title={t("Available vehicles")}
        description={t(
          "Choose your vehicle for a one-month journey above the ordinary.",
        )}
      />
      {mine.data && (
        <div className="notice">
          <Car size={18} />
          <span>
            {t("You already have an active vehicle assignment.")}{" "}
            <Link to="/my-vehicle">{t("View your vehicle")}</Link>
            {t(".")}
          </span>
        </div>
      )}
      {mine.error && <ErrorNotice error={mine.error} />}
      <QueryGate
        pending={query.isPending}
        error={query.error}
        retry={() => {
          void query.refetch();
          void mine.refetch();
        }}
      >
        {vehicles.length ? (
          <div className="vehicle-grid">
            {vehicles.map((vehicle) => (
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
                  <p>
                    <CalendarDays size={16} />
                    {t("One-month trial")}
                  </p>
                  <Button
                    className="outline full"
                    disabled={blocked || select.isPending}
                    onClick={() => {
                      select.reset();
                      setSelected(vehicle);
                    }}
                  >
                    {mine.data ? t("Already assigned") : t("Select vehicle")}
                    <ArrowRight size={15} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <Empty title={t("No vehicles available")}>
              {t(
                "The available fleet will appear here when vehicles are ready.",
              )}
            </Empty>
          </Card>
        )}
      </QueryGate>
      <p className="caption">
        {t(
          "Vehicle details are saved in the fleet. Vehicles without specifications show a general illustration.",
        )}
      </p>
      {selected && (
        <Modal
          title={t(`Select vehicle #${selected.id}`)}
          onClose={() => {
            if (!select.isPending) setSelected(null);
          }}
        >
          <VehicleArt vehicle={selected} />
          <p>
            {t(
              "This vehicle will be allocated to you for one month. You can hold one active vehicle assignment at a time.",
            )}
          </p>
          {select.error && <ErrorNotice error={select.error} />}
          <div className="modal-actions">
            <Button
              className="outline"
              disabled={select.isPending}
              onClick={() => setSelected(null)}
            >
              {t("Cancel")}
            </Button>
            <Button
              disabled={select.isPending}
              onClick={() => select.mutate(selected.id)}
            >
              {select.isPending ? t("Allocating…") : t("Confirm selection")}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
};
export const MyVehicle = () => {
  const { t, language } = useI18n();
  void language;

  const query = useMine();
  const vehicle = query.data;
  return (
    <>
      <PageHeading
        eyebrow={t("Your personal journey")}
        title={t("My vehicle")}
        description={t("Your current vehicle, ready for the next perspective.")}
      />
      <QueryGate
        pending={query.isPending}
        error={query.error}
        retry={() => {
          void query.refetch();
        }}
      >
        {vehicle ? (
          <div className="my-vehicle-grid">
            <Card className="my-vehicle-showcase">
              <VehicleArt vehicle={vehicle} large />
              <div className="showcase-footer">
                <div>
                  <span className="eyebrow">
                    {t("Your current assignment")}
                  </span>
                  <h2>{vehicleDisplay(vehicle).modelName}</h2>
                </div>
                <Status value={vehicle.status} />
              </div>
            </Card>
            <Card title={t("Your flight companion")}>
              <VehicleSpecs vehicle={vehicle} />
              <div className="detail-list">
                <div>
                  <span>{t("Vehicle identifier")}</span>
                  <strong>
                    {t("#")}
                    {vehicle.id}
                  </strong>
                </div>
                <div>
                  <span>{t("Trial period")}</span>
                  <strong>{t("One month")}</strong>
                </div>
              </div>
              <p className="muted">
                {t(
                  "Record your completed flights to keep your progress up to date.",
                )}
              </p>
              <Link className="button full" to="/record-flight">
                <Plane size={17} />
                {t("Record a flight")}
              </Link>
              <Link className="button outline full" to="/dashboard">
                {t("View my progress")}
              </Link>
            </Card>
          </div>
        ) : (
          <Card>
            <Empty title={t("Your vehicle is waiting to be chosen")}>
              {t("Select an available vehicle to begin your one-month trial.")}
            </Empty>
            <div className="center">
              <Link className="button" to="/vehicles">
                {t("Explore vehicles")}
                <ArrowRight size={16} />
              </Link>
            </div>
          </Card>
        )}
      </QueryGate>
    </>
  );
};
export const RecordFlight = () => {
  const { t, language } = useI18n();
  void language;

  const mine = useMine();
  const client = useQueryClient();
  const [date, setDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  });
  const [dateError, setDateError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: api.recordFlight,
    onSuccess: () => invalidateParticipant(client),
  });
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutation.reset();
    const selected = new Date(date);
    if (!Number.isFinite(selected.getTime()) || selected.getTime() > Date.now()) {
      setDateError("Choose a valid date and time that is not in the future.");
      return;
    }
    setDateError(null);
    mutation.mutate(selected.toISOString());
  };
  return (
    <>
      <PageHeading
        eyebrow={t("One flight at a time")}
        title={t("Record a flight")}
        description={t(
          "Keep your journey up to date by recording a completed trip.",
        )}
      />
      <QueryGate
        pending={mine.isPending}
        error={mine.error}
        retry={() => {
          void mine.refetch();
        }}
      >
        {mine.data ? (
          <div className="record-grid">
            <Card title={t("Your completed flight")}>
              <form onSubmit={submit}>
                <div className="selected-vehicle">
                  <span className="stat-icon blue">
                    <Plane />
                  </span>
                  <div>
                    <small>{t("Your assigned vehicle")}</small>
                    <strong>
                      {t("Vehicle #")}
                      {mine.data.id}
                    </strong>
                  </div>
                  <Status value={mine.data.status} />
                </div>
                <label>
                  {t("Flight date and time")}
                  <input
                    type="datetime-local"
                    name="date"
                    value={date}
                    required
                    onChange={(e) => {
                      setDate(e.target.value);
                      setDateError(null);
                      mutation.reset();
                    }}
                  />
                  <small>
                    {t("Enter the local date and time of your trip.")}
                  </small>
                </label>
                {dateError && <p role="alert" className="field-error">{t(dateError)}</p>}
                {mutation.error && <ErrorNotice error={mutation.error} />}
                {mutation.isSuccess && (
                  <SuccessNotice>
                    {t(
                      "Flight recorded successfully. Your dashboard has been updated.",
                    )}
                  </SuccessNotice>
                )}
                <Button
                  className="full"
                  disabled={mutation.isPending || mutation.isSuccess || !date}
                >
                  {mutation.isPending
                    ? t("Recording…")
                    : mutation.isSuccess
                      ? t("Flight recorded")
                      : t("Record completed flight")}
                  <CheckCircle2 size={17} />
                </Button>
                {mutation.isSuccess && (
                  <div className="form-success-actions">
                    <Link className="text-link" to="/dashboard">
                      {t("View my progress")}
                      <ArrowRight size={15} />
                    </Link>
                    <Button
                      className="outline"
                      type="button"
                      onClick={() => mutation.reset()}
                    >
                      {t("Record another flight")}
                    </Button>
                  </div>
                )}
              </form>
            </Card>
            <Card className="record-aside">
              <VehicleArt vehicle={mine.data} />
              <h2>{t("Every flight counts.")}</h2>
              <p>
                {t(
                  "Your vehicle is automatically linked to this flight through your current assignment.",
                )}
              </p>
              <div className="mini-callout">
                <Target size={20} />
                <Link className="text-link" to="/dashboard">
                  {t("See your updated progress in your personal dashboard.")}
                </Link>
              </div>
            </Card>
          </div>
        ) : (
          <Card>
            <Empty title={t("Choose a vehicle first")}>
              {t("You need an active vehicle assignment to record a flight.")}
            </Empty>
            <div className="center">
              <Link className="button" to="/vehicles">
                {t("Choose my vehicle")}
                <ArrowRight size={16} />
              </Link>
            </div>
          </Card>
        )}
      </QueryGate>
    </>
  );
};
