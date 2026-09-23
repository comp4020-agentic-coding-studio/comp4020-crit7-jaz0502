import type { AstroCookies } from "astro";
import { getStudent, type Student } from "./db";

// Who you are, for an app with no accounts: a student id in a cookie. The
// cookie is unsigned, so anyone who edits it becomes another student — fine
// here because there are no passwords, no marks and no personal data behind
// it, and a login screen is not the part of enrolment this prototype is
// arguing about. A real system would sign this.
const COOKIE = "student";

export function currentStudent(cookies: AstroCookies): Student | undefined {
  const raw = cookies.get(COOKIE)?.value;
  if (!raw) return undefined;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? getStudent(id) : undefined;
}

export function rememberStudent(cookies: AstroCookies, student: Student): void {
  cookies.set(COOKIE, String(student.id), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 180,
  });
}

export function forgetStudent(cookies: AstroCookies): void {
  cookies.delete(COOKIE, { path: "/" });
}
