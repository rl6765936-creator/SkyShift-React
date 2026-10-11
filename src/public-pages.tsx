import { LanguageSwitch, useI18n } from "./i18n";
import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Car,
  Eye,
  EyeOff,
  Plane,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { api } from "./api";
import { saveGender } from "./addressing";
import { SkyShiftStory } from "./skyshift-story";
import { useAuth } from "./auth";
import { Brand, Button, ErrorNotice, Modal } from "./components";
import { LittleTakeoff, SkyTrafficScene } from "./home-animation";
export const Home = () => {
  const { t, language } = useI18n();
  void language;

  const { session } = useAuth();
  const [storyOpen, setStoryOpen] = useState(false);
  return (
    <div className="public-page">
      {storyOpen && <Modal title="The SkyShift idea" onClose={() => setStoryOpen(false)}><SkyShiftStory /></Modal>}
      <LanguageSwitch floating />
      <a href="#home-main" className="skip-link">
        {t("Skip to content")}
      </a>
      <div className="landing-scene">
        <header className="public-header">
          <Brand />
          <nav aria-label={t("Public navigation")}>
            <a href="#experience">{t("Experience")}</a>
            <Link to={session ? "/vehicles" : "/login"}>{t("Vehicles")}</Link>
            <Link to={session ? "/dashboard" : "/login"}>{t("Dashboard")}</Link>
          </nav>
          <div className="header-actions">
            {session ? (
              <Link
                className="button"
                to={session.role === "Manager" ? "/manager" : "/dashboard"}
              >
                {t("My workspace")}
                <ArrowRight size={15} />
              </Link>
            ) : (
              <>
                <Link className="login-link" to="/login">
                  {t("Login")}
                </Link>
                <Link className="button" to="/register">
                  {t("Register")}
                </Link>
              </>
            )}
          </div>
        </header>
        <main id="home-main" className="landing-hero">
          <div className="hero-copy">
            <span className="eyebrow">
              {t("A new perspective on everyday journeys")}
            </span>
            <h1>
              {t("Your Next Flight")}
              <br />
              {t("Is Just a Click Away")}
            </h1>
            <p>
              {t("Explore. Choose. Fly.")}
              <br />
              {t("Your personal journey, a little closer to the sky.")}
            </p>
            <div className="hero-actions">
              <Link className="button" to={session ? "/vehicles" : "/register"}>
                {t("Get started")}
                <ArrowRight size={17} />
              </Link>
              <Button className="outline" onClick={() => setStoryOpen(true)}>{t("The SkyShift idea")}</Button>
            </div>
            <div className="hero-footnote">
              <span />
              <span>{t("A one-month experience. A whole new view.")}</span>
            </div>
          </div>
          <div className="hero-picture">
            <img
              src="/skyline.webp"
              alt={t(
                "Silver air vehicle above a sunlit futuristic city in the clouds",
              )}
            />
            <LittleTakeoff />
            <div className="picture-caption">
              <Plane size={17} />
              <span>
                SkyShift <small>{t("Fly further")}</small>
              </span>
            </div>
          </div>
        </main>
        <div className="hero-wave" />
        <section className="trust-strip" aria-label={t("SkyShift experience")}>
          <div>
            <ShieldCheck />
            <span>
              <strong>{t("Your space")}</strong>
              <small>{t("Secure account access")}</small>
            </span>
          </div>
          <div>
            <Car />
            <span>
              <strong>{t("Choose your vehicle")}</strong>
              <small>{t("Available fleet, in one place")}</small>
            </span>
          </div>
          <div>
            <Plane />
            <span>
              <strong>{t("Keep flying")}</strong>
              <small>{t("Record your completed trips")}</small>
            </span>
          </div>
          <div>
            <Sparkles />
            <span>
              <strong>{t("See your progress")}</strong>
              <small>{t("Your journey at a glance")}</small>
            </span>
          </div>
        </section>
      </div>
      <section id="experience" className="experience">
        <div>
          <span className="eyebrow">{t("Explore. Choose. Fly.")}</span>
          <h2>
            {t("More than a ride.")}
            <br />
            <em>{t("A new perspective.")}</em>
          </h2>
          <p>
            {t(
              "Choose an available vehicle for your one-month trial, record your flights, and follow your progress in your personal workspace.",
            )}
          </p>
        </div>
        <div className="experience-cards">
          {[
            {
              n: "01",
              title: "Find your vehicle",
              text: "Explore the vehicles currently available in the SkyShift fleet.",
              image: 1,
            },
            {
              n: "02",
              title: "Make it your month",
              text: "Select one vehicle for your personal trial.",
              image: 2,
            },
            {
              n: "03",
              title: "Follow your journey",
              text: "Record flights and see your participation progress.",
              image: 3,
            },
          ].map((item) => (
            <div className="experience-card" key={item.n}>
              <img
                src={`/vehicle-${item.image}.webp`}
                alt={t("Concept illustration of an air vehicle")}
              />
              <span className="step-number">{item.n}</span>
              <h3>{t(item.title)}</h3>
              <p>{t(item.text)}</p>
            </div>
          ))}
        </div>
      </section>
      <SkyTrafficScene />
      <footer className="public-footer">
        <Brand />
        <span>{t("Fly further.")}</span>
        <span>{t("Vehicle imagery is illustrative.")}</span>
        <a className="text-link" href={`/media/skyshift-film/SkyShift-${language}-sound.mp4`}>
          {language === "he" ? "צפייה בסרטון" : "View video"}
        </a>
      </footer>
    </div>
  );
};
export const AuthPage = ({ register = false }: { register?: boolean }) => {
  const { t, language, gender, setGender } = useI18n();
  void language;

  const { session, signIn, expired } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);
  if (session)
    return (
      <Navigate
        to={session.role === "Manager" ? "/manager" : "/dashboard"}
        replace
      />
    );
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setPending(true);
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email")).trim();
    const password = String(data.get("password"));
    try {
      const result = register
        ? await api.register({
            name: String(data.get("name")).trim(),
            email,
            password,
            averageDailyTrips: Number(data.get("averageDailyTrips")),
            gender: gender === "male" ? "Male" : "Female",
          })
        : await api.login(email, password);
      if (register) saveGender(gender, result.id);
      const next = signIn(result, register);
      navigate(next.role === "Manager" ? "/manager" : "/dashboard", {
        replace: true,
      });
    } catch (cause) {
      setError(cause);
    } finally {
      setPending(false);
    }
  };
  return (
    <div className="auth-page">
      <LanguageSwitch floating />
      <section className="auth-visual">
        <Brand />
        <div>
          <span className="eyebrow">{t("Your everyday, elevated.")}</span>
          <h1>
            {t("A little closer")}
            <br />
            {t("to the sky.")}
          </h1>
          <p>
            {t("A calmer way to choose, fly")}
            <br />
            {t("and follow your journey.")}
          </p>
        </div>
        <img
          src="/skyline.webp"
          alt={t("Air vehicle floating above a city in the clouds")}
        />
        <span className="auth-visual-caption">
          {t("SkyShift — Fly further.")}
        </span>
      </section>
      <main className="auth-form-panel">
        <Link to="/" className="back-link">
          {t("← Back to SkyShift")}
        </Link>
        <div className="auth-form">
          <span className="eyebrow">
            {register ? t("Start your journey") : t("Your sky is waiting")}
          </span>
          <h1>{register ? t("Welcome to SkyShift") : t("Welcome back")}</h1>
          <p>
            {register
              ? t("Create your account and explore a new perspective.")
              : t("Sign in to your personal flight space.")}
          </p>
          {expired && (
            <div className="notice" role="status">
              {t("Your session has expired. Please sign in again.")}
            </div>
          )}
          {error !== null && <ErrorNotice error={error} />}
          <form onSubmit={submit}
            onInput={(event) => {
              if (event.target instanceof HTMLInputElement) event.target.setCustomValidity("");
            }}
            onInvalid={(event) => {
              const input = event.target;
              if (!(input instanceof HTMLInputElement)) return;
              input.setCustomValidity("");
              const pick = (en: string, he: string) => language === "he" ? he : en;
              if (input.validity.valueMissing)
                input.setCustomValidity(pick("Please fill in this field.", "יש למלא את השדה הזה."));
              else if (input.name === "email")
                input.setCustomValidity(pick("Enter a valid email address.", "יש להזין כתובת אימייל תקינה."));
              else if (input.name === "password")
                input.setCustomValidity(pick("Enter at least 6 characters.", "יש להזין לפחות 6 תווים."));
              else if (input.name === "name")
                input.setCustomValidity(pick("Enter a full name containing 1 to 200 characters.", "יש להזין שם מלא באורך של 1 עד 200 תווים."));
              else if (input.name === "averageDailyTrips")
                input.setCustomValidity(pick("Enter a whole number between 1 and 2147483647.", "יש להזין מספר שלם בין 1 ל־2147483647."));
            }}
          >
            {register && (
              <label>
                {t("Full name")}
                <input
                  name="name"
                  required
                  maxLength={200}
                  autoComplete="name"
                  placeholder={t("Your name")}
                  pattern=".*\S.*"
                />
              </label>
            )}
            {register && <fieldset className="gender-field"><legend>{t("Gender")}</legend>
              <label><input type="radio" name="gender" value="male" checked={gender === "male"} onChange={() => setGender("male")} required />{t("Male")}</label>
              <label><input type="radio" name="gender" value="female" checked={gender === "female"} onChange={() => setGender("female")} required />{t("Female")}</label>
              <small>{t("Used to personalize how we address you.")}</small>
            </fieldset>}
            <label>
              {t("Email address")}
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder={t("you@example.com")}
              />
            </label>
            <label>
              {t("Password")}
              <div className="password-field">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={register ? 6 : undefined}
                  autoComplete={register ? "new-password" : "current-password"}
                  placeholder={
                    register
                      ? t("At least 6 characters")
                      : t("Enter your password")
                  }
                />
                <button
                  type="button"
                  className="icon-button"
                  aria-label={
                    showPassword ? t("Hide password") : t("Show password")
                  }
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
            {register && (
              <label>
                {t("Average daily trips")}
                <input
                  name="averageDailyTrips"
                  type="number"
                  min={1}
                  max={2147483647}
                  step={1}
                  defaultValue={2}
                  required
                />
                <small>
                  {t("Your monthly flight goal uses your average daily trips.")}
                </small>
              </label>
            )}
            <Button className="full" disabled={pending}>
              {pending
                ? t("Please wait…")
                : register
                  ? t("Create my account")
                  : t("Sign in")}
              <ArrowRight size={17} />
            </Button>
          </form>
          <p className="auth-switch">
            {register ? t("Already have an account?") : t("New to SkyShift?")}{" "}
            <Link to={register ? "/login" : "/register"}>
              {register ? t("Sign in") : t("Create an account")}
            </Link>
          </p>
          <div className="auth-note">
            <ShieldCheck size={16} />
            {t("Your account. Your journey.")}
          </div>
        </div>
      </main>
    </div>
  );
};
