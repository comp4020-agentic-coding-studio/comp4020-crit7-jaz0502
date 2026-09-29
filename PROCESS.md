# Process overview

## What I built

I rebuilt the ANU course enrolment experience as a full-stack application focused on making course selection more direct. The original process requires students to move between Programs and Courses and ANU Hub. Students have to first find a course, open its page, locate the class number, and then enter that number into the enrolment system. My version allows courses to be searched and selected without requiring the user to find and enter a separate class number. I also added an eligibility filter so students can choose to view only courses they are eligible to enrol in, rather than discovering their eligibility only after attempting to enrol.


## How I got here

While testing the deployed prototype, I noticed that some courses could not be found even though they had been added. Instead of assuming the search was broken, I tested the deployed database and traced the issue to the catalogue only being seeded when the database was empty. This meant that newly added courses never reached the live database. The automated tests had not caught this because they ran against a fresh database each time. I fixed the process and verified it against a database rolled back to the old state with existing enrolments in it. I knew the fix worked because a single boot restored the missing courses while leaving every enrolment untouched [63c6c70](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-jaz0502/commit/63c6c70a6897a17a7ee081d8f1d55e6aff83971a).

When implementing the “Only show eligible courses” checkbox, I noticed that selecting it did not immediately change the results. Instead, users had to click Search again. Rather than keeping this behaviour because it technically worked,  I changed the implementation so that the course list updates immediately when the checkbox is clicked. I verified the change by testing the deployed interface and confirming that ineligible courses disappeared as soon as the filter was enabled. This made the user experience more intuitive. [23d9911](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-jaz0502/commit/23d9911b1863bba1d3463de324cd3a40a37ae910).
