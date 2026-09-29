# ANU enrolment, by course code

To enrol in a course at ANU you have to find it on Programs and Courses, open
its offerings table, read off a four- or five-digit class number, then retype
that number into ANU Hub — a separate system that never mentions the course
code you started with. This app is one slice of enrolment rebuilt around the
thing a student actually knows: the course code. You search `COMP3430`, see
whether you're allowed to take it and why, and enrol without ever being asked
for a class number. The number still exists — it's shown to you as a receipt
once you're in, never collected as an input.

## What good looks like here

The argument is that the class number should never be the user's problem, so
the enforced rule is structural: no form on this app has a field for one.
`spec/enrolment.test.ts` checks this directly — an enrolment POST carrying only
a course code and semester succeeds, and asserts the rendered page contains no
input named anything like "class number".

Around that, enrolling has to obey the same rules real enrolment does, in an
order that reports the most specific reason first: already enrolled, already
completed, incompatible with something you've taken, missing a prerequisite
group, and — checked last, since it's a fact about your whole semester rather
than this course — over the 24-unit full-time load. All five are enforced by
the spec suite, not left to the UI to get right; the UI's job is to never show
an enabled "Enrol" button for a course the same check would refuse.

Prerequisites are modelled in conjunctive normal form (a `groupNo` per
requisite group, OR'd within a group, AND'd across groups), because that's the
actual shape of ANU's requisite text — "COMP1100 or COMP1130, and COMP2400" —
rather than a simpler model that would misrepresent real rules. Course codes,
titles, units and requisites are hand-seeded from real Programs and Courses
data for a deliberately narrow, deep slice of the undergraduate COMP catalogue,
not scraped and not broadened to other subjects — depth over breadth was a
judgement call, made so the requisite chains in the demo are real ANU rules
rather than invented ones.

What this app chose not to build: timetable clash detection. At ANU you enrol
in courses for a semester and register for individual class times separately —
clashes aren't a fact this system has yet, so pretending to check for them
would be modelling a problem enrolment doesn't actually have.

Two things are judgement calls the spec doesn't check: the visual design
(cards over rows, the ANU gold accent used sparingly per ANU's own brand
guidance rather than as a background) and the choice to seed every new account
with the same starting study history, since this prototype has no real student
record to read one from — `/me/` says so plainly rather than hiding it.
