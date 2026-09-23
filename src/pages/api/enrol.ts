import type { APIRoute } from "astro";
import { checkEligibility, enrol, findCourse, findOffering, normaliseCode } from "../../lib/db";
import { bus } from "../../lib/events";
import { currentStudent } from "../../lib/session";

// Enrolment takes a course code, a year and a semester — the three things a
// person already knows. It never takes a class number. Resolving those to the
// offering (and so to its class number) is the database's job, which is the
// whole argument of this app.
//
// Eligibility is checked here even though the page has already rendered the
// same verdict inline and hidden the button: the inline pass is the interface,
// this one is the rule. A form can be replayed, and the record shouldn't
// depend on the page having been honest.
export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const student = currentStudent(cookies);
  if (!student) return redirect("/", 303);

  const form = await request.formData();
  const code = normaliseCode(String(form.get("courseCode") ?? ""));
  const year = Number(form.get("year"));
  const semester = String(form.get("semester") ?? "").trim();
  const query = String(form.get("q") ?? "").trim();

  const back = (error?: string) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (error) {
      params.set("error", error);
      params.set("course", code);
    }
    const search = params.toString();
    return redirect(search ? `/?${search}` : "/", 303);
  };

  const course = findCourse(code);
  if (!course) return back("unknown-course");

  const offering = findOffering(course.id, year, semester);
  if (!offering) return back("unknown-offering");

  const verdict = checkEligibility(student.id, offering.id);
  if (!verdict.ok) return back(verdict.reason);

  enrol(student.id, offering.id);
  bus.emit("enrolment", {
    studentId: student.id,
    code: course.code,
    classNumber: offering.classNumber,
  });
  return back();
};
