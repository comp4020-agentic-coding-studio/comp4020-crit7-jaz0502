import { describe, expect, inject, it } from "vitest";

// The promises this app makes, as checks. They drive the running app over
// HTTP, so they describe what it must do rather than how it's built: enrol by
// course code, never by class number; refuse an enrolment the rules don't
// allow, and say why; and keep what you did across a reload.

const baseUrl = inject("baseUrl");

// Astro checks form POSTs carry a same-origin Origin header (CSRF
// protection); browsers send it automatically, a bare fetch doesn't.
const post = (path: string, body: URLSearchParams, cookie?: string) =>
  fetch(new URL(path, baseUrl), {
    method: "POST",
    headers: { origin: baseUrl, ...(cookie ? { cookie } : {}) },
    body,
    redirect: "manual",
  });

const get = (path: string, cookie?: string) =>
  fetch(new URL(path, baseUrl), { headers: cookie ? { cookie } : {} });

// The suite shares one database and nothing truncates it, so every test signs
// in as a student nobody else in the run will use.
let seq = 0;
const nextUniId = () => `u${process.hrtime.bigint() % 1000000n}${seq++}`;

async function signIn(): Promise<string> {
  const res = await post("/api/student", new URLSearchParams({ uniId: nextUniId(), name: "Spec Student" }));
  expect(res.status).toBe(303);
  const cookie = res.headers.get("set-cookie")?.split(";")[0];
  if (!cookie) throw new Error("signing in set no cookie");
  return cookie;
}

const enrolIn = (code: string, cookie: string) =>
  post("/api/enrol", new URLSearchParams({ courseCode: code, year: "2027", semester: "Second" }), cookie);

const errorFrom = (res: Response) =>
  new URL(res.headers.get("location") ?? "/", baseUrl).searchParams.get("error");

describe("enrolling by course code", () => {
  it("enrols from a course code alone, and the enrolment survives a reload", async () => {
    const cookie = await signIn();

    const res = await enrolIn("COMP2400", cookie);
    expect(res.status).toBe(303);
    expect(errorFrom(res)).toBeNull();

    const page = await (await get("/", cookie)).text();
    expect(page).toContain("Drop COMP2400");
  });

  it("never asks for a class number, and shows the one it looked up", async () => {
    const cookie = await signIn();
    await enrolIn("COMP2400", cookie);

    const page = await (await get("/", cookie)).text();
    // COMP2400's real class number for Second Semester 2027.
    expect(page).toContain("10104");
    // Nothing anywhere on the page collects one.
    expect(page).not.toMatch(/<input[^>]+name="[^"]*class[^"]*"/i);
  });

  it("shows a course's class number on its own page without enrolling", async () => {
    const page = await (await get("/courses/comp3430/")).text();
    expect(page).toContain("10085");
  });
});

describe("rules the enrolment has to satisfy", () => {
  it("refuses a course whose requisites aren't met, and names what's missing", async () => {
    const cookie = await signIn();

    const res = await enrolIn("COMP3430", cookie);
    expect(errorFrom(res)).toBe("missing-requisite");

    const page = await (await get("/?q=COMP3430", cookie)).text();
    expect(page).toContain("COMP2400");
    expect(page).not.toContain("Drop COMP3430");
  });

  it("refuses a course already completed", async () => {
    const cookie = await signIn();
    const res = await enrolIn("COMP1100", cookie);
    expect(errorFrom(res)).toBe("already-completed");
  });

  it("refuses a course incompatible with one already taken", async () => {
    const cookie = await signIn();
    const res = await enrolIn("COMP1730", cookie);
    expect(errorFrom(res)).toBe("incompatible");
  });

  it("refuses the same course twice", async () => {
    const cookie = await signIn();
    expect(errorFrom(await enrolIn("STAT1008", cookie))).toBeNull();
    expect(errorFrom(await enrolIn("STAT1008", cookie))).toBe("already-enrolled");
  });

  it("refuses a course that isn't offered in the enrolling semester", async () => {
    const cookie = await signIn();
    // COMP3630 runs in First Semester only.
    const res = await enrolIn("COMP3630", cookie);
    expect(errorFrom(res)).toBe("unknown-offering");
  });
});

describe("dropping", () => {
  it("removes the enrolment, and it stays gone across a reload", async () => {
    const cookie = await signIn();
    await enrolIn("MATH1013", cookie);
    expect(await (await get("/", cookie)).text()).toContain("Drop MATH1013");

    const res = await post(
      "/api/drop",
      new URLSearchParams({ courseCode: "MATH1013", year: "2027", semester: "Second" }),
      cookie,
    );
    expect(res.status).toBe(303);
    expect(await (await get("/", cookie)).text()).not.toContain("Drop MATH1013");
  });
});

describe("the live stream", () => {
  it("broadcasts an enrolment to an open connection", async () => {
    const cookie = await signIn();

    const stream = await get("/api/events");
    expect(stream.headers.get("content-type")).toContain("text/event-stream");
    const reader = stream.body?.getReader();
    if (!reader) throw new Error("no response body");

    await enrolIn("STAT1008", cookie);

    const decoder = new TextDecoder();
    let received = "";
    while (!received.includes("STAT1008")) {
      const { value, done } = await reader.read();
      if (done) throw new Error("stream ended before the event arrived");
      received += decoder.decode(value, { stream: true });
    }
    await reader.cancel();
  }, 10_000);
});
