import type { APIRoute } from "astro";
import { drop, findCourse, findOffering, normaliseCode } from "../../lib/db";
import { bus } from "../../lib/events";
import { currentStudent } from "../../lib/session";

// You can drop from either page that lists your enrolment, and should land
// back on the one you were reading. The form says which, but only these two
// answers are accepted — redirecting to whatever a form field asks for is how
// a form becomes an open redirect.
const RETURN_TO = new Set(["/", "/me/"]);

// Dropping is addressed the same way enrolling is: by course code and term.
export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const student = currentStudent(cookies);
  if (!student) return redirect("/", 303);

  const form = await request.formData();
  const code = normaliseCode(String(form.get("courseCode") ?? ""));
  const year = Number(form.get("year"));
  const semester = String(form.get("semester") ?? "").trim();
  const asked = String(form.get("returnTo") ?? "");
  const back = RETURN_TO.has(asked) ? asked : "/";

  const course = findCourse(code);
  const offering = course ? findOffering(course.id, year, semester) : undefined;
  if (offering) {
    drop(student.id, offering.id);
    bus.emit("enrolment", { studentId: student.id, code, classNumber: offering.classNumber });
  }
  return redirect(back, 303);
};
