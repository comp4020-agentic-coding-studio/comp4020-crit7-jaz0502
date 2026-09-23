import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { courses, incompatibilities, offerings, requirements } from "./schema";

// The catalogue, transcribed from ANU Programs and Courses on 2026-09-23.
// Codes, titles, unit values, requisite wording, incompatibilities and class
// numbers are all as published there. P&C marks future-year offerings as
// indicative, so these class numbers are real-as-published rather than
// historical fact — but none of them are invented, which matters for an app
// whose whole argument is about class numbers.
//
// Four codes that appear in COMP3430's published requisite text (COMP1030,
// COMP1040) and two retired codes (COMP2420, COMP2600) have no P&C page, so
// they are not in the catalogue and not in any rule below.

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
    requisiteText: "COMP1100 or COMP1130 or INFS1001 or COMP1730. (INFS1001 is outside this prototype's catalogue.)",
    requires: [["COMP1100", "COMP1130", "COMP1730"]],
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
];

/**
 * Populate an empty catalogue. Runs at boot so a fresh Fly volume comes up
 * with courses in it; does nothing if any course already exists, so a
 * redeploy never disturbs data on the volume. Takes the database rather than
 * importing it, so seeding stays out of db.ts's import cycle.
 */
export function seedCatalogue(db: BetterSQLite3Database): void {
  if (db.select().from(courses).limit(1).all().length > 0) return;

  const ids = new Map<string, number>();
  for (const entry of CATALOGUE) {
    const row = db
      .insert(courses)
      .values({
        code: entry.code,
        title: entry.title,
        description: entry.description,
        requisiteText: entry.requisiteText,
      })
      .returning()
      .get();
    ids.set(entry.code, row.id);
  }

  for (const entry of CATALOGUE) {
    const courseId = ids.get(entry.code);
    if (courseId === undefined) continue;

    for (const offering of entry.offerings) {
      db.insert(offerings).values({ courseId, ...offering }).run();
    }

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
