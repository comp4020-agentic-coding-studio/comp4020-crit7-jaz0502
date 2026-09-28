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
  /** Most courses are 6 units; a handful of projects/internships aren't. */
  units?: number;
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

  // Discovered in a third pass: the full undergraduate COMP catalogue
  // (1000-4000 level), not just the deep single chain from before.
  {
    code: "COMP1720",
    title: "Art and Interaction Computing",
    description:
      "Coding and design fundamentals for building an original interactive artwork in a high-level language.",
    requisiteText:
      "No prerequisites.",
    offerings: [],
  },
  {
    code: "COMP2100",
    title: "Software Construction",
    description:
      "Core object-oriented programming for building medium-scale software projects, beyond a single-course exercise.",
    requisiteText:
      "COMP1110 or COMP1140, and 6 units of 1000-level MATH courses (BSc/ASCAD students also need COMP1600). Only the named half is checked here — the MATH threshold and program-specific extra aren't modelled, so this check is more permissive than the real one.",
    requires: [["COMP1110", "COMP1140"]],
    offerings: [
      { year: 2027, semester: "First", classNumber: "5103" },
      { year: 2027, semester: "Second", classNumber: "10106" },
      { year: 2028, semester: "First", classNumber: "6681" },
      { year: 2028, semester: "Second", classNumber: "11053" },
    ],
  },
  {
    code: "COMP2120",
    title: "Software Engineering",
    description:
      "Real-world software development as a socio-technical activity: process models, requirements, design and user experience, for non-trivial systems.",
    requisiteText:
      "Must have completed or be currently studying COMP2100. Concurrent enrolment isn't modelled here — only \"completed\" counts — so this check is stricter than the real rule for anyone taking both at once.",
    requires: [["COMP2100"]],
    offerings: [
      { year: 2027, semester: "Second", classNumber: "10108" },
      { year: 2028, semester: "Second", classNumber: "10863" },
    ],
  },
  {
    code: "COMP2550",
    title: "Computing R&D Methods",
    description:
      "Introduction to research methodology for Advanced Computing (R&D) honours students.",
    requisiteText:
      "Enrolled in the Bachelor of Advanced Computing (R&D) (Honours), and completed COMP1110 or COMP1140. Only the named half is checked here — this model has no notion of which degree you're in.",
    requires: [["COMP1110", "COMP1140"]],
    incompatibleWith: ["COMP4450"],
    offerings: [
      { year: 2027, semester: "First", classNumber: "5068" },
      { year: 2028, semester: "First", classNumber: "6473" },
    ],
  },
  {
    code: "COMP2610",
    title: "Information Theory",
    description:
      "Fundamentals of information theory: probability, entropy and coding.",
    requisiteText:
      "No formal prerequisite stated.",
    offerings: [
      { year: 2027, semester: "Second", classNumber: "10381" },
    ],
  },
  {
    code: "COMP2700",
    title: "Cyber Security Foundations",
    description:
      "Foundational cyber security principles: secure design, least privilege and isolation.",
    requisiteText:
      "(COMP1100 or COMP1130) and (COMP1600 or 6 units of MATH courses). Only the first half is checked here: the second is a choice between a named course and a unit threshold, and enforcing only the named course would wrongly refuse anyone who qualified through the MATH route.",
    requires: [["COMP1100", "COMP1130"]],
    offerings: [
      { year: 2027, semester: "First", classNumber: "5085" },
      { year: 2028, semester: "First", classNumber: "6490" },
    ],
  },
  {
    code: "COMP2710",
    title: "Special Topics in Computer Science",
    description:
      "A senior small-class course on a topic outside the regular curriculum; content and prerequisites vary by offering.",
    requisiteText:
      "Prerequisites vary by topic, plus a permission code. Nothing generic to check here.",
    offerings: [],
  },
  {
    code: "COMP3242",
    title: "Deep Learning",
    description:
      "Theory and practice of deep learning: multi-layer perceptrons, CNNs, RNNs, transformers and generative models.",
    requisiteText:
      "6 units of (COMP3670 or MATH1013, MATH1014, MATH1115 or MATH1116), and COMP1110 or COMP1140. MATH1014, MATH1115 and MATH1116 aren't in this catalogue, so this check is stricter than the real rule for anyone who satisfied the first group through one of them.",
    requires: [["COMP3670", "MATH1013"], ["COMP1110", "COMP1140"]],
    offerings: [
      { year: 2027, semester: "First", classNumber: "5088" },
      { year: 2028, semester: "First", classNumber: "6493" },
    ],
  },
  {
    code: "COMP3300",
    title: "Operating Systems Implementation",
    description:
      "A detailed look at the internals of an existing operating system.",
    requisiteText:
      "Completed COMP2310.",
    requires: [["COMP2310"]],
    offerings: [
      { year: 2027, semester: "Second", classNumber: "10376" },
      { year: 2028, semester: "Second", classNumber: "11075" },
    ],
  },
  {
    code: "COMP3310",
    title: "Computer Networks",
    description:
      "Layered network communication models and protocol design.",
    requisiteText:
      "COMP2100 or COMP2300, and 6 units of 2000-level COMP courses. Only the named half is checked here — the 2000-level threshold isn't modelled.",
    requires: [["COMP2100", "COMP2300"]],
    offerings: [
      { year: 2027, semester: "First", classNumber: "5059" },
      { year: 2028, semester: "First", classNumber: "6684" },
    ],
  },
  {
    code: "COMP3320",
    title: "High Performance Scientific Computation",
    description:
      "An introduction to high-performance computing oriented toward science and engineering applications.",
    requisiteText:
      "(COMP2100 or COMP2300 or ENGN2219) and (COMP1600 or 6 units of MATH courses, excluding MATH1003). ENGN2219 isn't in this catalogue, and the second half is a choice between a named course and a threshold — neither is checked here, so this check is both stricter (missing ENGN2219) and looser (dropping the second group entirely) than the real rule in different ways.",
    requires: [["COMP2100", "COMP2300"]],
    offerings: [
      { year: 2027, semester: "Second", classNumber: "10378" },
      { year: 2028, semester: "Second", classNumber: "11077" },
    ],
  },
  {
    code: "COMP3425",
    title: "Data Mining",
    description:
      "Practical data-mining algorithms and techniques for large datasets.",
    requisiteText:
      "6 units from COMP1100, COMP1130 or COMP1730, and COMP2400.",
    requires: [["COMP1100", "COMP1130", "COMP1730"], ["COMP2400"]],
    offerings: [],
  },
  {
    code: "COMP3500",
    title: "Software Engineering Project",
    units: 6,
    description:
      "Team-based development of a nontrivial software system for a real client.",
    requisiteText:
      "Eligible for a project group, studying the Software Engineering major or a related degree, and completed COMP2100 and COMP2120. Only the named half is checked here — project-group eligibility and degree enrolment aren't modelled.",
    requires: [["COMP2100"], ["COMP2120"]],
    incompatibleWith: ["COMP3820", "COMP4500", "COMP4820"],
    offerings: [
      { year: 2027, semester: "First", classNumber: "5105" },
      { year: 2027, semester: "Second", classNumber: "10110" },
      { year: 2028, semester: "First", classNumber: "6504" },
      { year: 2028, semester: "Second", classNumber: "10865" },
    ],
  },
  {
    code: "COMP3540",
    title: "Game Development",
    description:
      "A grounding in game design, development and production.",
    requisiteText:
      "Completed 12 units of 2000-level COMP courses. A unit threshold over an open category isn't modelled here, so nothing is checked.",
    offerings: [],
  },
  {
    code: "COMP3610",
    title: "Principles of Programming Languages",
    description:
      "Theory and design of programming languages: syntax, semantics and type systems.",
    requisiteText:
      "COMP2100, and (COMP1600 or 6 units of MATH courses, excluding MATH1003). Only the first course is checked here — the second is a choice between a named course and a threshold, and enforcing only the named course would wrongly refuse the MATH route.",
    requires: [["COMP2100"]],
    offerings: [
      { year: 2027, semester: "Second", classNumber: "10097" },
      { year: 2028, semester: "Second", classNumber: "11056" },
    ],
  },
  {
    code: "COMP3620",
    title: "Artificial Intelligence",
    description:
      "Core artificial intelligence: search, knowledge representation, planning and intelligent agents.",
    requisiteText:
      "COMP1110 or COMP1140, and completed or currently studying COMP2620. Concurrent enrolment isn't modelled — only \"completed\" counts — so this check is stricter than the real rule for anyone taking both at once.",
    requires: [["COMP1110", "COMP1140"], ["COMP2620"]],
    offerings: [
      { year: 2027, semester: "First", classNumber: "5052" },
      { year: 2028, semester: "First", classNumber: "6461" },
    ],
  },
  {
    code: "COMP3670",
    title: "Introduction to Machine Learning",
    description:
      "Statistical and mathematical foundations of machine learning, standalone or as a lead-in to further ML courses.",
    requisiteText:
      "Completed COMP1110 or COMP1140.",
    requires: [["COMP1110", "COMP1140"]],
    offerings: [
      { year: 2027, semester: "Second", classNumber: "10093" },
      { year: 2028, semester: "Second", classNumber: "10854" },
    ],
  },
  {
    code: "COMP3703",
    title: "Software Security",
    description:
      "Advanced software vulnerability assessment, discovery and mitigation.",
    requisiteText:
      "(COMP2300 or ENGN2219) and COMP2700. ENGN2219 isn't in this catalogue, so this check is stricter than the real rule for anyone who satisfied the first course through it.",
    requires: [["COMP2300"], ["COMP2700"]],
    offerings: [],
  },
  {
    code: "COMP3704",
    title: "Network Security",
    description:
      "Network security protocols, threats and defence techniques.",
    requisiteText:
      "COMP2700, and (COMP3310 or ENGN3539). ENGN3539 isn't in this catalogue, so this check is stricter than the real rule for anyone who satisfied the second course through it.",
    requires: [["COMP2700"], ["COMP3310"]],
    offerings: [
      { year: 2027, semester: "Second", classNumber: "10095" },
      { year: 2028, semester: "Second", classNumber: "10856" },
    ],
  },
  {
    code: "COMP3710",
    title: "Topics in Computer Science",
    description:
      "A senior small-class course on a topic outside the regular curriculum.",
    requisiteText:
      "A permission code only; no generic prerequisite stated.",
    offerings: [],
  },
  {
    code: "COMP3740",
    title: "Individual Project",
    description:
      "A single-semester supervised individual project in an agreed computing area.",
    requisiteText:
      "Completed 72 units towards a degree, plus a supervisor and permission code. A degree-wide unit threshold isn't modelled here, so nothing is checked.",
    offerings: [
      { year: 2027, semester: "First", classNumber: "5090" },
      { year: 2027, semester: "Second", classNumber: "10092" },
      { year: 2028, semester: "First", classNumber: "6495" },
      { year: 2028, semester: "Second", classNumber: "10853" },
    ],
  },
  {
    code: "COMP3770",
    title: "Computing Research Project (R&D)",
    units: 6,
    description:
      "An individual research project for Advanced Computing (R&D) honours students.",
    requisiteText:
      "Studying the Bachelor of Advanced Computing (R&D) (Honours), and completed COMP2550, plus a supervisor and permission code. Only the named course is checked here — degree enrolment and supervisor approval aren't modelled.",
    requires: [["COMP2550"]],
    offerings: [
      { year: 2027, semester: "First", classNumber: "5084" },
      { year: 2027, semester: "Second", classNumber: "10084" },
      { year: 2028, semester: "First", classNumber: "6489" },
      { year: 2028, semester: "Second", classNumber: "10845" },
    ],
  },
  {
    code: "COMP3820",
    title: "Computing Internship",
    units: 12,
    description:
      "A professional internship placement for computer science students, competitive entry.",
    requisiteText:
      "Completed COMP2100 and COMP2120, plus competitive entry. Only the named courses are checked here — competitive entry isn't modelled.",
    requires: [["COMP2100"], ["COMP2120"]],
    offerings: [],
  },
  {
    code: "COMP3900",
    title: "Human-Computer Interaction",
    description:
      "HCI theory, interaction and experience design methods, and prototyping.",
    requisiteText:
      "Completed 12 units of 2000-level COMP courses. A unit threshold over an open category isn't modelled here, so nothing is checked.",
    offerings: [
      { year: 2027, semester: "Second", classNumber: "10090" },
      { year: 2028, semester: "Second", classNumber: "10851" },
    ],
  },
  {
    code: "COMP4011",
    title: "Advanced Topics in Formal Methods and Programming Languages",
    description:
      "A themed advanced theoretical computer science topic, content varying yearly by staff research.",
    requisiteText:
      "12 units of 3000 and/or 4000-level COMP courses, plus a permission code. A unit threshold over an open category isn't modelled here, so nothing is checked.",
    offerings: [
      { year: 2027, semester: "Second", classNumber: "10078" },
      { year: 2028, semester: "Second", classNumber: "10840" },
    ],
  },
  {
    code: "COMP4020",
    title: "Advanced Topics in Human-Centred and Creative Computing",
    description:
      "A themed advanced human-computer-interaction and creative-computing topic — this offering's topic is Agentic Coding Studio, the course this app was built for.",
    requisiteText:
      "Completed COMP3900, plus a permission code. Only the named course is checked here — the permission code isn't modelled.",
    requires: [["COMP3900"]],
    offerings: [
      { year: 2027, semester: "Second", classNumber: "10061" },
      { year: 2028, semester: "Second", classNumber: "10825" },
    ],
  },
  {
    code: "COMP4045",
    title: "Advanced Topics in Computer Systems",
    description:
      "A themed advanced systems and architecture topic, content varying yearly by staff research.",
    requisiteText:
      "12 units of 3000 and/or 4000-level COMP courses. A unit threshold over an open category isn't modelled here, so nothing is checked.",
    offerings: [
      { year: 2027, semester: "First", classNumber: "5496" },
      { year: 2028, semester: "Second", classNumber: "11048" },
    ],
  },
  {
    code: "COMP4130",
    title: "Managing Software Quality and Process",
    description:
      "Managing software quality and process, including static and dynamic analysis.",
    requisiteText:
      "COMP2120, and 12 units of 2000-level COMP courses. Only the named course is checked here — the unit threshold isn't modelled.",
    requires: [["COMP2120"]],
    offerings: [
      { year: 2027, semester: "First", classNumber: "5093" },
      { year: 2028, semester: "First", classNumber: "6498" },
    ],
  },
  {
    code: "COMP4300",
    title: "Parallel Systems",
    description:
      "Programming paradigms and performance analysis for parallel computers.",
    requisiteText:
      "Completed COMP2310.",
    requires: [["COMP2310"]],
    offerings: [
      { year: 2027, semester: "First", classNumber: "5095" },
      { year: 2028, semester: "First", classNumber: "6678" },
    ],
  },
  {
    code: "COMP4350",
    title: "Sound and Music Computing",
    description:
      "Music computing: digital synthesis, algorithmic composition and interface design.",
    requisiteText:
      "12 units of 2000-level COMP courses, or (12 units of 2000-level MUSI, DESN or ARTV courses and COMP1720). Nothing is checked here: one whole path requires no named course at all, so any named check would wrongly refuse students who qualified through it.",
    offerings: [
      { year: 2027, semester: "First", classNumber: "5107" },
    ],
  },
  {
    code: "COMP4450",
    title: "Computing Research Methods",
    description:
      "Research-methodology lectures and workshops for honours-track students.",
    requisiteText:
      "Enrolled in an honours program this catalogue doesn't track, or (Advanced Computing and completed 24 units of COMP courses). Program enrolment and unit thresholds aren't modelled, so nothing is checked.",
    incompatibleWith: ["COMP2550"],
    offerings: [
      { year: 2027, semester: "First", classNumber: "5069" },
      { year: 2028, semester: "First", classNumber: "6474" },
    ],
  },
  {
    code: "COMP4500",
    title: "Software Engineering Team Project",
    description:
      "An industry-facing team project with student-led leadership and planning.",
    requisiteText:
      "Eligible for a project group, and either (Advanced Computing, COMP2120, and 12 units of 3000/4000-level COMP) or (Software Engineering, and COMP3500). Approximated here as completed COMP2120 or COMP3500 — every real path requires at least one of them, so this is a permissive stand-in for the degree and unit conditions this model can't check.",
    requires: [["COMP2120", "COMP3500"]],
    incompatibleWith: ["COMP4550"],
    offerings: [
      { year: 2027, semester: "First", classNumber: "5106" },
      { year: 2027, semester: "Second", classNumber: "10111" },
      { year: 2028, semester: "First", classNumber: "6505" },
      { year: 2028, semester: "Second", classNumber: "10866" },
    ],
  },
  {
    code: "COMP4528",
    title: "Computer Vision",
    description:
      "Image and video understanding, from classical techniques through deep learning.",
    requisiteText:
      "ENGN2228, COMP2120, COMP3600 or COMP3670. ENGN2228 isn't in this catalogue, so this check is stricter than the real rule for anyone who satisfied it through that course.",
    requires: [["COMP2120", "COMP3600", "COMP3670"]],
    offerings: [
      { year: 2027, semester: "First", classNumber: "5064" },
      { year: 2028, semester: "First", classNumber: "6470" },
    ],
  },
  {
    code: "COMP4550",
    title: "Computing Research Project",
    units: 12,
    description:
      "An individual honours research project culminating in a thesis.",
    requisiteText:
      "Completed COMP2550, or completed or currently enrolled in COMP4450, plus a 70% WAM and a supervisor and permission code. Approximated as one of COMP2550 or COMP4450 completed — every real path requires one of them, so this is a permissive stand-in; concurrent enrolment in COMP4450 also isn't modelled, and neither is the WAM requirement.",
    requires: [["COMP2550", "COMP4450"]],
    incompatibleWith: ["COMP4820"],
    offerings: [
      { year: 2027, semester: "First", classNumber: "5083" },
      { year: 2027, semester: "Second", classNumber: "10083" },
      { year: 2028, semester: "First", classNumber: "6488" },
      { year: 2028, semester: "Second", classNumber: "10844" },
    ],
  },
  {
    code: "COMP4600",
    title: "Advanced Algorithms",
    description:
      "Advanced algorithmic techniques: approximation, randomised, parallel and distributed, and online algorithms.",
    requisiteText:
      "Completed COMP3600, and 18 units of 3000-level COMP courses. Only the named course is checked here — the unit threshold isn't modelled.",
    requires: [["COMP3600"]],
    offerings: [],
  },
  {
    code: "COMP4610",
    title: "Computer Graphics",
    description:
      "3D graphics algorithms, data structures and application programming.",
    requisiteText:
      "COMP2100, and 6 units of (COMP3600, COMP3540, COMP3900 or COMP3320).",
    requires: [["COMP2100"], ["COMP3600", "COMP3540", "COMP3900", "COMP3320"]],
    offerings: [
      { year: 2027, semester: "First", classNumber: "5057" },
      { year: 2028, semester: "First", classNumber: "6685" },
    ],
  },
  {
    code: "COMP4620",
    title: "Advanced Topics in Artificial Intelligence",
    description:
      "A themed advanced AI topic — planning, reinforcement learning, robotics and similar — content varying yearly.",
    requisiteText:
      "12 units of 3000 and/or 4000-level COMP courses, plus a permission code. A unit threshold over an open category isn't modelled here, so nothing is checked.",
    offerings: [
      { year: 2027, semester: "Second", classNumber: "10076" },
      { year: 2028, semester: "Second", classNumber: "10838" },
    ],
  },
  {
    code: "COMP4650",
    title: "Document Analysis",
    description:
      "Information retrieval, NLP and machine learning techniques applied to semi-structured documents.",
    requisiteText:
      "(COMP1600 or COMP2100), and 12 units of 3000/4000-level COMP or INFS courses. Only the first group is checked here — the unit threshold isn't modelled.",
    requires: [["COMP1600", "COMP2100"]],
    offerings: [
      { year: 2027, semester: "Second", classNumber: "10086" },
      { year: 2028, semester: "Second", classNumber: "10847" },
    ],
  },
  {
    code: "COMP4670",
    title: "Statistical Machine Learning",
    description:
      "Bayesian and statistical machine learning: regression, classification, clustering and graphical models.",
    requisiteText:
      "COMP3670, or (COMP1110 or COMP1140, and MATH1014, MATH1115 or MATH1116). Nothing is checked here: the second path needs two courses at once and this model can only check one required course per alternative path, so it can't be represented without either wrongly blocking or wrongly admitting some students.",
    offerings: [
      { year: 2027, semester: "First", classNumber: "5109" },
      { year: 2028, semester: "First", classNumber: "6508" },
    ],
  },
  {
    code: "COMP4680",
    title: "Advanced Topics in Machine Learning",
    description:
      "A themed advanced machine-learning topic, content varying yearly by staff research.",
    requisiteText:
      "12 units of 3000 and/or 4000-level COMP courses, plus a permission code. A unit threshold over an open category isn't modelled here, so nothing is checked.",
    offerings: [
      { year: 2027, semester: "First", classNumber: "5050" },
      { year: 2028, semester: "First", classNumber: "6459" },
    ],
  },
  {
    code: "COMP4691",
    title: "Optimisation",
    description:
      "Practical optimisation: constraint programming, linear programming and convex optimisation.",
    requisiteText:
      "Completed COMP3620, and MATH1013 or MATH1115. MATH1115 isn't in this catalogue, so this check is stricter than the real rule for anyone who satisfied the second course through it.",
    requires: [["COMP3620"], ["MATH1013"]],
    offerings: [],
  },
  {
    code: "COMP4712",
    title: "Compiler Construction",
    description:
      "A compiler-construction project: lexing, parsing, code generation and register allocation.",
    requisiteText:
      "COMP2100, COMP2310, and 6 units of 3000/4000-level COMP courses. Only the named courses are checked here — the unit threshold isn't modelled.",
    requires: [["COMP2100"], ["COMP2310"]],
    incompatibleWith: ["COMP3710"],
    offerings: [],
  },
  {
    code: "COMP4820",
    title: "Advanced Computing Internship",
    units: 12,
    description:
      "A competitive industry or government internship placement for Advanced Computing students.",
    requisiteText:
      "Studying the Bachelor of Advanced Computing, and completed COMP2100 and 12 units of 3000-level COMP courses. Only the named course is checked here — degree enrolment and the unit threshold aren't modelled.",
    requires: [["COMP2100"]],
    offerings: [
      { year: 2027, semester: "First", classNumber: "5047" },
      { year: 2027, semester: "Second", classNumber: "10074" },
      { year: 2028, semester: "First", classNumber: "6456" },
      { year: 2028, semester: "Second", classNumber: "10836" },
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
      units: entry.units ?? 6,
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

  }

  // Incompatibility runs both ways, but the data only declares each pair
  // once — on whichever course happens to carry it below — and this
  // symmetrizes it into both directions. At catalogue-this-size, requiring
  // every entry to also list itself on the other course's incompatibleWith
  // is a standing invitation to declare one side and forget the other; a
  // pair-set closes that off entirely rather than relying on care.
  const pairs = new Set<string>();
  for (const entry of CATALOGUE) {
    const courseId = ids.get(entry.code);
    if (courseId === undefined) continue;
    for (const code of entry.incompatibleWith ?? []) {
      const withCourseId = ids.get(code);
      if (withCourseId === undefined) continue;
      pairs.add(courseId < withCourseId ? `${courseId}-${withCourseId}` : `${withCourseId}-${courseId}`);
    }
  }
  for (const pair of pairs) {
    const [a, b] = pair.split("-").map(Number);
    db.insert(incompatibilities).values({ courseId: a, withCourseId: b }).run();
    db.insert(incompatibilities).values({ courseId: b, withCourseId: a }).run();
  }
}
