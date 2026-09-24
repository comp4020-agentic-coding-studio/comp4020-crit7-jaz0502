import { and, eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { courses, incompatibilities, offerings, requirements } from "./schema";

// The catalogue, transcribed from ANU Programs and Courses on 2026-09-23.
// Codes, titles, unit values, requisite wording, incompatibilities and class
// numbers are all as published there. P&C marks future-year offerings as
// indicative, so these class numbers are real-as-published rather than
// historical fact — but none of them are invented, which matters for an app
// whose whole argument is about class numbers.
//
// Some codes named in published requisite text have no P&C page at all
// (COMP1030, COMP1040) and some are retired (COMP2420, COMP2600). They aren't
// in the catalogue, and no rule here points at them.
//
// Where a real rule names a course this catalogue doesn't carry, or turns on a
// unit threshold this model can't express, the course's requisiteText quotes
// the rule in full and says which part is actually checked. Being explicit
// about that beats silently enforcing half a rule — half of a disjunction is
// stricter than the real thing, which is why COMP2620 enforces nothing.

type Seed = {
  code: string;
  title: string;
  description: string;
  requisiteText: string;
  /** CNF: satisfy one code from each inner array. */
  requires?: string[][];
  incompatibleWith?: string[];
  offerings: { year: number; semester: string; classNumber: string }[];
};

const CATALOGUE: Seed[] = [
  {
    code: "COMP1100",
    title: "Programming as Problem Solving",
    description:
      "Computational problem solving through functional programming — types, recursion, algebraic data types, pattern matching and higher-order functions — with introductory data structures and asymptotic analysis.",
    requisiteText: "No prerequisites. Assumed knowledge: mathematics to ACT Mathematical Methods or NSW Mathematics Advanced.",
    incompatibleWith: ["COMP1130", "COMP1730"],
    offerings: [
      { year: 2027, semester: "First", classNumber: "5099" },
      { year: 2027, semester: "Second", classNumber: "10101" },
      { year: 2028, semester: "First", classNumber: "6679" },
      { year: 2028, semester: "Second", classNumber: "11051" },
    ],
  },
  {
    code: "COMP1130",
    title: "Programming as Problem Solving (Advanced)",
    description:
      "COMP1100's material in greater depth with extra contact hours, adding program semantics, program proof and the implementation of language features.",
    requisiteText:
      "No prerequisites. Assumed knowledge: ACT Specialist Mathematics Major/Minor or NSW Mathematics Extension 1. No prior programming required.",
    incompatibleWith: ["COMP1100", "COMP1730"],
    offerings: [
      { year: 2027, semester: "First", classNumber: "5100" },
      { year: 2028, semester: "First", classNumber: "6503" },
    ],
  },
  {
    code: "COMP1110",
    title: "Structured Programming",
    description:
      "Imperative and object-oriented programming with lists, trees, hash tables and graphs in an industrial-strength language, covering design, testing, debugging and introductory complexity.",
    requisiteText: "COMP1100 or COMP1130 or COMP1730.",
    requires: [["COMP1100", "COMP1130", "COMP1730"]],
    incompatibleWith: ["COMP1140", "COMP1730"],
    offerings: [
      { year: 2027, semester: "First", classNumber: "5110" },
      { year: 2027, semester: "Second", classNumber: "10113" },
      { year: 2028, semester: "First", classNumber: "6680" },
      { year: 2028, semester: "Second", classNumber: "11052" },
    ],
  },
  {
    code: "COMP1140",
    title: "Structured Programming (Advanced)",
    description:
      "COMP1110's imperative and object-oriented programming and data structures treated in greater depth, with additional content and assessment.",
    requisiteText: "COMP1130.",
    requires: [["COMP1130"]],
    incompatibleWith: ["COMP1110", "COMP1730"],
    offerings: [
      { year: 2027, semester: "Second", classNumber: "10115" },
      { year: 2028, semester: "Second", classNumber: "10869" },
    ],
  },
  {
    code: "COMP1730",
    title: "Programming for Scientists",
    description:
      "A stand-alone introduction to programming for science and engineering — data analysis, visualisation and image processing — taught partly through working with generative AI, with emphasis on testing and decomposition.",
    requisiteText: "No prerequisites. Assumed knowledge: mathematics to ACT Mathematical Methods or NSW Mathematics Advanced.",
    incompatibleWith: ["COMP1100", "COMP1130", "COMP1110", "COMP1140"],
    offerings: [
      { year: 2027, semester: "First", classNumber: "5398" },
      { year: 2027, semester: "Second", classNumber: "10102" },
      { year: 2028, semester: "First", classNumber: "6709" },
      { year: 2028, semester: "Second", classNumber: "10861" },
    ],
  },
  {
    code: "COMP2400",
    title: "Relational Databases",
    description:
      "Designing and using relational databases: the relational model, SQL, entity-relationship modelling, functional dependencies, normalisation, and query processing and optimisation.",
    requisiteText: "COMP1100 or COMP1130 or INFS1001 or COMP1730.",
    requires: [["COMP1100", "COMP1130", "COMP1730", "INFS1001"]],
    offerings: [
      { year: 2027, semester: "First", classNumber: "5101" },
      { year: 2027, semester: "Second", classNumber: "10104" },
      { year: 2028, semester: "First", classNumber: "6683" },
      { year: 2028, semester: "Second", classNumber: "11054" },
    ],
  },
  {
    code: "COMP3430",
    title: "Data Wrangling",
    description:
      "Working with messy real-world data: cleaning, parsing, standardising, linking records across sources, and assessing the quality of the result.",
    requisiteText:
      "6 units from COMP1030, COMP1100, COMP1130 or COMP1730; and 6 units from COMP1040, COMP1110 or COMP1140; and COMP2400. (COMP1030 and COMP1040 have no current P&C page and are omitted here.)",
    requires: [["COMP1100", "COMP1130", "COMP1730"], ["COMP1110", "COMP1140"], ["COMP2400"]],
    offerings: [
      { year: 2027, semester: "Second", classNumber: "10085" },
      { year: 2028, semester: "Second", classNumber: "10846" },
    ],
  },
  {
    code: "COMP3600",
    title: "Algorithms",
    description:
      "Designing and analysing algorithms and data structures for fundamental problems such as sorting and searching, with performance measures and analysis techniques.",
    requisiteText:
      "24 units of COMP coded courses, and 6 units of MATH coded courses or COMP1600. Unit-threshold rules like this aren't checked by this prototype.",
    offerings: [
      { year: 2027, semester: "Second", classNumber: "10080" },
      { year: 2028, semester: "Second", classNumber: "11055" },
    ],
  },
  {
    code: "COMP3630",
    title: "Theory of Computation",
    description:
      "Formal languages and automata, computability and the halting problem, and the complexity classes P, NP, PSPACE and NP-completeness.",
    requisiteText:
      "24 units of COMP coded courses, and 6 units of MATH coded courses or COMP1600. Unit-threshold rules like this aren't checked by this prototype.",
    offerings: [
      { year: 2027, semester: "First", classNumber: "5111" },
      { year: 2028, semester: "First", classNumber: "6509" },
    ],
  },
  {
    code: "MATH1005",
    title: "Discrete Mathematical Models",
    description:
      "Discrete mathematics for modelling: logic and set theory, combinatorics, probability, induction and recurrence, graph theory, matrices and Markov chains.",
    requisiteText: "No formal course prerequisite. Secondary school prerequisite: ACT Mathematical Methods or NSW Mathematics Advanced.",
    offerings: [
      { year: 2027, semester: "First", classNumber: "5412" },
      { year: 2028, semester: "First", classNumber: "6689" },
    ],
  },
  {
    code: "MATH1013",
    title: "Mathematics and Applications 1",
    description:
      "Single-variable calculus through to the Fundamental Theorem and techniques of integration, plus introductory linear algebra and complex numbers.",
    requisiteText:
      "No formal prerequisite; ACT Specialist Mathematics Major-Minor or NSW Mathematics Extension 1 recommended. Incompatible with MATH1113 and MATH1115, which are outside this prototype's catalogue.",
    offerings: [
      { year: 2027, semester: "First", classNumber: "5413" },
      { year: 2027, semester: "Second", classNumber: "10390" },
      { year: 2028, semester: "First", classNumber: "6694" },
      { year: 2028, semester: "Second", classNumber: "11059" },
    ],
  },
  {
    code: "STAT1008",
    title: "Quantitative Research Methods",
    description:
      "Gathering, describing and analysing quantitative information: sampling distributions, estimation, hypothesis testing and linear regression.",
    requisiteText: "No prerequisites.",
    offerings: [
      { year: 2027, semester: "First", classNumber: "4368" },
      { year: 2027, semester: "Second", classNumber: "9373" },
      { year: 2028, semester: "First", classNumber: "5884" },
      { year: 2028, semester: "Second", classNumber: "10267" },
    ],
  },

  // Transcribed in a second pass, to deepen the COMP chain. COMP2120 was
  // looked up and left out: its requisite is COMP2100, which isn't in this
  // catalogue, and it's satisfied by concurrent enrolment ("or be currently
  // studying"), which this model has no way to express.
  {
    code: "INFS1001",
    title: "Business Information Systems",
    description:
      "A grounding in business information systems as the bridge between management and operation, spanning accounting, finance, sales and marketing, systems design and executive strategy.",
    requisiteText: "No prerequisites. Assumed knowledge: some familiarity with basic computer applications.",
    offerings: [
      { year: 2027, semester: "First", classNumber: "4535" },
      { year: 2027, semester: "Second", classNumber: "9552" },
      { year: 2028, semester: "First", classNumber: "6037" },
      { year: 2028, semester: "Second", classNumber: "10425" },
    ],
  },
  {
    code: "COMP1600",
    title: "Foundations of Computing",
    description:
      "The formal notations used to describe computation and argue rigorously about programs: predicate calculus and natural deduction, inductive data types with structural induction, and specification languages for verification.",
    requisiteText:
      "6 units of MATH courses, and COMP1100 or COMP1130. Only the COMP1100/COMP1130 half is checked here — unit-threshold rules aren't modelled, so this check is more permissive than the real one.",
    requires: [["COMP1100", "COMP1130"]],
    offerings: [
      { year: 2027, semester: "Second", classNumber: "10088" },
      { year: 2028, semester: "Second", classNumber: "10849" },
    ],
  },
  {
    code: "COMP2300",
    title: "Computer Architecture",
    description:
      "Digital circuit design and computer architecture built bottom-up — combinational and sequential logic, ALUs and RAM, instruction sets and assembly, interrupts, pipelining and speculation.",
    requisiteText:
      "(COMP1100 or COMP1130 or COMP1730) and 6 units of 1000-level MATH courses. Only the named-course half is checked here — unit-threshold rules aren't modelled, so this check is more permissive than the real one.",
    requires: [["COMP1100", "COMP1130", "COMP1730"]],
    offerings: [
      { year: 2027, semester: "First", classNumber: "5055" },
      { year: 2028, semester: "First", classNumber: "6682" },
    ],
  },
  {
    code: "COMP2310",
    title: "Systems, Networks, and Concurrency",
    description:
      "Concurrent, parallel and distributed programming, together with operating-system concerns (scheduling, memory management, security) and networking from message passing to dependable protocols.",
    requisiteText:
      "COMP1110 or COMP1140, and COMP2300 or ENGN2219. ENGN2219 is outside this prototype's catalogue, so that alternative isn't offered here — this check is stricter than the real rule.",
    requires: [["COMP1110", "COMP1140"], ["COMP2300"]],
    offerings: [
      { year: 2027, semester: "Second", classNumber: "10116" },
      { year: 2028, semester: "Second", classNumber: "10870" },
    ],
  },
  {
    code: "COMP2620",
    title: "Logic",
    description:
      "Propositional and predicate logic as the underlying mathematics of computer science: reasoning within them, reasoning about their limits, and applying them to natural-language and computing problems.",
    requisiteText:
      "6 units of MATH courses, or COMP1600. Nothing is checked here: the rule is a choice between a unit threshold and a course, and enforcing only the COMP1600 half would wrongly refuse anyone who qualified through MATH.",
    offerings: [
      { year: 2027, semester: "First", classNumber: "5091" },
      { year: 2028, semester: "First", classNumber: "6496" },
    ],
  },
];

/**
 * Bring the stored catalogue into line with the list above. Runs when db.ts is
 * first imported — in practice the first request after a restart, the same
 * point the migrations run — so a fresh Fly volume comes up populated and an
 * existing one picks up corrections and new courses on the next deploy.
 *
 * It reconciles rather than seeds-once: the catalogue is reference data
 * derived from this file, so the file is the authority every time. Only the
 * catalogue is touched — students and their enrolments are the app's real
 * state and are never written here. Offerings are added and updated but never
 * removed, because an enrolment may point at one.
 *
 * Takes the database rather than importing it, so this stays out of db.ts's
 * import cycle.
 */
export function syncCatalogue(db: BetterSQLite3Database): void {
  const ids = new Map<string, number>();

  for (const entry of CATALOGUE) {
    const fields = {
      title: entry.title,
      description: entry.description,
      requisiteText: entry.requisiteText,
    };
    const existing = db.select().from(courses).where(eq(courses.code, entry.code)).get();

    if (existing) {
      db.update(courses).set(fields).where(eq(courses.id, existing.id)).run();
      ids.set(entry.code, existing.id);
    } else {
      const row = db.insert(courses).values({ code: entry.code, ...fields }).returning().get();
      ids.set(entry.code, row.id);
    }
  }

  for (const entry of CATALOGUE) {
    const courseId = ids.get(entry.code);
    if (courseId === undefined) continue;

    for (const offering of entry.offerings) {
      const existing = db
        .select()
        .from(offerings)
        .where(
          and(
            eq(offerings.courseId, courseId),
            eq(offerings.year, offering.year),
            eq(offerings.semester, offering.semester),
          ),
        )
        .get();

      if (existing) {
        db.update(offerings)
          .set({ classNumber: offering.classNumber })
          .where(eq(offerings.id, existing.id))
          .run();
      } else {
        db.insert(offerings).values({ courseId, ...offering }).run();
      }
    }
  }

  // Rules are wholly derived from this file and nothing references them, so
  // they're rebuilt outright — that way a corrected rule replaces the old one
  // instead of accumulating alongside it.
  db.delete(requirements).run();
  db.delete(incompatibilities).run();

  for (const entry of CATALOGUE) {
    const courseId = ids.get(entry.code);
    if (courseId === undefined) continue;

    entry.requires?.forEach((group, index) => {
      for (const code of group) {
        const requiresCourseId = ids.get(code);
        if (requiresCourseId !== undefined) {
          db.insert(requirements).values({ courseId, requiresCourseId, groupNo: index + 1 }).run();
        }
      }
    });

    // Incompatibility runs both ways, so each pair is stored in both
    // directions and the eligibility check only ever looks one way.
    for (const code of entry.incompatibleWith ?? []) {
      const withCourseId = ids.get(code);
      if (withCourseId !== undefined) {
        db.insert(incompatibilities).values({ courseId, withCourseId }).run();
      }
    }
  }
}
