import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";

// Real playback checks for the homepage film. Playwright's Chromium has no H.264 decoder,
// so the .mp4 URLs are served with a 3-second VP8/Opus excerpt of the same film.
// Chrome's default policy is enforced: autoplay with sound needs a prior user click.
test.use({
  launchOptions: {
    ...(process.env.CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH } : {}),
    args: ["--autoplay-policy=document-user-activation-required"],
  },
});

const clip = fs.readFileSync(new URL("./fixtures/skyshift-film-test.webm", import.meta.url));
const film = (page: Page) => page.locator(".traffic-video");
const state = (page: Page) =>
  film(page).evaluate((v: HTMLVideoElement) => ({ src: v.getAttribute("src"), paused: v.paused, muted: v.muted, t: v.currentTime }));

async function serveClip(page: Page) {
  await page.route("**/media/skyshift-film/*.mp4", (route) => {
    const range = /bytes=(\d+)-(\d*)/.exec(route.request().headers()["range"] ?? "");
    if (!range) return route.fulfill({ body: clip, headers: { "content-type": "video/webm", "accept-ranges": "bytes" } });
    const start = Number(range[1]);
    const end = range[2] ? Number(range[2]) : clip.length - 1;
    return route.fulfill({
      status: 206,
      body: clip.subarray(start, end + 1),
      headers: { "content-type": "video/webm", "accept-ranges": "bytes", "content-range": `bytes ${start}-${end}/${clip.length}` },
    });
  });
}

// Playing means currentTime actually advances, not just that paused is false.
async function expectPlaying(page: Page) {
  await expect.poll(async () => (await state(page)).t, { timeout: 15000 }).toBeGreaterThan(0.2);
  const before = await state(page);
  await page.waitForTimeout(700);
  const after = await state(page);
  expect(after.paused).toBe(false);
  expect(after.t === before.t).toBe(false); // advanced (or wrapped around by the loop)
  return after;
}

test("home film autoplays muted when sound is blocked, offers Enable sound and loops", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await serveClip(page);
  await page.goto("/");

  const muted = await expectPlaying(page);
  expect(muted.src).toBe("/media/skyshift-film/SkyShift-en-sound.mp4");
  expect(muted.muted).toBe(true);
  const enable = page.getByRole("button", { name: "Enable sound", exact: true });
  await enable.click();
  expect((await expectPlaying(page)).muted).toBe(false);
  await expect(enable).toHaveCount(0);

  // The 3-second clip must wrap around and keep playing.
  const loops = await film(page).evaluate((v: HTMLVideoElement) =>
    new Promise<number>((resolve) => {
      let last = v.currentTime;
      let wraps = 0;
      const tick = () => {
        if (v.currentTime < last) wraps++;
        last = v.currentTime;
        if (wraps >= 1) resolve(wraps); else requestAnimationFrame(tick);
      };
      tick();
    }));
  expect(loops).toBeGreaterThanOrEqual(1);
  await expectPlaying(page);
  expect(errors).toEqual([]);
});

test("a deliberate pause is kept when switching language and version, and Play resumes", async ({ page }) => {
  await serveClip(page);
  await page.goto("/");
  await expectPlaying(page);
  await film(page).evaluate((v: HTMLVideoElement) => v.pause()); // same as the pause control
  await page.getByRole("button", { name: "עברית", exact: true }).click();
  await expect(film(page)).toHaveAttribute("src", "/media/skyshift-film/SkyShift-he-sound.mp4");
  await page.getByRole("button", { name: "ללא שמע" }).click();
  await expect(film(page)).toHaveAttribute("src", "/media/skyshift-film/SkyShift-he-silent.mp4");
  await page.waitForTimeout(800);
  expect((await state(page)).paused).toBe(true);
  await film(page).evaluate((v: HTMLVideoElement) => v.play());
  await expectPlaying(page);
});

test("Hebrew visitors get the Hebrew film and a Hebrew Enable sound button", async ({ page }) => {
  await serveClip(page);
  await page.addInitScript(() => localStorage.setItem("skyshift.language", "he"));
  await page.goto("/");
  const playing = await expectPlaying(page);
  expect(playing.src).toBe("/media/skyshift-film/SkyShift-he-sound.mp4");
  await page.getByRole("button", { name: "הפעלת קול", exact: true }).click();
  expect((await expectPlaying(page)).muted).toBe(false);
});

test("if every autoplay is refused, a Play video button is shown instead of a silently stopped film", async ({ page }) => {
  await serveClip(page);
  await page.addInitScript(() => {
    const real = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
      return (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive
        ? real.call(this)
        : Promise.reject(new DOMException("Autoplay disabled", "NotAllowedError"));
    };
  });
  await page.goto("/");
  const play = page.getByRole("button", { name: "Play video", exact: true });
  await expect(play).toBeVisible();
  await play.click();
  expect((await expectPlaying(page)).muted).toBe(false);
  await expect(play).toHaveCount(0);
});

test("leaving the homepage stops the film", async ({ page }) => {
  await serveClip(page);
  await page.goto("/");
  await expectPlaying(page);
  await film(page).evaluate((v: HTMLVideoElement) => { (window as unknown as { film: HTMLVideoElement }).film = v; });
  await page.evaluate(() => { history.pushState({}, "", "/login"); dispatchEvent(new PopStateEvent("popstate")); });
  await expect(film(page)).toHaveCount(0);
  const stopped = await page.evaluate(() => {
    const v = (window as unknown as { film: HTMLVideoElement }).film;
    const t = v.currentTime;
    return new Promise<boolean>((resolve) => setTimeout(() => resolve(v.paused && v.currentTime === t), 700));
  });
  expect(stopped).toBe(true);
});
