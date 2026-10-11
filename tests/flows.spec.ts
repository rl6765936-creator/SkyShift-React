import { test, expect, type Page } from "@playwright/test";
const claim = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
const token = (role: string, expired = false) =>
  `${Buffer.from('{"alg":"HS256"}').toString("base64url")}.${Buffer.from(JSON.stringify({ [claim]: role, exp: Math.floor(Date.now() / 1000) + (expired ? -1 : 3600) })).toString("base64url")}.test-only`;
const response = (role: string) => ({
  id: 1,
  name: role === "Manager" ? "Fleet Manager" : "Rivka",
  email: "test@example.com",
  token: token(role),
});
const vehicle = { id: 1, status: 0, isPersonalExperimental: false };
const auth = async (page: Page, role: string) => {
  await page.addInitScript(
    (session) =>
      sessionStorage.setItem("skyshift.session", JSON.stringify(session)),
    response(role),
  );
};
const fixture = async (
  page: Page,
  options: {
    assigned?: boolean;
    conflict?: boolean;
    unauthorized?: boolean;
  } = {},
) => {
  let assigned = options.assigned || false;
  let count = 12;
  const writes: { path: string; body: unknown }[] = [];
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const body = request.postData() ? request.postDataJSON() : undefined;
    if (request.method() !== "GET") writes.push({ path, body });
    const reply = (json: unknown, status = 200) =>
      route.fulfill({ status, json });
    if (path === "/api/auth/login" || path === "/api/auth/register")
      return reply(response("User"), path.endsWith("register") ? 201 : 200);
    if (!request.headers().authorization?.startsWith("Bearer "))
      return reply({ detail: "Missing bearer" }, 401);
    if (options.unauthorized) return reply({ detail: "Expired token" }, 401);
    if (path === "/api/dashboard")
      return reply({
        expectedMonthlyTrips: 60,
        completedFlights: count,
        percentage: Math.floor((count * 100) / 60),
        isLotteryEligible: false,
        currentVehicle: assigned ? { ...vehicle, status: 1 } : null,
      });
    if (path === "/api/vehicles/available")
      return reply(
        assigned
          ? []
          : [
              vehicle,
              { ...vehicle, id: 2, isPersonalExperimental: true },
              { ...vehicle, id: 3 },
            ],
      );
    if (path === "/api/vehicles/mine")
      return assigned
        ? reply({ ...vehicle, status: 1 })
        : route.fulfill({ status: 204 });
    if (path === "/api/vehicles/select") {
      if (options.conflict)
        return reply(
          { detail: "Vehicle was selected by another participant." },
          409,
        );
      assigned = true;
      return route.fulfill({ status: 204 });
    }
    if (path === "/api/flights") {
      count += 1;
      return route.fulfill({ status: 204 });
    }
    if (path === "/api/manager/dashboard")
      return reply({
        totalUsers: 248,
        totalFlights: 342,
        activeAssignments: 37,
        vehiclesByStatus: {
          available: 43,
          inUse: 9,
          maintenance: 3,
          unavailable: 0,
          retired: 1,
        },
        currentUtilizationPercentage: 16.4,
        engagementRatePercentage: 76,
        complianceRatePercentage: 82,
      });
    if (path === "/api/manager/users")
      return reply([
        {
          userId: 1,
          name: "Rivka Levi",
          email: "rivka@example.com",
          totalFlights: 12,
          hasActiveAssignment: true,
          lastFlightCreatedAt: "2026-10-05T10:00:00Z",
        },
        {
          userId: 2,
          name: "David Cohen",
          email: "david@example.com",
          totalFlights: 5,
          hasActiveAssignment: false,
          lastFlightCreatedAt: null,
        },
      ]);
    if (path === "/api/manager/flights/stats")
      return reply({
        totalFlights: 342,
        flightsPerUser: [{ userId: 1, count: 12 }],
        flightsPerVehicle: [{ vehicleId: 1, count: 12 }],
        activityTrend: [24, 46, 34, 58, 47, 69, 82].map((n, i) => ({
          date: `2026-09-${String(i + 1).padStart(2, "0")}T00:00:00Z`,
          count: n,
        })),
      });
    if (path === "/api/manager/flights")
      return reply({
        items: [
          {
            id: 1,
            userId: 1,
            vehicleId: 1,
            date: "2026-10-05T09:00:00Z",
            createdAt: "2026-10-05T10:00:00Z",
          },
        ],
        page: Number(url.searchParams.get("page") || 1),
        pageSize: 20,
        totalCount: 21,
        totalPages: 2,
      });
    if (path === "/api/manager/vehicles")
      return reply(
        [1, 2, 3, 4, 5].map((id, i) => ({
          id,
          status: [
            "Available",
            "InUse",
            "Maintenance",
            "Retired",
            "Unavailable",
          ][i],
          isPersonalExperimental: false,
          createdAt: "2026-10-01T10:00:00Z",
        })),
      );
    if (path.includes("/manager/assignments/"))
      return reply([
        {
          id: 1,
          userId: 1,
          vehicleId: 1,
          startDate: "2026-10-01T10:00:00Z",
          endDate: "2026-11-01T10:00:00Z",
          isActive: path.endsWith("active"),
        },
      ]);
    return reply({ detail: `Unexpected endpoint ${path}` }, 404);
  });
  return writes;
};
test("registration sends the exact DTO, selection uses the real id, flight recording only sends date", async ({
  page,
}) => {
  const writes = await fixture(page);
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Rivka");
  await page.getByLabel("Email address").fill("rivka@example.com");
  await page.getByLabel("Password", { exact: true }).fill("Test@12345");
  await page.getByRole("button", { name: "Create my account" }).click();
  await expect(page).toHaveURL(/dashboard/);
  await expect(
    page.getByRole("heading", { name: "Welcome, Rivka" }),
  ).toBeVisible();
  expect(writes[0].body).toEqual({
    name: "Rivka",
    email: "rivka@example.com",
    password: "Test@12345",
    averageDailyTrips: 2,
    gender: "Female",
  });
  await page.goto("/vehicles");
  await page.getByRole("button", { name: "Select vehicle" }).first().click();
  await page.getByRole("button", { name: "Confirm selection" }).click();
  await expect(page).toHaveURL(/my-vehicle/);
  expect(writes.find((w) => w.path === "/api/vehicles/select")?.body).toEqual({
    vehicleId: 1,
  });
  await page
    .getByRole("link", { name: "Record a flight", exact: true })
    .last()
    .click();
  await page.getByRole("button", { name: "Record completed flight" }).click();
  await expect(
    page.getByText("Flight recorded successfully.", { exact: false }),
  ).toBeVisible();
  const flight = writes.find((w) => w.path === "/api/flights")?.body;
  expect(Object.keys(flight as object)).toEqual(["date"]);
  await expect(
    page.getByRole("button", { name: "Flight recorded", exact: true }),
  ).toBeDisabled();
  await expect(page.getByRole("link", {name: "See your updated progress in your personal dashboard."})).toHaveAttribute("href", "/dashboard");
  await page.getByRole("button", {name: "Sign out", exact: true}).last().click();
  await expect(page).toHaveURL(/login/);
  expect(await page.evaluate(() => sessionStorage.getItem("skyshift.session"))).toBeNull();
});
test("ordinary users cannot access manager routes and unauthorized responses clear the session", async ({
  page,
}) => {
  await auth(page, "User");
  await fixture(page);
  await page.goto("/manager/vehicles");
  await expect(page).toHaveURL(/dashboard/);
  await expect(
    page.getByRole("link", { name: "Manager workspace" }),
  ).toHaveCount(0);
  await page.unrouteAll();
  await fixture(page, { unauthorized: true });
  await page.reload();
  await expect(page).toHaveURL(/login/);
  expect(
    await page.evaluate(() => sessionStorage.getItem("skyshift.session")),
  ).toBeNull();
});
test("conflict remains visible and an active assignment blocks further selection", async ({
  page,
}) => {
  await auth(page, "User");
  await fixture(page, { conflict: true });
  await page.goto("/vehicles");
  await page.getByRole("button", { name: "Select vehicle" }).first().click();
  await page.getByRole("button", { name: "Confirm selection" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "no longer available",
  );
  await page.unrouteAll();
  await fixture(page, { assigned: true });
  await page.goto("/record-flight");
  await expect(page.getByText("Vehicle #1", { exact: true })).toBeVisible();
});
test("manager screens match available capabilities, statuses and server pagination", async ({
  page,
}) => {
  await auth(page, "Manager");
  await fixture(page);
  await page.goto("/manager");
  await expect(
    page.getByRole("heading", { name: "Manager dashboard", exact: true }),
  ).toBeVisible();
  await page.goto("/manager/vehicles");
  await expect(page.getByRole("button", { name: "Change status" })).toHaveCount(
    5,
  );
  await expect(
    page.getByRole("button", { name: "Change status" }).nth(1),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Change status" }).nth(3),
  ).toBeDisabled();
  await page.goto("/manager/flights");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("Page 2 of 2")).toBeVisible();
  await page.goto("/manager/users");
  await page
    .getByRole("textbox", { name: "Search participants by name, email or ID" })
    .fill("Rivka");
  await expect(page.getByText("David Cohen")).toHaveCount(0);
  await page.goto("/manager/assignments");
  await page.getByRole("button", { name: "History", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Completed allocations" }),
  ).toBeVisible();
});
test("desktop and mobile screens render without runtime errors or page overflow", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await auth(page, "Manager");
  await fixture(page, { assigned: true });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 960 });
    for (const route of [
      "/",
      "/dashboard",
      "/vehicles",
      "/my-vehicle",
      "/record-flight",
      "/manager",
      "/manager/vehicles",
      "/manager/users",
      "/manager/flights",
      "/manager/assignments",
    ]) {
      await page.goto(route);
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.getByText("Connecting to your sky…")).toHaveCount(0);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth + 1,
        ),
        `${route} at ${width}px`,
      ).toBe(true);
      if (["/", "/dashboard", "/manager", "/manager/vehicles"].includes(route))
        await page.screenshot({
          path: `test-results/${route === "/" ? "home" : route.slice(1).replaceAll("/", "-")}-${width}.png`,
          fullPage: true,
        });
    }
  }
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Available vehicles", exact: true })
    .click();
  await expect(page).toHaveURL(/vehicles/);
  expect(errors).toEqual([]);
});
test("expired sessions are not restored", async ({ page }) => {
  await page.addInitScript(
    (session) =>
      sessionStorage.setItem("skyshift.session", JSON.stringify(session)),
    { ...response("User"), token: token("User", true) },
  );
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/login/);
});

test("home video keeps language, sound variants, looping and responsive layout", async ({ page }) => {
  await page.goto("/");
  const video = page.locator(".traffic-video");
  await expect(video).toHaveAttribute("src", "/media/skyshift-film/SkyShift-en-sound.mp4");
  // Autoplay is started from code (with a muted fallback), so there is no autoplay attribute;
  // real playback is verified in video-autoplay.spec.ts.
  expect(await video.evaluate((element: HTMLVideoElement) => element.loop && element.controls)).toBe(true);
  await page.getByRole("button", {name:"Use silent version"}).click();
  await expect(video).toHaveAttribute("src", "/media/skyshift-film/SkyShift-en-silent.mp4");
  await page.getByRole("button", {name:"עברית",exact:true}).click();
  await expect(video).toHaveAttribute("src", "/media/skyshift-film/SkyShift-he-silent.mp4");
  await page.getByRole("button", {name:"עם מנגינה"}).click();
  await expect(video).toHaveAttribute("src", "/media/skyshift-film/SkyShift-he-sound.mp4");
  await page.emulateMedia({reducedMotion:"reduce"});
  await expect(page.locator(".little-takeoff")).toHaveCount(0);
  for (const width of [1440,390]) {
    await page.setViewportSize({width,height:900});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth+1)).toBe(true);
  }
});
