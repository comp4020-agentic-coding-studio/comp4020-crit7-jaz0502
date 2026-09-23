import type { APIRoute } from "astro";
import { createStudent } from "../../lib/db";
import { rememberStudent } from "../../lib/session";

// Identify yourself. No password: see the note in src/lib/session.ts for why
// that's a deliberate boundary of this prototype rather than an oversight.
export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const form = await request.formData();
  const uniId = String(form.get("uniId") ?? "")
    .trim()
    .toLowerCase()
    .slice(0, 20);
  const name = String(form.get("name") ?? "")
    .trim()
    .slice(0, 100);

  if (uniId && name) rememberStudent(cookies, createStudent(uniId, name));
  return redirect("/", 303);
};
