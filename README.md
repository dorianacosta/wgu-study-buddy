# WGU Study Buddy

by Dorian Acosta · MIT License

Not affiliated with Western Governors University.

Free, open-source study guides for all 29 courses in WGU's B.S. Computer Science plan, plus 60 original C952 practice
questions. The offline build packs the whole app (code, styles, fonts and every guide) into one HTML file.

**Use it online:** https://wgu-study-buddy.netlify.app (Netlify rebuilds it from `main` on every push).

## What is inside

The courses, by subject:

| Subject | Courses |
| --- | --- |
| Programming foundations | D278 Scripting and Programming - Foundations · C867 Scripting and Programming - Applications · D276 Web Development Foundations · D197 Version Control |
| Java and back end | D286 Java Fundamentals · D287 Java Frameworks · D288 Back-End Programming · D387 Advanced Java |
| Software engineering | D284 Software Engineering · D480 Software Design and Quality Assurance · D687 Computer Science Project Development with a Team |
| Data | D426 Data Management - Foundations · D427 Data Management - Applications |
| Security and networks | D315 Network and Security - Foundations · D430 Fundamentals of Information Security |
| Systems and architecture | D281 Linux Foundations · C952 Computer Architecture · D686 Operating Systems for Computer Scientists |
| Algorithms and math | C960 Discrete Mathematics II · C949 Data Structures and Algorithms I · C950 Data Structures and Algorithms II |
| AI | D685 Practical Applications of Prompt · D429 Introduction to AI for Computer Scientists · D682 Artificial Intelligence Optimization for Computer Scientists · D683 Advanced AI and ML |
| Professional skills | D459 Introduction to Systems Thinking and Applications · D333 Ethics in Technology · D336 Business of IT - Applications · C458 Health, Fitness, and Wellness |

Every course has a study guide: Learn (overview and the assessment, topics, a study plan, community notes, resources
and sources), a Cheat Sheet (the exam, key facts and pitfalls), Practice (original questions graded where you read
them, and flashcards made from the guide's key facts) and My Misses. C952 has its own toolkit instead: 60 original
practice questions with plain-language explanations, Learn by topic, a cheat sheet, practice exams in five modes (Full
exam, Quick 20, Topic drill, My misses, Remix exam), 52 flashcards made from its cheat sheet and My Misses.

Pick a course in the bar's course switcher: Home and the four tools follow it. Along the way:

- **Mark courses completed.** Every course has a Completed button (on its card, in Learn and on Home). The Courses page
  lists All, Remaining or Completed courses and shows your degree progress in courses and competency units. Once the
  course you're on is completed, Home suggests the next one.
- **Set an exam date.** Learn and Home count the days to your exam and say whether the study plan's remaining days
  fit.
- **Drill flashcards.** Practice's Flashcards mode shows one key fact at a time: mark each "Knew it" or "Study again",
  then study just the ones you missed. C952's Practice Exam has Flashcards too, on its start screen: its 10 formulas,
  30 signal words and 12 ARM reference rows, each card saying which kind it is. The Cheat Sheets link to them ("Drill
  as flashcards").
- **Back up your progress** to a file and restore it on another device (Courses, Your progress).

The study guides use cited public sources and never reproduce assessment items, task directions or rubric text. Course
details change; confirm requirements on your WGU course page.

## Run it

You need Node.js and npm.

```bash
npm install
npm run dev          # http://localhost:5173, with hot reload
npm run build        # the hosted site in dist/: the page, plus one file per guide in dist/guides/
npm run build:file   # writes WGU_Study_Buddy.html: the whole app and every guide in one file
```

## Open or host the single file

`WGU_Study_Buddy.html` holds everything, so you can open it in any modern browser, even offline. To study on several
devices, put the file on any static host (GitHub Pages, Netlify or your own web space) and open its address.
Safari may not keep progress for a page opened from a `file://` address, so host the file if you study in Safari.

The hosted site (`npm run build`) works differently: to keep the first visit small, each guide is its own file under
`/guides/`, fetched the first time its course opens and then kept by the browser.

## Where your progress is saved

In this browser only. Progress, marks and settings are saved in the browser's `localStorage`, under keys that start
with `c952-` and `wgu-study-buddy-`. Nothing is sent to a server. Progress does not move between browsers or
devices on its own, and clearing the site's data in your browser erases it.

To keep it safe or move it, open Courses and use **Save backup** at the end of the page. It saves a small file,
`wgu-study-buddy-progress-YYYY-MM-DD.json`, holding every course's marks, completed courses, exam dates and C952 exam
history. **Restore from file** on any device replaces that browser's progress with the file's, after asking first.
The file never leaves your device unless you move it.

## Security

- **Only the app's own code runs.** The build writes a Content-Security-Policy into the page (`vite.config.ts`). It
  allows the app's one script by its hash and blocks everything else: scripts or event handlers inside content HTML,
  `eval`, frames and network requests (the hosted site may fetch only its own guide files). The policy is rebuilt with
  the page, and a build that would load an outside script fails.
- **The live site limits floods.** `netlify.toml` sends security headers (no framing, no MIME sniffing, no camera,
  microphone or location access). It also limits each visitor's IP address to 60 requests a minute, on top of
  Netlify's own DDoS protection. A visit is one request, so real students never reach the limit.

## Contributing

- Practice questions, key facts and study-plan days: add new ones at the end of a guide's `practice`, `keyFacts` or
  `plan` list (`src/data/guides/<slug>.json`), or at the end of C952's questions (`src/data/content.json`). Never
  reorder or remove existing entries: marks (practice answers, flashcards, Done days) are saved by position, so moving
  an entry moves everyone's marks with it.
- C952's flashcards are its formulas, signal words and ARM reference rows (`src/data/content.json`), in the deck order
  `C952_DECK` sets (`src/data/index.ts`). A new card goes at the end only: add its entry at the end of its list, then
  append a run for it at the end of `C952_DECK`.
- Guides cite their sources. Add a source for every new fact, and keep each guide's `updated` date current.
- Content HTML is formatting only (bold, italics, code, lists and links). The Content-Security-Policy blocks
  scripts, event handlers and outside images in it.
- Every visual element comes from a 21st.dev component (see Credits). Log every change to a component's code in
  `21st/INTEGRATION.md`, and keep the original author's credit in the file.

## Project layout

| Path | What it is |
| --- | --- |
| `src/data/content.json` | C952: its topics, the 60 original practice questions, the study plan, formulas and tables |
| `src/data/guides/*.json` | The study guides, one per course (C952's content is in `content.json`), with their sources |
| `src/data/courses.ts` | The 29 courses in their subject groups, and the shape of a guide |
| `src/data/guide-source.*.ts` | Where whole guides come from: built into the page (`embed`) or fetched from `/guides/` (`fetch`) |
| `vite.config.ts` | The build: one HTML file, the guide index and guide files, the Content-Security-Policy |
| `src/lib/` | Routes, the active course, progress storage and backup, the exam modes and the exam session |
| `src/views/` | Home, Courses, and the four tools for each course |
| `src/components/ui/` | The 21st.dev components, under their prompts' file names |
| `src/index.css` | The WGU Study Buddy theme (gold on near-black), the fonts and the base styles (Tailwind CSS v4) |
| `21st/` | The saved 21st.dev prompts, their manifests and the integration log (`21st/INTEGRATION.md`) |

## Credits

Every visual element of WGU Study Buddy comes from 21st.dev, brought in with each component page's **Copy prompt →
Claude Code** option. The prompts are kept word for word in `21st/prompts/`, with author, license and a sha256
checksum in `21st/manifest/`, and every change to their code is logged in `21st/INTEGRATION.md`. Licenses are as each
21st.dev page lists them; "not listed" means the page shows no license. A component file the app changed keeps its
original credit and adds "Modified by Dorian Acosta for WGU Study Buddy (MIT)".

| Component | Author | 21st.dev page | License |
| --- | --- | --- | --- |
| trippin spiral (ASCII effect, Canvas2D recipe: the animated background) | jobsrip | https://21st.dev/community/ascii/trippin-spiral-fa23bfd9-dad9-49f9-be46-6f4ce2e61c29 | not listed; permission pending |
| Decrypt Text | rmahammad (Mehi), Motiq library | https://21st.dev/@rmahammad/components/decrypt-text | MIT |
| Scramble Link Button | hyperiux (Hyperiux Vault) | https://21st.dev/@hyperiux/components/scramble-link-button | MIT |
| Corner Frame | kevingirelli (Kevin Girelli), corsair-ui | https://21st.dev/@kevingirelli/components/corner-frame | MIT, Copyright (c) 2026 Kevin Girelli |
| Terminal | thegridcn (The Gridcn library) | https://21st.dev/@thegridcn/components/terminal | MIT |
| Tree Box Drawing | nikolas-sapa (Nikolas Sapalidis), @ns-ui library | https://21st.dev/@nikolas-sapa/components/tree-box-drawing | MIT, Copyright (c) 2026 Nikolas Sapalidis |
| Conveyor Loop | loading-ui (loading-ui.com) | https://21st.dev/@loading-ui/components/conveyor-loop | MIT |
| Accordion | shadcn | https://21st.dev/@shadcn/components/accordion | MIT |
| Alert | shadcn | https://21st.dev/@shadcn/components/alert | MIT |
| Alert Dialog | shadcn | https://21st.dev/@shadcn/components/alert-dialog | MIT |
| Button | shadcn | https://21st.dev/@shadcn/components/button | MIT |
| Card | shadcn | https://21st.dev/@shadcn/components/card | MIT |
| Checkbox | shadcn | https://21st.dev/@shadcn/components/checkbox | MIT |
| Collapsible | shadcn | https://21st.dev/@shadcn/components/collapsible | MIT |
| Kbd (its prompt also brings the Input) | shadcn | https://21st.dev/@shadcn/components/kbd | not listed; permission pending |
| Label | shadcn | https://21st.dev/@shadcn/components/label | MIT |
| Progress | shadcn | https://21st.dev/@shadcn/components/progress | MIT |
| Radio Group | shadcn | https://21st.dev/@shadcn/components/radio-group | MIT |
| Select | shadcn | https://21st.dev/@shadcn/components/select | MIT |
| Separator | shadcn | https://21st.dev/@shadcn/components/separator | MIT |
| Switch | shadcn | https://21st.dev/@shadcn/components/switch | MIT |
| Table | shadcn | https://21st.dev/@shadcn/components/table | MIT |
| Tabs | shadcn | https://21st.dev/@shadcn/components/tabs | MIT |
| Base Badge (ReUI; stands in for shadcn Badge) | sean0205 | https://21st.dev/@sean0205/components/base-badge | MIT |
| Animated Circular Progress Bar | Magic UI (dillionverma) | https://21st.dev/@magicui/components/animated-circular-progress-bar | MIT |
| Bento Grid | Magic UI (dillionverma) | https://21st.dev/@magicui/components/bento-grid | MIT |
| Blur Fade | Magic UI (dillionverma) | https://21st.dev/@magicui/components/blur-fade | MIT |
| Number Ticker | Magic UI (dillionverma) | https://21st.dev/@magicui/components/number-ticker | MIT |
| Timeline | Aceternity UI (manuarora700) | https://21st.dev/@aceternity/components/timeline | MIT |
| Stats (stats-info) | meschacirung | https://21st.dev/@meschacirung/components/stats/stats-info | not listed; permission pending |
| Empty State | serafimcloud | https://21st.dev/@serafimcloud/components/empty-state | MIT |
| Question Tool (multiple-choice) | serafimcloud | https://21st.dev/@serafimcloud/components/question-tool/multiple-choice | MIT |
| Footer with Big Wordmark | vilqor | https://21st.dev/@vilqor/components/wordmark-footer | MIT |
| Tubelight Navbar | ayushmxxn | https://21st.dev/@ayushmxxn/components/tubelight-navbar | MIT |
| Dot Text | jahed | https://21st.dev/@jahed/components/dot-text | MIT |

The `@magicui` and `@aceternity` pages redirect to the authors' `@dillionverma` and `@manuarora700` pages. The
question header's inline `IconQuestion` ships inside Question Tool and is credited with it. Components the app no
longer uses (Border Beam, Dot Pattern, Glowing Effect, Glyph Matrix, Hero Minimalism, Liquid Metal Button) and the
ones collected but not used (Dialog, Slider, Tooltip) keep their prompts in `21st/` and their credits in
`THIRD_PARTY_NOTICES.md`.

Built on React, Radix UI and Radix Icons, Base UI, Motion, Lucide icons, Tailwind CSS, tw-animate-css,
class-variance-authority, clsx and tailwind-merge, with components from shadcn/ui and the Geist and Geist Mono fonts
(SIL Open Font License 1.1). [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) lists every package and asset the build
embeds, with its author and full license text.

## License

MIT © 2026 Dorian Acosta. See [LICENSE](LICENSE). The MIT grant covers the author's own work only: third-party code,
fonts and 21st.dev assets keep their own authors and licenses, listed in
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Author: Dorian Acosta · MIT License. Not affiliated with Western Governors University.
