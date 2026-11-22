# Third-party notices

WGU Study Buddy is by Dorian Acosta and released under the MIT License (see [LICENSE](LICENSE)). That grant covers
his own work only. The packages, fonts and 21st.dev assets below keep their authors' names, copyrights and licenses,
as each source states them. Not affiliated with Western Governors University.

How this list was made (2026-11-20): the production dependencies come from `npm ls --omit=dev --all --json`
(77 entries), and each license text from the package's own license file in `node_modules/`. The list was then
checked against the built app (`vite build`, 2,731 modules transformed): the bundler's module list, the
built CSS and the inlined fonts. Every package in section 1 is embedded in the built page (`WGU_Study_Buddy.html`),
and every package the page embeds is in section 1. Regenerate the list when a dependency changes.

1. [Packages the build embeds](#1-packages-the-build-embeds)
2. [Packages npm lists that the build does not embed](#2-packages-npm-lists-that-the-build-does-not-embed)
3. [21st.dev assets](#3-21stdev-assets)
4. [shadcn/ui](#4-shadcnui)
5. [Fonts: Geist and Geist Mono](#5-fonts-geist-and-geist-mono)
6. [License texts](#6-license-texts)

> **Release blockers.** Three 21st.dev assets in the app list no license: the trippin spiral recipe, the Kbd prompt
> (which also brings the Input) and Stats. They are marked "license not listed; permission pending" below. Confirm
> terms with their authors or replace them before the repository goes public. The retired Hero Minimalism lists no
> license either; its code left the app, but its saved prompt in `21st/` would ship with the repository.

## 1. Packages the build embeds

66 packages: 63 production dependencies, plus Tailwind CSS, Vite and Rolldown, dev dependencies whose
code the build writes into the page. Their own license texts are in section 6.

| Package | Version | License | Copyright notice (from its license file) | In the build |
|---|---|---|---|---|
| `aria-hidden` | 1.2.6 | MIT | Copyright (c) 2017 Anton Korzunov | JavaScript |
| `@base-ui-components/react` | 1.0.0-rc.0 | MIT | Copyright (c) 2019 Material-UI SAS | JavaScript |
| `@base-ui-components/utils` | 0.2.2 | MIT | Copyright (c) 2019 Material-UI SAS | JavaScript |
| `class-variance-authority` | 0.7.1 | Apache-2.0 | Copyright 2022 Joe Bell | JavaScript |
| `clsx` | 2.1.1 | MIT | Copyright (c) Luke Edwards (lukeed.com) | JavaScript |
| `@floating-ui/core` | 1.8.0 | MIT | Copyright (c) 2021-present Floating UI contributors | JavaScript |
| `@floating-ui/dom` | 1.8.0 | MIT | Copyright (c) 2021-present Floating UI contributors | JavaScript |
| `@floating-ui/react-dom` | 2.1.9 | MIT | Copyright (c) 2021-present Floating UI contributors | JavaScript |
| `@floating-ui/utils` | 0.2.12 | MIT | Copyright (c) 2021-present Floating UI contributors | JavaScript |
| `@fontsource-variable/geist` | 5.3.0 | OFL-1.1 | Copyright 2024 The Geist Project Authors (https://github.com/vercel/geist-font) | Font: geist-latin-wght-normal.woff2 (Geist Variable), inlined as base64 |
| `@fontsource-variable/geist-mono` | 5.3.0 | OFL-1.1 | Copyright 2024 The Geist Project Authors (https://github.com/vercel/geist-font.git) | Font: geist-mono-latin-wght-normal.woff2 (Geist Mono Variable) and geist-mono-symbols2-wght-normal.woff2 (Geist Mono Symbols), inlined as base64 |
| `framer-motion` | 14.14.0 | MIT | Copyright (c) 2018 Framer B.V. | JavaScript |
| `get-nonce` | 1.0.1 | MIT | Copyright (c) 2020 Anton Korzunov | JavaScript |
| `lucide-react` | 1.76.0 | ISC | Copyright (c) 2026 Lucide Icons and Contributors | JavaScript |
| `motion-dom` | 14.14.0 | MIT | Copyright (c) 2024 [Motion](https://motion.dev) B.V. | JavaScript |
| `motion-utils` | 14.7.0 | MIT | Copyright (c) 2024 [Motion](https://motion.dev) B.V. | JavaScript |
| `@radix-ui/number` | 1.1.3 | MIT | Copyright (c) 2022 WorkOS | JavaScript |
| `@radix-ui/primitive` | 1.2.0 | MIT | Copyright (c) 2022 WorkOS | JavaScript |
| `@radix-ui/react-accordion` | 1.3.1 | MIT | Copyright (c) 2022 WorkOS | JavaScript |
| `@radix-ui/react-alert-dialog` | 1.2.1 | MIT | Copyright (c) 2022 WorkOS | JavaScript |
| `@radix-ui/react-checkbox` | 1.4.1 | MIT | Copyright (c) 2022 WorkOS | JavaScript |
| `@radix-ui/react-collapsible` | 1.2.1 | MIT | Copyright (c) 2022 WorkOS | JavaScript |
| `@radix-ui/react-collection` | 1.2.0 | MIT | Copyright (c) 2022 WorkOS | JavaScript |
| `@radix-ui/react-compose-refs` | 1.1.5 | MIT | Copyright (c) 2022 WorkOS | JavaScript |
| `@radix-ui/react-context` | 1.3.0 | MIT | Copyright (c) 2022 WorkOS | JavaScript |
| `@radix-ui/react-dialog` | 1.3.1 | MIT | Copyright (c) 2022 WorkOS | JavaScript |
| `@radix-ui/react-direction` | 1.2.0 | MIT | Copyright (c) 2022 WorkOS | JavaScript |
| `@radix-ui/react-dismissable-layer` | 1.2.1 | MIT | Copyright (c) 2022 WorkOS | JavaScript |
| `@radix-ui/react-focus-guards` | 1.2.0 | MIT | Copyright (c) 2022 WorkOS | JavaScript |
| `@radix-ui/react-focus-scope` | 1.3.1 | MIT | Copyright (c) 2022 WorkOS | JavaScript |
| `@radix-ui/react-icons` | 1.3.2 | MIT | Copyright (c) 2022 WorkOS | JavaScript |
| `@radix-ui/react-id` | 1.1.4 | MIT | Copyright (c) 2022 WorkOS | JavaScript |
| `@radix-ui/react-label` | 2.1.17 | MIT | Copyright (c) 2022 WorkOS | JavaScript |
| `@radix-ui/react-popper` | 1.4.0 | MIT | Copyright (c) 2022 WorkOS | JavaScript |
| `@radix-ui/react-portal` | 1.2.0 | MIT | Copyright (c) 2022 WorkOS | JavaScript |
| `@radix-ui/react-presence` | 1.1.11 | MIT | Copyright (c) 2022 WorkOS | JavaScript |
| `@radix-ui/react-primitive` | 2.2.0 | MIT | Copyright (c) 2022 WorkOS | JavaScript |
| `@radix-ui/react-progress` | 1.2.1 | MIT | Copyright (c) 2022 WorkOS | JavaScript |
| `@radix-ui/react-radio-group` | 1.5.1 | MIT | Copyright (c) 2022 WorkOS | JavaScript |
| `@radix-ui/react-roving-focus` | 1.2.1 | MIT | Copyright (c) 2022 WorkOS | JavaScript |
| `@radix-ui/react-select` | 2.4.1 | MIT | Copyright (c) 2022 WorkOS | JavaScript |
| `@radix-ui/react-separator` | 1.2.0 | MIT | Copyright (c) 2022 WorkOS | JavaScript |
| `@radix-ui/react-slot` | 1.5.0 | MIT | Copyright (c) 2022 WorkOS | JavaScript |
| `@radix-ui/react-switch` | 1.4.1 | MIT | Copyright (c) 2022 WorkOS | JavaScript |
| `@radix-ui/react-tabs` | 1.2.1 | MIT | Copyright (c) 2022 WorkOS | JavaScript |
| `@radix-ui/react-use-callback-ref` | 1.1.5 | MIT | Copyright (c) 2022 WorkOS | JavaScript |
| `@radix-ui/react-use-controllable-state` | 1.3.0 | MIT | Copyright (c) 2022 WorkOS | JavaScript |
| `@radix-ui/react-use-effect-event` | 0.0.5 | MIT | Copyright (c) 2022 WorkOS | JavaScript |
| `@radix-ui/react-use-is-hydrated` | 0.1.3 | MIT | Copyright (c) 2022 WorkOS | JavaScript |
| `@radix-ui/react-use-layout-effect` | 1.1.4 | MIT | Copyright (c) 2022 WorkOS | JavaScript |
| `@radix-ui/react-use-size` | 1.1.5 | MIT | Copyright (c) 2022 WorkOS | JavaScript |
| `@radix-ui/react-visually-hidden` | 1.2.13 | MIT | Copyright (c) 2022 WorkOS | JavaScript |
| `react` | 19.3.1 | MIT | Copyright (c) Meta Platforms, Inc. and affiliates. | JavaScript |
| `react-dom` | 19.3.1 | MIT | Copyright (c) Meta Platforms, Inc. and affiliates. | JavaScript |
| `react-remove-scroll` | 2.7.2 | MIT | Copyright (c) 2017 Anton Korzunov | JavaScript |
| `react-remove-scroll-bar` | 2.3.8 | MIT | None in the package | JavaScript |
| `react-style-singleton` | 2.2.3 | MIT | Copyright (c) 2017 Anton Korzunov | JavaScript |
| `rolldown` | 1.2.19 | MIT | Copyright (c) 2024-present VoidZero Inc. & Contributors | JavaScript: the bundler's runtime helpers. A dependency of Vite: the build tool writes this code into the page |
| `scheduler` | 0.28.0 | MIT | Copyright (c) Meta Platforms, Inc. and affiliates. | JavaScript |
| `tailwind-merge` | 3.7.0 | MIT | Copyright (c) 2021 Dany Castillo | JavaScript |
| `tailwindcss` | 4.3.5 | MIT | Copyright (c) Tailwind Labs, Inc. | CSS: preflight (base reset) and the generated utilities. A dev dependency: the build tool writes this code into the page |
| `tslib` | 2.9.1 | 0BSD | Copyright (c) Microsoft Corporation. | JavaScript |
| `tw-animate-css` | 1.4.0 | MIT | Copyright (c) 2025 Wombosvideo | CSS: the enter, exit, accordion and collapsible keyframes and their utilities |
| `use-callback-ref` | 1.3.3 | MIT | Copyright (c) 2017 Anton Korzunov | JavaScript |
| `use-sidecar` | 1.1.3 | MIT | Copyright (c) 2017 Anton Korzunov | JavaScript |
| `vite` | 8.3.8 | MIT | Copyright (c) 2019-present, VoidZero Inc. and Vite contributors | JavaScript: the module-preload polyfill. A dev dependency: the build tool writes this code into the page |

- Radix UI (`@radix-ui/*`, Radix Icons included) is by WorkOS; Base UI (`@base-ui-components/*`) by MUI; Motion
  (`framer-motion`, `motion-dom`, `motion-utils`) by Motion, formerly Framer; React, React DOM and `scheduler` by Meta.
- `class-variance-authority` is Apache-2.0: its full license text travels with every copy (section 6). It ships no
  NOTICE file.
- `react-remove-scroll-bar` ships no license file. Its `package.json` and README declare MIT and name Anton Korzunov
  as its author; section 6 gives the MIT terms with no copyright line, because the package states none.
- `clsx`: its own license file also gives the author's e-mail address after his name; it is left out here.
- `vite`: only the first section of its LICENSE.md ("Vite core license") applies here; the rest covers code bundled into Vite's Node tooling, which the page does not embed.

## 2. Packages npm lists that the build does not embed

`npm ls --omit=dev --all` also lists these. No code of theirs is in the built page, so they need no notice there.

| Package | Version | Why it is not in the build |
|---|---|---|
| `@babel/runtime` | 7.29.14 | Not in the build's module graph: none of the Base UI code the app uses imports it |
| `csstype` | 3.2.4 | Type declarations only |
| `detect-node-es` | 1.1.0 | Imported by use-sidecar, then removed by tree-shaking: no code reaches the build |
| `@emnapi/wasi-threads` | 2.2.0 | Extraneous (npm ls flags it); not in the build's module graph |
| `motion` | 14.14.0 | Imported as `motion/react`, which only re-exports framer-motion, so the code in the build is framer-motion's, motion-dom's and motion-utils' (section 1); same authors, MIT |
| `@radix-ui/react-arrow` | 1.1.17 | Imported by @radix-ui/react-popper, then removed by tree-shaking: no code reaches the build |
| `@radix-ui/react-use-rect` | 1.1.4 | Not in the build's module graph |
| `@radix-ui/rect` | 1.1.3 | Not in the build's module graph |
| `remix` | not installed | An optional peer dependency of Motion; not installed |
| `reselect` | 5.3.0 | Not in the build's module graph: none of the Base UI code the app uses imports it |
| `tabbable` | 6.5.2 | Not in the build's module graph: none of the Base UI code the app uses imports it |
| `@types/react` | 19.3.0 | Type declarations only |
| `@types/react-dom` | 19.3.0 | Type declarations only |
| `use-sync-external-store` | 1.7.0 | Not in the build's module graph: none of the Base UI code the app uses imports it |

## 3. 21st.dev assets

Every visual element of WGU Study Buddy comes from 21st.dev, brought in with each page's **Copy prompt → Claude
Code** option. The prompts are kept word for word in `21st/prompts/`, with author, license and a sha256 checksum in
`21st/manifest/`, and every change to their code is logged in `21st/INTEGRATION.md`. Licenses are as each 21st.dev
page lists them; "not listed" means the page shows no license, and no license is assumed for those assets.

Each asset keeps its author's name, page and license. A file in `src/components/ui/` that was changed keeps its
original credit and adds "Modified by Dorian Acosta for WGU Study Buddy (MIT)"; that MIT grant covers his changes
only, never the original. An asset listed as MIT is copyright its author as named here and on its page, and is used
under the MIT terms in section 6. The `@magicui` and `@aceternity` pages redirect to the authors' `@dillionverma` and
`@manuarora700` pages.

### The ASCII language

| Asset | Author | 21st.dev page | License | App file (`src/components/ui/`) |
|---|---|---|---|---|
| trippin spiral (ASCII effect, Canvas2D recipe) | jobsrip, as the recipe page shows it (recorded in `21st/reference/ascii-trippin-spiral.md`) | https://21st.dev/community/ascii/trippin-spiral-fa23bfd9-dad9-49f9-be46-6f4ce2e61c29, a recipe of the 21st.dev ASCII tool (https://21st.dev/community/ascii) | license not listed; permission pending (release blocker) | `trippin-spiral.tsx` |
| Decrypt Text | rmahammad (Mehi), Motiq library | https://21st.dev/@rmahammad/components/decrypt-text | MIT | `decrypt-text.tsx` |
| Scramble Link Button | hyperiux (Hyperiux Vault) | https://21st.dev/@hyperiux/components/scramble-link-button | MIT | `scramble-link-button.tsx` |
| Corner Frame | kevingirelli (Kevin Girelli), corsair-ui | https://21st.dev/@kevingirelli/components/corner-frame | MIT, Copyright (c) 2026 Kevin Girelli | `corner-frame.tsx` |
| Terminal | thegridcn (The Gridcn library) | https://21st.dev/@thegridcn/components/terminal | MIT | `terminal.tsx` |
| Tree Box Drawing | nikolas-sapa (Nikolas Sapalidis), @ns-ui library | https://21st.dev/@nikolas-sapa/components/tree-box-drawing | MIT, Copyright (c) 2026 Nikolas Sapalidis | `tree-box-drawing.tsx` |
| Conveyor Loop | loading-ui (loading-ui.com) | https://21st.dev/@loading-ui/components/conveyor-loop | MIT | `conveyor-loop.tsx` (the loading state while a study guide is fetched, `src/views/course/GuideGate.tsx`) |

### Components the app restyles or keeps

| Component | Author | 21st.dev page | License | App file (`src/components/ui/`) |
|---|---|---|---|---|
| Accordion | shadcn | https://21st.dev/@shadcn/components/accordion | MIT | `accordion.tsx` |
| Alert | shadcn | https://21st.dev/@shadcn/components/alert | MIT | `alert.tsx` |
| Alert Dialog | shadcn | https://21st.dev/@shadcn/components/alert-dialog | MIT | `alert-dialog.tsx` |
| Button | shadcn | https://21st.dev/@shadcn/components/button | MIT | `button.tsx` |
| Card | shadcn | https://21st.dev/@shadcn/components/card | MIT | `card.tsx` |
| Checkbox | shadcn | https://21st.dev/@shadcn/components/checkbox | MIT | `checkbox.tsx` |
| Collapsible | shadcn | https://21st.dev/@shadcn/components/collapsible | MIT | `collapsible.tsx` |
| Kbd (its prompt also brings the Input) | shadcn | https://21st.dev/@shadcn/components/kbd | license not listed; permission pending (release blocker) | `kbd.tsx`, `input.tsx` |
| Label | shadcn | https://21st.dev/@shadcn/components/label | MIT | `label.tsx` |
| Progress | shadcn | https://21st.dev/@shadcn/components/progress | MIT | `progress.tsx` |
| Radio Group | shadcn | https://21st.dev/@shadcn/components/radio-group | MIT | `radio-group.tsx` |
| Select | shadcn | https://21st.dev/@shadcn/components/select | MIT | `select.tsx` |
| Separator | shadcn | https://21st.dev/@shadcn/components/separator | MIT | `separator.tsx` |
| Switch | shadcn | https://21st.dev/@shadcn/components/switch | MIT | `switch.tsx` |
| Table | shadcn | https://21st.dev/@shadcn/components/table | MIT | `table.tsx` |
| Tabs | shadcn | https://21st.dev/@shadcn/components/tabs | MIT | `tabs.tsx` |
| Base Badge (ReUI; stands in for shadcn Badge) | sean0205 | https://21st.dev/@sean0205/components/base-badge | MIT | `base-badge.tsx` |
| Animated Circular Progress Bar | Magic UI (dillionverma) | https://21st.dev/@magicui/components/animated-circular-progress-bar | MIT | `animated-circular-progress-bar.tsx` |
| Bento Grid | Magic UI (dillionverma) | https://21st.dev/@magicui/components/bento-grid | MIT | `bento-grid.tsx` |
| Blur Fade | Magic UI (dillionverma) | https://21st.dev/@magicui/components/blur-fade | MIT | `blur-fade.tsx` |
| Number Ticker | Magic UI (dillionverma) | https://21st.dev/@magicui/components/number-ticker | MIT | `number-ticker.tsx` |
| Timeline | Aceternity UI (manuarora700) | https://21st.dev/@aceternity/components/timeline | MIT | `timeline.tsx` |
| Stats (stats-info) | meschacirung | https://21st.dev/@meschacirung/components/stats/stats-info | license not listed; permission pending (release blocker) | `stats.tsx` |
| Empty State | serafimcloud | https://21st.dev/@serafimcloud/components/empty-state | MIT | `empty-state.tsx` |
| Question Tool (multiple-choice), with its inline `IconQuestion` | serafimcloud | https://21st.dev/@serafimcloud/components/question-tool/multiple-choice | MIT | `question-tool.tsx`; its class strings also style `src/components/question.tsx` |
| Footer with Big Wordmark | vilqor | https://21st.dev/@vilqor/components/wordmark-footer | MIT | `wordmark-footer.tsx` |
| Tubelight Navbar | ayushmxxn | https://21st.dev/@ayushmxxn/components/tubelight-navbar | MIT | `tubelight-navbar.tsx` |
| Dot Text | jahed | https://21st.dev/@jahed/components/dot-text | MIT | `dot-text.tsx` |

### Retired, collected or not collected (no code in the app)

These keep their prompts and manifests in `21st/` for the record.

| Component | Author | 21st.dev page | License | Status |
|---|---|---|---|---|
| Border Beam | Magic UI (dillionverma) | https://21st.dev/@magicui/components/border-beam | MIT | Retired (replaced by Corner Frame) |
| Dot Pattern | Magic UI (dillionverma) | https://21st.dev/@magicui/components/dot-pattern | MIT | Retired (replaced by the field) |
| Glowing Effect | Aceternity UI (manuarora700) | https://21st.dev/@aceternity/components/glowing-effect | MIT | Retired (replaced by Corner Frame target frames) |
| Glyph Matrix | dillionverma | https://21st.dev/@dillionverma/components/glyph-matrix | MIT | Retired (replaced by the field) |
| Hero Minimalism | lyanchouss | https://21st.dev/@lyanchouss/components/hero-minimalism | license not listed; permission pending (release blocker for the saved prompt in `21st/`) | Retired (replaced by the Home hero window) |
| Liquid Metal Button | johuniq | https://21st.dev/@johuniq/components/liquid-metal-button | MIT | Retired (replaced by Scramble Link Button and Button) |
| Dialog | shadcn | https://21st.dev/@shadcn/components/dialog | MIT | Collected, not used |
| Slider | shadcn | https://21st.dev/@shadcn/components/slider | MIT | Collected, not used |
| Tooltip | shadcn | https://21st.dev/@shadcn/components/tooltip | MIT | Collected, not used |
| Badge | shadcn | https://21st.dev/@shadcn/components/badge | n/a | Not collected: the page renders a 404; Base Badge stands in |

The colors come from the WGU Study Buddy theme in `21st/theme/wgu-study-buddy-theme.css`, Dorian Acosta's own work.
Paper Shaders (Apache-2.0) left the app with the Liquid Metal Button.

## 4. shadcn/ui

The shadcn components in section 3 (Accordion, Alert, Alert Dialog, Button, Card, Checkbox, Collapsible, Kbd and
its Input, Label, Progress, Radio Group, Select, Separator, Switch, Table, Tabs) and the project setup in
`components.json` come from shadcn/ui by shadcn, https://ui.shadcn.com (source: https://github.com/shadcn-ui/ui).
shadcn/ui is released under the MIT License; its 21st.dev pages list MIT for each component above except Kbd,
whose page lists no license (section 3).

```text
MIT License

Copyright (c) 2023 shadcn

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 5. Fonts: Geist and Geist Mono

Geist (Geist Variable) and Geist Mono (Geist Mono Variable, and its symbols subset loaded as Geist Mono Symbols) are
by The Geist Project Authors (Vercel), https://github.com/vercel/geist-font, packaged by Fontsource as
`@fontsource-variable/geist` 5.3.0 and `@fontsource-variable/geist-mono` 5.3.0. The build embeds three of their font
files as base64: `geist-latin-wght-normal.woff2`, `geist-mono-latin-wght-normal.woff2` and
`geist-mono-symbols2-wght-normal.woff2`. They are licensed under the SIL Open Font License, Version 1.1. The full
license file of each package follows.

### `@fontsource-variable/geist` 5.3.0

From `node_modules/@fontsource-variable/geist/LICENSE`:

```text
Copyright 2024 The Geist Project Authors (https://github.com/vercel/geist-font) Geist-Italic[wght].ttf: Copyright 2024 The Geist Project Authors (https://github.com/vercel/geist-font)

This Font Software is licensed under the SIL Open Font License, Version 1.1.
This license is copied below, and is also available with a FAQ at:
http://scripts.sil.org/OFL


-----------------------------------------------------------
SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007
-----------------------------------------------------------

PREAMBLE
The goals of the Open Font License (OFL) are to stimulate worldwide
development of collaborative font projects, to support the font creation
efforts of academic and linguistic communities, and to provide a free and
open framework in which fonts may be shared and improved in partnership
with others.

The OFL allows the licensed fonts to be used, studied, modified and
redistributed freely as long as they are not sold by themselves. The
fonts, including any derivative works, can be bundled, embedded,
redistributed and/or sold with any software provided that any reserved
names are not used by derivative works. The fonts and derivatives,
however, cannot be released under any other type of license. The
requirement for fonts to remain under this license does not apply
to any document created using the fonts or their derivatives.

DEFINITIONS
"Font Software" refers to the set of files released by the Copyright
Holder(s) under this license and clearly marked as such. This may
include source files, build scripts and documentation.

"Reserved Font Name" refers to any names specified as such after the
copyright statement(s).

"Original Version" refers to the collection of Font Software components as
distributed by the Copyright Holder(s).

"Modified Version" refers to any derivative made by adding to, deleting,
or substituting -- in part or in whole -- any of the components of the
Original Version, by changing formats or by porting the Font Software to a
new environment.

"Author" refers to any designer, engineer, programmer, technical
writer or other person who contributed to the Font Software.

PERMISSION & CONDITIONS
Permission is hereby granted, free of charge, to any person obtaining
a copy of the Font Software, to use, study, copy, merge, embed, modify,
redistribute, and sell modified and unmodified copies of the Font
Software, subject to the following conditions:

1) Neither the Font Software nor any of its individual components,
in Original or Modified Versions, may be sold by itself.

2) Original or Modified Versions of the Font Software may be bundled,
redistributed and/or sold with any software, provided that each copy
contains the above copyright notice and this license. These can be
included either as stand-alone text files, human-readable headers or
in the appropriate machine-readable metadata fields within text or
binary files as long as those fields can be easily viewed by the user.

3) No Modified Version of the Font Software may use the Reserved Font
Name(s) unless explicit written permission is granted by the corresponding
Copyright Holder. This restriction only applies to the primary font name as
presented to the users.

4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font
Software shall not be used to promote, endorse or advertise any
Modified Version, except to acknowledge the contribution(s) of the
Copyright Holder(s) and the Author(s) or with their explicit written
permission.

5) The Font Software, modified or unmodified, in part or in whole,
must be distributed entirely under this license, and must not be
distributed under any other license. The requirement for fonts to
remain under this license does not apply to any document created
using the Font Software.

TERMINATION
This license becomes null and void if any of the above conditions are
not met.

DISCLAIMER
THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT
OF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE
COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
INCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL
DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM
OTHER DEALINGS IN THE FONT SOFTWARE.
```

### `@fontsource-variable/geist-mono` 5.3.0

From `node_modules/@fontsource-variable/geist-mono/LICENSE`:

```text
Copyright 2024 The Geist Project Authors (https://github.com/vercel/geist-font.git) GeistMono-Italic[wght].ttf: Copyright 2024 The Geist Project Authors (https://github.com/vercel/geist-font.git)

This Font Software is licensed under the SIL Open Font License, Version 1.1.
This license is copied below, and is also available with a FAQ at:
http://scripts.sil.org/OFL


-----------------------------------------------------------
SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007
-----------------------------------------------------------

PREAMBLE
The goals of the Open Font License (OFL) are to stimulate worldwide
development of collaborative font projects, to support the font creation
efforts of academic and linguistic communities, and to provide a free and
open framework in which fonts may be shared and improved in partnership
with others.

The OFL allows the licensed fonts to be used, studied, modified and
redistributed freely as long as they are not sold by themselves. The
fonts, including any derivative works, can be bundled, embedded,
redistributed and/or sold with any software provided that any reserved
names are not used by derivative works. The fonts and derivatives,
however, cannot be released under any other type of license. The
requirement for fonts to remain under this license does not apply
to any document created using the fonts or their derivatives.

DEFINITIONS
"Font Software" refers to the set of files released by the Copyright
Holder(s) under this license and clearly marked as such. This may
include source files, build scripts and documentation.

"Reserved Font Name" refers to any names specified as such after the
copyright statement(s).

"Original Version" refers to the collection of Font Software components as
distributed by the Copyright Holder(s).

"Modified Version" refers to any derivative made by adding to, deleting,
or substituting -- in part or in whole -- any of the components of the
Original Version, by changing formats or by porting the Font Software to a
new environment.

"Author" refers to any designer, engineer, programmer, technical
writer or other person who contributed to the Font Software.

PERMISSION & CONDITIONS
Permission is hereby granted, free of charge, to any person obtaining
a copy of the Font Software, to use, study, copy, merge, embed, modify,
redistribute, and sell modified and unmodified copies of the Font
Software, subject to the following conditions:

1) Neither the Font Software nor any of its individual components,
in Original or Modified Versions, may be sold by itself.

2) Original or Modified Versions of the Font Software may be bundled,
redistributed and/or sold with any software, provided that each copy
contains the above copyright notice and this license. These can be
included either as stand-alone text files, human-readable headers or
in the appropriate machine-readable metadata fields within text or
binary files as long as those fields can be easily viewed by the user.

3) No Modified Version of the Font Software may use the Reserved Font
Name(s) unless explicit written permission is granted by the corresponding
Copyright Holder. This restriction only applies to the primary font name as
presented to the users.

4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font
Software shall not be used to promote, endorse or advertise any
Modified Version, except to acknowledge the contribution(s) of the
Copyright Holder(s) and the Author(s) or with their explicit written
permission.

5) The Font Software, modified or unmodified, in part or in whole,
must be distributed entirely under this license, and must not be
distributed under any other license. The requirement for fonts to
remain under this license does not apply to any document created
using the Font Software.

TERMINATION
This license becomes null and void if any of the above conditions are
not met.

DISCLAIMER
THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT
OF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE
COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
INCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL
DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM
OTHER DEALINGS IN THE FONT SOFTWARE.
```

## 6. License texts

Each package's own license file, word for word, grouped where several packages ship the same text. The fonts' texts
are in section 5.

### `aria-hidden` 1.2.6, `react-remove-scroll` 2.7.2, `react-style-singleton` 2.2.3, `use-callback-ref` 1.3.3, `use-sidecar` 1.1.3

The same text in each package's `LICENSE` file:

```text
MIT License

Copyright (c) 2017 Anton Korzunov

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### `@base-ui-components/react` 1.0.0-rc.0, `@base-ui-components/utils` 0.2.2

The same text in each package's `LICENSE` file:

```text
The MIT License (MIT)

Copyright (c) 2019 Material-UI SAS

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### `class-variance-authority` 0.7.1

From `node_modules/class-variance-authority/LICENSE`:

```text
                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.

      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.

      "Licensor" shall mean the copyright owner or entity authorized by
      the copyright owner that is granting the License.

      "Legal Entity" shall mean the union of the acting entity and all
      other entities that control, are controlled by, or are under common
      control with that entity. For the purposes of this definition,
      "control" means (i) the power, direct or indirect, to cause the
      direction or management of such entity, whether by contract or
      otherwise, or (ii) ownership of fifty percent (50%) or more of the
      outstanding shares, or (iii) beneficial ownership of such entity.

      "You" (or "Your") shall mean an individual or Legal Entity
      exercising permissions granted by this License.

      "Source" form shall mean the preferred form for making modifications,
      including but not limited to software source code, documentation
      source, and configuration files.

      "Object" form shall mean any form resulting from mechanical
      transformation or translation of a Source form, including but
      not limited to compiled object code, generated documentation,
      and conversions to other media types.

      "Work" shall mean the work of authorship, whether in Source or
      Object form, made available under the License, as indicated by a
      copyright notice that is included in or attached to the work
      (an example is provided in the Appendix below).

      "Derivative Works" shall mean any work, whether in Source or Object
      form, that is based on (or derived from) the Work and for which the
      editorial revisions, annotations, elaborations, or other modifications
      represent, as a whole, an original work of authorship. For the purposes
      of this License, Derivative Works shall not include works that remain
      separable from, or merely link (or bind by name) to the interfaces of,
      the Work and Derivative Works thereof.

      "Contribution" shall mean any work of authorship, including
      the original version of the Work and any modifications or additions
      to that Work or Derivative Works thereof, that is intentionally
      submitted to Licensor for inclusion in the Work by the copyright owner
      or by an individual or Legal Entity authorized to submit on behalf of
      the copyright owner. For the purposes of this definition, "submitted"
      means any form of electronic, verbal, or written communication sent
      to the Licensor or its representatives, including but not limited to
      communication on electronic mailing lists, source code control systems,
      and issue tracking systems that are managed by, or on behalf of, the
      Licensor for the purpose of discussing and improving the Work, but
      excluding communication that is conspicuously marked or otherwise
      designated in writing by the copyright owner as "Not a Contribution."

      "Contributor" shall mean Licensor and any individual or Legal Entity
      on behalf of whom a Contribution has been received by Licensor and
      subsequently incorporated within the Work.

   2. Grant of Copyright License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      copyright license to reproduce, prepare Derivative Works of,
      publicly display, publicly perform, sublicense, and distribute the
      Work and such Derivative Works in Source or Object form.

   3. Grant of Patent License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      (except as stated in this section) patent license to make, have made,
      use, offer to sell, sell, import, and otherwise transfer the Work,
      where such license applies only to those patent claims licensable
      by such Contributor that are necessarily infringed by their
      Contribution(s) alone or by combination of their Contribution(s)
      with the Work to which such Contribution(s) was submitted. If You
      institute patent litigation against any entity (including a
      cross-claim or counterclaim in a lawsuit) alleging that the Work
      or a Contribution incorporated within the Work constitutes direct
      or contributory patent infringement, then any patent licenses
      granted to You under this License for that Work shall terminate
      as of the date such litigation is filed.

   4. Redistribution. You may reproduce and distribute copies of the
      Work or Derivative Works thereof in any medium, with or without
      modifications, and in Source or Object form, provided that You
      meet the following conditions:

      (a) You must give any other recipients of the Work or
          Derivative Works a copy of this License; and

      (b) You must cause any modified files to carry prominent notices
          stating that You changed the files; and

      (c) You must retain, in the Source form of any Derivative Works
          that You distribute, all copyright, patent, trademark, and
          attribution notices from the Source form of the Work,
          excluding those notices that do not pertain to any part of
          the Derivative Works; and

      (d) If the Work includes a "NOTICE" text file as part of its
          distribution, then any Derivative Works that You distribute must
          include a readable copy of the attribution notices contained
          within such NOTICE file, excluding those notices that do not
          pertain to any part of the Derivative Works, in at least one
          of the following places: within a NOTICE text file distributed
          as part of the Derivative Works; within the Source form or
          documentation, if provided along with the Derivative Works; or,
          within a display generated by the Derivative Works, if and
          wherever such third-party notices normally appear. The contents
          of the NOTICE file are for informational purposes only and
          do not modify the License. You may add Your own attribution
          notices within Derivative Works that You distribute, alongside
          or as an addendum to the NOTICE text from the Work, provided
          that such additional attribution notices cannot be construed
          as modifying the License.

      You may add Your own copyright statement to Your modifications and
      may provide additional or different license terms and conditions
      for use, reproduction, or distribution of Your modifications, or
      for any such Derivative Works as a whole, provided Your use,
      reproduction, and distribution of the Work otherwise complies with
      the conditions stated in this License.

   5. Submission of Contributions. Unless You explicitly state otherwise,
      any Contribution intentionally submitted for inclusion in the Work
      by You to the Licensor shall be under the terms and conditions of
      this License, without any additional terms or conditions.
      Notwithstanding the above, nothing herein shall supersede or modify
      the terms of any separate license agreement you may have executed
      with Licensor regarding such Contributions.

   6. Trademarks. This License does not grant permission to use the trade
      names, trademarks, service marks, or product names of the Licensor,
      except as required for reasonable and customary use in describing the
      origin of the Work and reproducing the content of the NOTICE file.

   7. Disclaimer of Warranty. Unless required by applicable law or
      agreed to in writing, Licensor provides the Work (and each
      Contributor provides its Contributions) on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
      implied, including, without limitation, any warranties or conditions
      of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
      PARTICULAR PURPOSE. You are solely responsible for determining the
      appropriateness of using or redistributing the Work and assume any
      risks associated with Your exercise of permissions under this License.

   8. Limitation of Liability. In no event and under no legal theory,
      whether in tort (including negligence), contract, or otherwise,
      unless required by applicable law (such as deliberate and grossly
      negligent acts) or agreed to in writing, shall any Contributor be
      liable to You for damages, including any direct, indirect, special,
      incidental, or consequential damages of any character arising as a
      result of this License or out of the use or inability to use the
      Work (including but not limited to damages for loss of goodwill,
      work stoppage, computer failure or malfunction, or any and all
      other commercial damages or losses), even if such Contributor
      has been advised of the possibility of such damages.

   9. Accepting Warranty or Additional Liability. While redistributing
      the Work or Derivative Works thereof, You may choose to offer,
      and charge a fee for, acceptance of support, warranty, indemnity,
      or other liability obligations and/or rights consistent with this
      License. However, in accepting such obligations, You may act only
      on Your own behalf and on Your sole responsibility, not on behalf
      of any other Contributor, and only if You agree to indemnify,
      defend, and hold each Contributor harmless for any liability
      incurred by, or claims asserted against, such Contributor by reason
      of your accepting any such warranty or additional liability.

   END OF TERMS AND CONDITIONS

   Copyright 2022 Joe Bell

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
```

### `clsx` 2.1.1

From `node_modules/clsx/license`:

```text
MIT License

Copyright (c) Luke Edwards (lukeed.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### `@floating-ui/*` (4 packages)

`@floating-ui/core` 1.8.0, `@floating-ui/dom` 1.8.0, `@floating-ui/react-dom` 2.1.9, `@floating-ui/utils` 0.2.12.

The same text in each package's `LICENSE` file:

```text
MIT License

Copyright (c) 2021-present Floating UI contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```

### `framer-motion` 14.14.0

From `node_modules/framer-motion/LICENSE.md`:

```text
The MIT License (MIT)

Copyright (c) 2018 Framer B.V.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### `get-nonce` 1.0.1

From `node_modules/get-nonce/LICENSE`:

```text
MIT License

Copyright (c) 2020 Anton Korzunov

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### `lucide-react` 1.76.0

From `node_modules/lucide-react/LICENSE`:

```text
ISC License

Copyright (c) 2026 Lucide Icons and Contributors

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.

---

The following Lucide icons are derived from the Feather project:

airplay, alert-circle, alert-octagon, alert-triangle, aperture, arrow-down-circle, arrow-down-left, arrow-down-right, arrow-down, arrow-left-circle, arrow-left, arrow-right-circle, arrow-right, arrow-up-circle, arrow-up-left, arrow-up-right, arrow-up, at-sign, calendar, cast, check, chevron-down, chevron-left, chevron-right, chevron-up, chevrons-down, chevrons-left, chevrons-right, chevrons-up, circle, clipboard, clock, code, columns, command, compass, corner-down-left, corner-down-right, corner-left-down, corner-left-up, corner-right-down, corner-right-up, corner-up-left, corner-up-right, crosshair, database, divide-circle, divide-square, dollar-sign, download, external-link, feather, frown, hash, headphones, help-circle, info, italic, key, layout, life-buoy, link-2, link, loader, lock, log-in, log-out, maximize, meh, minimize, minimize-2, minus-circle, minus-square, minus, monitor, moon, more-horizontal, more-vertical, move, music, navigation-2, navigation, octagon, pause-circle, percent, plus-circle, plus-square, plus, power, radio, rss, search, server, share, shopping-bag, sidebar, smartphone, smile, square, table-2, tablet, target, terminal, trash-2, trash, triangle, tv, type, upload, x-circle, x-octagon, x-square, x, zoom-in, zoom-out

The MIT License (MIT) (for the icons listed above)

Copyright (c) 2013-present Cole Bemis

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### `motion-dom` 14.14.0, `motion-utils` 14.7.0

The same text in each package's `LICENSE.md` file:

```text
The MIT License (MIT)

Copyright (c) 2024 [Motion](https://motion.dev) B.V.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### `@radix-ui/*` (36 packages)

`@radix-ui/number` 1.1.3, `@radix-ui/primitive` 1.2.0, `@radix-ui/react-accordion` 1.3.1, `@radix-ui/react-alert-dialog` 1.2.1, `@radix-ui/react-checkbox` 1.4.1, `@radix-ui/react-collapsible` 1.2.1, `@radix-ui/react-collection` 1.2.0, `@radix-ui/react-compose-refs` 1.1.5, `@radix-ui/react-context` 1.3.0, `@radix-ui/react-dialog` 1.3.1, `@radix-ui/react-direction` 1.2.0, `@radix-ui/react-dismissable-layer` 1.2.1, `@radix-ui/react-focus-guards` 1.2.0, `@radix-ui/react-focus-scope` 1.3.1, `@radix-ui/react-icons` 1.3.2, `@radix-ui/react-id` 1.1.4, `@radix-ui/react-label` 2.1.17, `@radix-ui/react-popper` 1.4.0, `@radix-ui/react-portal` 1.2.0, `@radix-ui/react-presence` 1.1.11, `@radix-ui/react-primitive` 2.2.0, `@radix-ui/react-progress` 1.2.1, `@radix-ui/react-radio-group` 1.5.1, `@radix-ui/react-roving-focus` 1.2.1, `@radix-ui/react-select` 2.4.1, `@radix-ui/react-separator` 1.2.0, `@radix-ui/react-slot` 1.5.0, `@radix-ui/react-switch` 1.4.1, `@radix-ui/react-tabs` 1.2.1, `@radix-ui/react-use-callback-ref` 1.1.5, `@radix-ui/react-use-controllable-state` 1.3.0, `@radix-ui/react-use-effect-event` 0.0.5, `@radix-ui/react-use-is-hydrated` 0.1.3, `@radix-ui/react-use-layout-effect` 1.1.4, `@radix-ui/react-use-size` 1.1.5, `@radix-ui/react-visually-hidden` 1.2.13.

The same text in each package's `LICENSE` file:

```text
MIT License

Copyright (c) 2022 WorkOS

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### `react` 19.3.1, `react-dom` 19.3.1, `scheduler` 0.28.0

The same text in each package's `LICENSE` file:

```text
MIT License

Copyright (c) Meta Platforms, Inc. and affiliates.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### `react-remove-scroll-bar` 2.3.8

No license file in the package. `package.json` and the README declare MIT, and `package.json` names Anton
Korzunov as the author. The MIT terms:

```text
MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### `rolldown` 1.2.19

From `node_modules/rolldown/LICENSE`:

```text
MIT License

Copyright (c) 2024-present VoidZero Inc. & Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

end of terms and conditions

The licenses of externally maintained libraries from which parts of the Software is derived are listed [here](https://github.com/rolldown/rolldown/blob/main/THIRD-PARTY-LICENSE).
```

### `tailwind-merge` 3.7.0

From `node_modules/tailwind-merge/LICENSE.md`:

```text
MIT License

Copyright (c) 2021 Dany Castillo

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### `tailwindcss` 4.3.5

From `node_modules/tailwindcss/LICENSE`:

```text
MIT License

Copyright (c) Tailwind Labs, Inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### `tslib` 2.9.1

From `node_modules/tslib/LICENSE.txt`:

```text
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
```

### `tw-animate-css` 1.4.0

From `node_modules/tw-animate-css/LICENSE`:

```text
MIT License

Copyright (c) 2025 Wombosvideo

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### `vite` 8.3.8

From `node_modules/vite/LICENSE.md`, its first section:

```text
# Vite core license
Vite is released under the MIT license:

MIT License

Copyright (c) 2019-present, VoidZero Inc. and Vite contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
