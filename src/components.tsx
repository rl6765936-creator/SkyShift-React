import { useI18n } from "./i18n";
import { useEffect, useRef, useId, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  Car,
  ArrowRight,
  Check,
  LoaderCircle,
  Plane,
  RefreshCw,
  X,
  Users,
  Gauge,
  type LucideIcon,
} from "lucide-react";
import type { CatalogIdentification, SpecificationAccuracy, VehicleStatus } from "./types";
import type { VehicleMetadata } from "./types";
import { vehicleDisplay } from "./vehicle-display";
import { errorMessages } from "./error-messages";
export const Brand = () => {
  const { t, language } = useI18n();
  void language;
  return (
    <Link className="brand" to="/" aria-label={t("SkyShift home")}>
      <svg viewBox="0 0 36 32" fill="none" aria-hidden="true">
        <path
          d="M3 13 32 3 20 29 15 19 3 13Z"
          fill="#eaf2f7"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="m3 13 15 2L32 3 15 19l3-4M15 19l5 10"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      <span>SkyShift</span>
    </Link>
  );
};
export const Button = ({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button className={`button ${className}`} {...props}>
    {children}
  </button>
);
export const ErrorNotice = ({ error }: { error: unknown }) => {
  const { language, address } = useI18n();
  return (
    <div className="notice error" role="alert">
      <AlertCircle size={18} />
      <span>{errorMessages(error, language).map((message) => (
        <span key={message} style={{ display: "block" }}>{language === "he" ? address(message) : message}</span>
      ))}</span>
    </div>
  );
};
export const SuccessNotice = ({ children }: { children: ReactNode }) => (
  <div className="notice success" role="status">
    <Check size={18} />
    {children}
  </div>
);
export const QueryGate = ({
  pending,
  error,
  retry,
  children,
}: {
  pending: boolean;
  error: unknown;
  retry: () => void;
  children: ReactNode;
}) => {
  const { t, language } = useI18n();
  void language;
  return pending ? (
    <div className="loading" role="status">
      <LoaderCircle className="spin" size={24} />
      <span>{t("Connecting to your sky…")}</span>
    </div>
  ) : error ? (
    <div className="query-error">
      <ErrorNotice error={error} />
      <Button className="outline" onClick={retry}>
        <RefreshCw size={15} />
        {t("Try again")}
      </Button>
    </div>
  ) : (
    <>{children}</>
  );
};
export const Empty = ({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) => {
  const { t, language } = useI18n();
  void language;
  return (
    <div className="empty">
      <span className="empty-icon">
        <Plane size={28} strokeWidth={1.2} />
      </span>
      <h3>{t(title)}</h3>
      {children && <p>{children}</p>}
    </div>
  );
};
export const PageHeading = ({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) => {
  const { t, language } = useI18n();
  void language;
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{t(eyebrow)}</span>
        <h1>{t(title)}</h1>
        <p>{t(description)}</p>
      </div>
      {action}
    </div>
  );
};
export const Card = ({
  title,
  children,
  action,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) => {
  const { t, language } = useI18n();
  void language;
  return (
    <section className={`card ${className}`}>
      {title && (
        <div className="card-heading">
          <h2>{t(title)}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
};
export const Stat = ({
  label,
  value,
  note,
  icon: Icon,
  tone = "blue",
}: {
  label: string;
  value: string | number;
  note: string;
  icon: LucideIcon;
  tone?: string;
}) => {
  const { t, language } = useI18n();
  void language;
  return (
    <div className="stat">
      <span className={`stat-icon ${tone}`}>
        <Icon size={22} strokeWidth={1.5} />
      </span>
      <div>
        <span className="stat-label">{t(label)}</span>
        <strong>{value}</strong>
        <span className="stat-note">{t(note)}</span>
      </div>
    </div>
  );
};
const statusNames: VehicleStatus[] = [
  "Available",
  "InUse",
  "Maintenance",
  "Unavailable",
  "Retired",
];
export const Status = ({ value }: { value: VehicleStatus | number }) => {
  const { t, language } = useI18n();
  void language;

  const status = typeof value === "number" ? statusNames[value] : value;
  return (
    <span className={`status ${status?.toLowerCase()}`}>
      <span />
      {t(status === "InUse" ? "In use" : status || "Unknown")}
    </span>
  );
};
export const VehicleArt = ({
  vehicle,
  large = false,
}: {
  vehicle: VehicleMetadata;
  large?: boolean;
}) => {
  const { t, language } = useI18n();
  void language;
  return (
    <div className={`vehicle-art ${large ? "large" : ""}`}>
      {vehicle.imageUrl ? <img
        src={vehicle.imageUrl}
        onError={(event) => { event.currentTarget.style.visibility = "hidden"; }}
        alt={t("Flying road car concept") + " · " + vehicleDisplay(vehicle).modelName}
      /> : <Car size={64} aria-label={t("Vehicle image unavailable")} /> }
      <span>{t("Concept illustration")}</span>
    </div>
  );
};
export const formatDate = (date: string | null, includeTime = false) =>
  date
    ? new Intl.DateTimeFormat(
        document.documentElement.lang === "he" ? "he-IL" : "en-GB",
        {
          dateStyle: "medium",
          ...(includeTime ? { timeStyle: "short" as const } : {}),
        },
      ).format(
        new Date(/(?:Z|[+-]\d{2}:\d{2})$/i.test(date) ? date : `${date}Z`),
      )
    : "—";
export const decimal = (value: number) =>
  new Intl.NumberFormat(
    document.documentElement.lang === "he" ? "he-IL" : "en",
    { maximumFractionDigits: 1 },
  ).format(value);
export const TextLink = ({
  to,
  children,
}: {
  to: string;
  children: ReactNode;
}) => (
  <Link className="text-link" to={to}>
    {children}
    <ArrowRight size={14} />
  </Link>
);
export const Modal = ({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) => {
  const { t, language } = useI18n();
  void language;

  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="modal-title"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-heading">
        <h2 id="modal-title">{t(title)}</h2>
        <button
          className="icon-button"
          aria-label={t("Close dialog")}
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
};
export const Trend = ({
  points,
}: {
  points: { date: string; count: number }[];
}) => {
  const { t, language } = useI18n();
  void language;

  const gradient = useId();
  if (!points.length)
    return (
      <Empty title={t("No flight activity yet")}>
        {t("Recorded flights will appear here.")}
      </Empty>
    );
  const shown = points.slice(-16);
  const max = Math.max(...shown.map((p) => p.count), 1);
  const coords = shown.map((p, i) => ({
    x: 40 + (shown.length === 1 ? 250 : (i * 500) / (shown.length - 1)),
    y: 160 - (p.count / max) * 130,
    ...p,
  }));
  const line = coords
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ");
  return (
    <div className="trend">
      <svg
        className="trend-line"
        viewBox="0 0 560 198"
        role="img"
        aria-label={t("Flights recorded over time")}
      >
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8178D8" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#8178D8" stopOpacity="0.015" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((n) => (
          <g key={n}>
            <line
              x1="40"
              x2="540"
              y1={160 - n * 130}
              y2={160 - n * 130}
              stroke="#edf1f7"
              strokeWidth="1"
            />
            <text
              x="30"
              y={164 - n * 130}
              textAnchor="end"
              fill="#718096"
              fontSize="9"
            >
              {Math.round(n * max)}
            </text>
          </g>
        ))}
        <path
          d={`${line} L${coords[coords.length - 1].x},160 L${coords[0].x},160 Z`}
          fill={`url(#${gradient})`}
        />
        <path d={line} fill="none" stroke="#8178D8" strokeWidth="2" />
        {coords.map((p, i) => (
          <g key={p.date}>
            <circle cx={p.x} cy={p.y} r="3" fill="#8178D8">
              <title>
                {formatDate(p.date)}
                {t(":")}
                {p.count}
                {t("flights")}
              </title>
            </circle>
            {(shown.length <= 8 || i % 2 === 0 || i === shown.length - 1) && (
              <text
                x={p.x}
                y="183"
                textAnchor="middle"
                fill="#718096"
                fontSize="9"
              >
                {new Date(p.date).toLocaleDateString(
                  language === "he" ? "he-IL" : "en-GB",
                  {
                    day: "numeric",
                    month: "short",
                  },
                )}
              </text>
            )}
          </g>
        ))}
      </svg>
      <div className="sr-only">
        {shown.map((p) => (
          <span key={p.date}>
            {formatDate(p.date)}
            {t(":")}
            {p.count}
            {t("flights.")}{" "}
          </span>
        ))}
      </div>
      <p className="caption">
        {t("By recording date · latest")}
        {shown.length}
        {t("active days")}
      </p>
    </div>
  );
};
export const TableWrap = ({ children }: { children: ReactNode }) => (
  <div className="table-wrap" tabIndex={0}>
    {children}
  </div>
);

// Labels each specification value: illustrative SkyShift data vs manufacturer specification.
export const AccuracyBadge = ({ accuracy }: { accuracy: SpecificationAccuracy | null | undefined }) => {
  const { t } = useI18n();
  if (!accuracy) return null;
  return accuracy === "Illustrative" ? (
    <span className="accuracy-badge illustrative" title={t("Illustrative SkyShift data — not a manufacturer specification")}>
      {t("Illustrative")}
    </span>
  ) : (
    <span className="accuracy-badge verified">{t("Manufacturer specification")}</span>
  );
};

// Explanatory lines shared by vehicle cards and the manager catalog form.
export const CatalogNotes = ({ accuracies, identification, isCatalog }: {
  accuracies: (SpecificationAccuracy | null | undefined)[];
  identification?: CatalogIdentification | null;
  isCatalog: boolean;
}) => {
  const { t } = useI18n();
  if (!isCatalog) return null;
  return (
    <div className="catalog-notes">
      {accuracies.includes("Illustrative") && <small className="catalog-disclaimer">{t("Illustrative SkyShift data — not a manufacturer specification")}</small>}
      {identification === "VisualInspiration" && <small className="catalog-disclaimer">{t("Visual inspiration — model not verified")}</small>}
      <small className="catalog-disclaimer">{t("Propellers are a SkyShift illustration; the road car does not fly")}</small>
    </div>
  );
};

export const VehicleSpecs = ({ vehicle }: { vehicle: VehicleMetadata }) => {
  const { t, language } = useI18n();
  const display = vehicleDisplay(vehicle);
  return (
    <>
    {vehicle.description && <p className="vehicle-description">{language === "he" ? vehicle.descriptionHe || vehicle.description : vehicle.description}</p>}
    <div className="vehicle-specs">
      <span title={t("Seats")}>
        <Users size={16} />
        {display.seats ?? "—"}{" "}
        {t("seats")}
        <AccuracyBadge accuracy={display.seatsAccuracy} />
      </span>
      <span title={t("Maximum road speed (km/h)")}>
        <Gauge size={16} />
        {display.speedKmh ?? "—"}{" "}
        {t("km/h")}
        <AccuracyBadge accuracy={display.speedAccuracy} />
      </span>
    </div>
    <CatalogNotes
      isCatalog={display.isCatalog}
      accuracies={[display.seatsAccuracy, display.speedAccuracy]}
      identification={vehicle.catalogIdentification}
    />
    </>
  );
};
