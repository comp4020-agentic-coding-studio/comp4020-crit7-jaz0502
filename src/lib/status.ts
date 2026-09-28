import type { Eligibility } from "./db";

// The verdict, as a chip. This is the one thing the app exists to tell you, so
// it gets a name and a colour rather than being buried in a sentence — but the
// label always carries the meaning in words, because colour alone isn't a
// distinction everyone can see.
//
// "Blocked" is deliberately kept apart from "Completed" and "Enrolled": all
// three mean you can't enrol, but only one of them is a problem.
export type Tone = "open" | "enrolled" | "done" | "blocked" | "closed";
export type Status = { label: string; tone: Tone };

export function statusOf(offered: boolean, eligibility: Eligibility | undefined): Status {
  if (!offered) return { label: "Not offered", tone: "closed" };
  if (!eligibility) return { label: "Sign in to check", tone: "closed" };
  if (eligibility.ok) return { label: "Open", tone: "open" };

  switch (eligibility.reason) {
    case "already-enrolled":
      return { label: "Enrolled", tone: "enrolled" };
    case "already-completed":
      return { label: "Completed", tone: "done" };
    default:
      return { label: "Blocked", tone: "blocked" };
  }
}
