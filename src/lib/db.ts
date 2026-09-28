import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";
import { and, eq, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { syncCatalogue } from "./seed";
import {
  type Course,
  courses,
  type Enrolment,
  enrolments,
  incompatibilities,
  type Offering,
  offerings,
  requirements,
  type Student,
  students,
} from "./schema";

// One SQLite file is the app's whole persistent state. In production
// fly.toml points DATABASE_PATH at the machine's volume (/data), which is
// how state survives a reload and a redeploy; locally it defaults to an
// untracked file in .data/.
const path = process.env.DATABASE_PATH ?? "./.data/app.db";
mkdirSync(dirname(path), { recursive: true });

const client = new Database(path);
client.pragma("journal_mode = WAL");
// better-sqlite3 leaves foreign keys off by default, which would let the
// schema's references() clauses pass as decoration. The relations here are
// load-bearing — eligibility is computed by joining through them — so the
// database enforces them.
client.pragma("foreign_keys = ON");

export const db = drizzle(client);

// Migrations run at boot, on whatever machine holds the volume — the
// recommended shape for SQLite on Fly, where there's no separate machine to
// run them from. The flow: edit src/lib/schema.ts, `pnpm db:generate`,
// commit the migration it writes to drizzle/.
migrate(db, { migrationsFolder: "./drizzle" });
syncCatalogue(db);

export type { Course, Enrolment, Offering, Student };

// The term the app enrols you into. Real ANU enrolment opens for the next
// teaching period; everything before it is study history.
export const TERM = { year: 2027, semester: "Second" } as const;

// ANU's standard full-time load. Enforced by units rather than a course
// count, since the catalogue now has 12-unit courses alongside 6-unit ones —
// "4 courses" only equals "24 units" when every course happens to be 6.
export const SEMESTER_UNIT_CAP = 24;

export const termLabel = (year: number, semester: string) =>
  `${semester} Semester ${year}`;

export const normaliseCode = (code: string) =>
  code.trim().toUpperCase().replace(/\s+/g, "");

// --- students ---------------------------------------------------------------

export function findStudent(uniId: string): Student | undefined {
  return db.select().from(students).where(eq(students.uniId, uniId)).get();
}

export function getStudent(id: number): Student | undefined {
  return db.select().from(students).where(eq(students.id, id)).get();
}

// A new student arrives partway through a degree, so the requisite rules have
// something to check on the first page load. A real system reads your study
// history from your record; this prototype has nowhere to read one from, so
// everyone starts at the same point. /me/ says so plainly.
const STARTING_HISTORY = [
  { code: "COMP1100", year: 2027, semester: "First" },
  { code: "COMP1110", year: 2027, semester: "First" },
];

export function createStudent(uniId: string, name: string): Student {
  const existing = findStudent(uniId);
  if (existing) return existing;

  const student = db.insert(students).values({ uniId, name }).returning().get();
  for (const past of STARTING_HISTORY) {
    const course = findCourse(past.code);
    const offering = course && findOffering(course.id, past.year, past.semester);
    if (offering) enrol(student.id, offering.id, "completed");
  }
  return student;
}

// --- catalogue --------------------------------------------------------------

export type CatalogueRow = { course: Course; offering: Offering | undefined };

/** Courses matching a code or title fragment, with their offering in one term. */
export function searchCatalogue(query: string, year = TERM.year, semester: string = TERM.semester): CatalogueRow[] {
  const q = `%${query.trim()}%`;
  const rows = db
    .select({ course: courses, offering: offerings })
    .from(courses)
    .leftJoin(
      offerings,
      and(eq(offerings.courseId, courses.id), eq(offerings.year, year), eq(offerings.semester, semester)),
    )
    .where(query.trim() ? or(like(courses.code, q), like(courses.title, q)) : undefined)
    .orderBy(courses.code)
    .all();
  return rows.map((r) => ({ course: r.course, offering: r.offering ?? undefined }));
}

export function findCourse(code: string): Course | undefined {
  return db.select().from(courses).where(eq(courses.code, normaliseCode(code))).get();
}

export function listOfferings(courseId: number): Offering[] {
  return db
    .select()
    .from(offerings)
    .where(eq(offerings.courseId, courseId))
    .orderBy(offerings.year, offerings.semester)
    .all();
}

export function findOffering(courseId: number, year: number, semester: string): Offering | undefined {
  return db
    .select()
    .from(offerings)
    .where(and(eq(offerings.courseId, courseId), eq(offerings.year, year), eq(offerings.semester, semester)))
    .get();
}

// --- requisites -------------------------------------------------------------

export type RequirementGroup = { groupNo: number; options: { id: number; code: string; title: string }[] };

/** Requisites in CNF: satisfy one option from every group. */
export function requirementGroups(courseId: number): RequirementGroup[] {
  const rows = db
    .select({ groupNo: requirements.groupNo, id: courses.id, code: courses.code, title: courses.title })
    .from(requirements)
    .innerJoin(courses, eq(requirements.requiresCourseId, courses.id))
    .where(eq(requirements.courseId, courseId))
    .orderBy(requirements.groupNo, courses.code)
    .all();

  const groups = new Map<number, RequirementGroup>();
  for (const row of rows) {
    const group = groups.get(row.groupNo) ?? { groupNo: row.groupNo, options: [] };
    group.options.push({ id: row.id, code: row.code, title: row.title });
    groups.set(row.groupNo, group);
  }
  return [...groups.values()];
}

export function incompatibleWith(courseId: number): { id: number; code: string }[] {
  return db
    .select({ id: courses.id, code: courses.code })
    .from(incompatibilities)
    .innerJoin(courses, eq(incompatibilities.withCourseId, courses.id))
    .where(eq(incompatibilities.courseId, courseId))
    .orderBy(courses.code)
    .all();
}

// --- a student's record -----------------------------------------------------

export type EnrolmentView = {
  code: string;
  title: string;
  units: number;
  status: string;
  year: number;
  semester: string;
  classNumber: string;
  mode: string;
};

export function listEnrolments(studentId: number): EnrolmentView[] {
  return db
    .select({
      code: courses.code,
      title: courses.title,
      units: courses.units,
      status: enrolments.status,
      year: offerings.year,
      semester: offerings.semester,
      classNumber: offerings.classNumber,
      mode: offerings.mode,
    })
    .from(enrolments)
    .innerJoin(offerings, eq(enrolments.offeringId, offerings.id))
    .innerJoin(courses, eq(offerings.courseId, courses.id))
    .where(eq(enrolments.studentId, studentId))
    .orderBy(offerings.year, offerings.semester, courses.code)
    .all();
}

/** courseId -> 'completed' | 'enrolled', completed winning if both exist. */
function courseStatuses(studentId: number): Map<number, string> {
  const rows = db
    .select({ courseId: offerings.courseId, status: enrolments.status })
    .from(enrolments)
    .innerJoin(offerings, eq(enrolments.offeringId, offerings.id))
    .where(eq(enrolments.studentId, studentId))
    .all();

  const held = new Map<number, string>();
  for (const row of rows) {
    if (row.status === "completed" || !held.has(row.courseId)) held.set(row.courseId, row.status);
  }
  return held;
}

// --- eligibility ------------------------------------------------------------

export type Eligibility = { ok: true } | { ok: false; reason: string; detail: string };

const list = (codes: string[]) =>
  codes.length <= 1 ? (codes[0] ?? "") : `${codes.slice(0, -1).join(", ")} or ${codes[codes.length - 1]}`;

function enrolledUnits(studentId: number, year: number, semester: string): number {
  const rows = db
    .select({ units: courses.units })
    .from(enrolments)
    .innerJoin(offerings, eq(enrolments.offeringId, offerings.id))
    .innerJoin(courses, eq(offerings.courseId, courses.id))
    .where(
      and(
        eq(enrolments.studentId, studentId),
        eq(enrolments.status, "enrolled"),
        eq(offerings.year, year),
        eq(offerings.semester, semester),
      ),
    )
    .all();
  return rows.reduce((sum, row) => sum + row.units, 0);
}

/**
 * Whether a student may take an offering, and if not, why — in words a person
 * can act on. Ordered so the first failure is the most useful one to report.
 */
export function checkEligibility(studentId: number, offeringId: number): Eligibility {
  const target = db
    .select({ offering: offerings, course: courses })
    .from(offerings)
    .innerJoin(courses, eq(offerings.courseId, courses.id))
    .where(eq(offerings.id, offeringId))
    .get();
  if (!target) return { ok: false, reason: "unknown-offering", detail: "That offering doesn't exist." };

  const { course } = target;
  const held = courseStatuses(studentId);

  const status = held.get(course.id);
  if (status === "enrolled") {
    return { ok: false, reason: "already-enrolled", detail: `You're already enrolled in ${course.code}.` };
  }
  if (status === "completed") {
    return { ok: false, reason: "already-completed", detail: `You completed ${course.code} in an earlier semester.` };
  }

  const clashing = incompatibleWith(course.id)
    .filter((other) => held.has(other.id))
    .map((other) => other.code);
  if (clashing.length > 0) {
    return {
      ok: false,
      reason: "incompatible",
      detail: `${course.code} is incompatible with ${list(clashing)}, which you've already taken.`,
    };
  }

  for (const group of requirementGroups(course.id)) {
    const met = group.options.some((option) => held.get(option.id) === "completed");
    if (!met) {
      const codes = group.options.map((o) => o.code);
      return {
        ok: false,
        reason: "missing-requisite",
        detail: `${course.code} requires ${list(codes)}, which you haven't completed.`,
      };
    }
  }

  // Checked last: a course you're otherwise entitled to still isn't yours to
  // add once your load for the term is full, but that's a fact about your
  // whole semester, not this course — the more specific reasons above take
  // priority when more than one applies.
  const current = enrolledUnits(studentId, target.offering.year, target.offering.semester);
  if (current + course.units > SEMESTER_UNIT_CAP) {
    return {
      ok: false,
      reason: "semester-full",
      detail: `Enrolling in ${course.code} would take you to ${current + course.units} units this semester; the cap is ${SEMESTER_UNIT_CAP}.`,
    };
  }

  return { ok: true };
}

// --- enrolling --------------------------------------------------------------

export function enrol(studentId: number, offeringId: number, status = "enrolled"): Enrolment {
  return db.insert(enrolments).values({ studentId, offeringId, status }).returning().get();
}

export function drop(studentId: number, offeringId: number): void {
  db.delete(enrolments)
    .where(and(eq(enrolments.studentId, studentId), eq(enrolments.offeringId, offeringId)))
    .run();
}
