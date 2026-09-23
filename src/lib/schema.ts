import { sql } from "drizzle-orm";
import { int, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

// The schema is the ground truth for the database. To change it: edit here,
// run `pnpm db:generate` to turn the diff into a migration under drizzle/,
// and commit both — the migration applies automatically when the server
// boots (see src/lib/db.ts), locally and deployed. Never edit the database
// by hand: state on the deployed volume outlives every deploy, and the
// migration trail is what keeps old state and new code compatible.

export const students = sqliteTable("students", {
  id: int().primaryKey({ autoIncrement: true }),
  uniId: text("uni_id").notNull().unique(),
  name: text().notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const courses = sqliteTable("courses", {
  id: int().primaryKey({ autoIncrement: true }),
  code: text().notNull().unique(),
  title: text().notNull(),
  units: int().notNull().default(6),
  description: text().notNull().default(""),
  // The requisite rule as Programs and Courses words it. The `requirements`
  // table below encodes the part this app can actually check; rules like "24
  // units of COMP coded courses" aren't expressible as a set of alternative
  // courses, so the page shows this text next to the checked part rather than
  // pretending the whole rule is enforced.
  requisiteText: text("requisite_text").notNull().default(""),
});

// An offering is a course in one semester — the thing you actually enrol in,
// and the thing ANU identifies by a class number. Here the class number is
// output, never input: nothing in the app asks you to type one.
export const offerings = sqliteTable(
  "offerings",
  {
    id: int().primaryKey({ autoIncrement: true }),
    courseId: int("course_id")
      .notNull()
      .references(() => courses.id),
    year: int().notNull(),
    semester: text().notNull(),
    classNumber: text("class_number").notNull(),
    mode: text().notNull().default("In Person"),
    lastDayToEnrol: text("last_day_to_enrol"),
    censusDate: text("census_date"),
  },
  (t) => [unique().on(t.courseId, t.year, t.semester)],
);

// Requisites in conjunctive normal form: rows sharing a groupNo are
// alternatives (satisfy any one), and every group must be satisfied. It's the
// shape ANU's rules already take — COMP3430 wants one of the COMP1xxx
// programming courses, AND one of the COMP1xxx problem-solving courses, AND
// COMP2400 — and one integer column buys it without a expression parser.
export const requirements = sqliteTable(
  "requirements",
  {
    id: int().primaryKey({ autoIncrement: true }),
    courseId: int("course_id")
      .notNull()
      .references(() => courses.id),
    requiresCourseId: int("requires_course_id")
      .notNull()
      .references(() => courses.id),
    groupNo: int("group_no").notNull().default(1),
  },
  (t) => [unique().on(t.courseId, t.requiresCourseId)],
);

export const incompatibilities = sqliteTable(
  "incompatibilities",
  {
    id: int().primaryKey({ autoIncrement: true }),
    courseId: int("course_id")
      .notNull()
      .references(() => courses.id),
    withCourseId: int("with_course_id")
      .notNull()
      .references(() => courses.id),
  },
  (t) => [unique().on(t.courseId, t.withCourseId)],
);

// Study history and current enrolment are the same relation at different
// points in time, so they're one table with a status rather than two tables
// that mean almost the same thing. "Have you done the prerequisite?" and "are
// you already in this?" then fall out of the same join.
export const enrolments = sqliteTable(
  "enrolments",
  {
    id: int().primaryKey({ autoIncrement: true }),
    studentId: int("student_id")
      .notNull()
      .references(() => students.id),
    offeringId: int("offering_id")
      .notNull()
      .references(() => offerings.id),
    status: text().notNull().default("enrolled"),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => [unique().on(t.studentId, t.offeringId)],
);

export type Student = typeof students.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type Offering = typeof offerings.$inferSelect;
export type Requirement = typeof requirements.$inferSelect;
export type Enrolment = typeof enrolments.$inferSelect;
