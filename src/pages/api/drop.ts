import type { APIRoute } from "astro";
import { drop, findCourse, findOffering, normaliseCode } from "../../lib/db";
import { bus } from "../../lib/events";
import { currentStudent } from "../../lib/session";

// Dropping is addressed the same way enrolling is: by course code and term.
export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const student = currentStudent(cookies);
  if (!student) return redirect("/", 303);

  const form = await request.formData();
  const code = normaliseCode(String(form.get("courseCode") ?? ""));
  const year = Number(form.get("year"));
  const semester = String(form.get("semester") ?? "").trim();

  const course = findCourse(code);
  const offering = course ? findOffering(course.id, year, semester) : undefined;
  if (offering) {
    drop(student.id, offering.id);
    bus.emit("enrolment", { studentId: student.id, code, classNumber: offering.classNumber });
  }
  return redirect("/", 303);
};
