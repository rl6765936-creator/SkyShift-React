import { useI18n } from "./i18n";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "./components";
import "./home-animation.css";

// Decorative motion respects the operating system's accessibility preference.
const useReducedMotion = () => {
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return reduced;
};

// A code-native mask isolates the existing SkyCar concept from its thumbnail.
// It does not add a new external asset or change any backend vehicle data.
const SkyVehicle = ({ className = "" }: { className?: string }) => {
  const clip = useId();
  return (
    <svg className={className} viewBox="0 0 154 86" aria-hidden="true">
      <defs>
        <clipPath id={clip}>
          <path d="M11 50 L20 45 Q36 35 63 31 L84 26 Q101 24 112 28 L106 33 L121 39 L146 46 L143 53 L145 56 L130 66 L113 67 Q98 77 84 70 L73 69 L58 64 L45 65 L25 60 Z" />
        </clipPath>
      </defs>
      <image
        href="/vehicle-2.webp"
        width="154"
        height="86"
        clipPath={`url(#${clip})`}
      />
    </svg>
  );
};

export const LittleTakeoff = () => {
  const reduced = useReducedMotion();
  if (reduced) return null;
  return (
    <div className="little-takeoff" aria-hidden="true">
      <span className="little-takeoff-glow" />
      <SkyVehicle />
      <span className="little-takeoff-trail" />
    </div>
  );
};

const FILM_VOLUME = 0.45;

const errorName = (error: unknown) => (error instanceof DOMException ? error.name : "");

export const SkyTrafficScene = () => {
  const { t, language } = useI18n();
  const [silent, setSilent] = useState(false);
  const [failed, setFailed] = useState(false);
  // Autoplay with sound was refused, so the film is playing muted and offers sound.
  const [mutedFallback, setMutedFallback] = useState(false);
  // Even muted playback was refused (e.g. autoplay disabled in the browser settings).
  const [blocked, setBlocked] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  // A deliberate pause during this visit. Switching language or version then waits for Play.
  const userPaused = useRef(false);
  // Pauses issued by this component, so they are not mistaken for the user's pause.
  const ownPauses = useRef(new WeakSet<HTMLVideoElement>());
  const source = `/media/skyshift-film/SkyShift-${language}-${silent ? "silent" : "sound"}.mp4`;

  // Try with sound first; if the browser's autoplay policy refuses, keep the film
  // moving muted instead of leaving it stopped.
  const start = useCallback(async (player: HTMLVideoElement, isCurrent: () => boolean) => {
    player.volume = FILM_VOLUME;
    player.muted = false;
    try {
      await player.play();
      if (isCurrent()) { setMutedFallback(false); setBlocked(false); }
      return;
    } catch (error) {
      if (!isCurrent() || errorName(error) === "AbortError") return; // superseded by a newer load
      if (errorName(error) !== "NotAllowedError") { setBlocked(true); return; }
    }
    player.muted = true;
    try {
      await player.play();
      if (isCurrent()) { setMutedFallback(true); setBlocked(false); }
    } catch (error) {
      if (isCurrent() && errorName(error) !== "AbortError") setBlocked(true);
    }
  }, []);

  useEffect(() => {
    const player = video.current;
    if (!player) return;
    setFailed(false);
    setBlocked(false);
    let current = true;
    if (!userPaused.current) void start(player, () => current && video.current === player);
    return () => {
      current = false;
      // Leaving the page (or switching film) stops this element; not a user pause.
      if (!player.paused) { ownPauses.current.add(player); player.pause(); }
    };
  }, [source, start]);

  const playNow = () => {
    const player = video.current;
    if (!player) return;
    userPaused.current = false;
    void start(player, () => video.current === player);
  };

  const enableSound = () => {
    const player = video.current;
    if (!player) return;
    player.muted = false;
    player.volume = FILM_VOLUME;
    // Called from a click, so the browser allows sound now.
    player.play().then(() => setMutedFallback(false)).catch(() => {
      player.muted = true;
      void player.play().catch(() => setBlocked(true));
    });
  };

  return (
    <section className="traffic-feature" aria-labelledby="traffic-heading">
      <div className="traffic-feature-copy">
        <span className="eyebrow">{t("A different way forward")}</span>
        <h2 id="traffic-heading">{t("Same traffic.")}<br /><em>{t("A whole new perspective.")}</em></h2>
        <p>{t("A familiar road. A long queue. A SkyShift car that lifts off and continues above the traffic.")}</p>
        <span className="traffic-concept-label">{t("Concept simulation · 24 seconds")}</span>
      </div>
      <div className="traffic-player">
        <video
          key={source}
          ref={video}
          className="traffic-video"
          src={source}
          poster="/media/skyshift-film/poster.jpg"
          controls
          loop
          playsInline
          preload="auto"
          aria-label={t("SkyShift rises above the traffic")}
          onPlay={() => { userPaused.current = false; setBlocked(false); }}
          onPause={(event) => {
            const player = event.currentTarget;
            if (ownPauses.current.delete(player) || document.hidden) return;
            userPaused.current = true;
          }}
          onVolumeChange={(event) => { if (!event.currentTarget.muted) setMutedFallback(false); }}
          onError={() => setFailed(true)}
        >{t("Your browser does not support video playback.")}</video>
        {mutedFallback && !silent && !failed && (
          <div className="traffic-sound-prompt" role="status">
            <span>{t("Your browser started the film without sound.")}</span>{" "}
            <Button type="button" onClick={enableSound}>{t("Enable sound")}</Button>
          </div>
        )}
        {blocked && !failed && (
          <div className="traffic-sound-prompt" role="status">
            <span>{t("Your browser did not allow the film to start automatically.")}</span>{" "}
            <Button type="button" onClick={playNow}>{t("Play video")}</Button>
          </div>
        )}
        <div className="traffic-controls">
          <span>{silent ? t("Silent version") : t("Music and sound effects")}</span>
          <div>
            <Button className="outline" aria-pressed={silent} onClick={() => setSilent(v => !v)}>
              {silent ? t("Use music version") : t("Use silent version")}
            </Button>
            <button className="icon-button" aria-label={t("Replay traffic animation")} onClick={() => {
              const player = video.current;
              if (!player) return;
              player.currentTime = 0;
              if (player.paused) playNow();
            }}><RotateCcw size={16} /></button>
          </div>
        </div>
        {failed && <p className="traffic-video-error" role="alert">{t("The video could not be loaded. Check your connection or whether the video is blocked by your filter.")}</p>}
      </div>
    </section>
  );
};
