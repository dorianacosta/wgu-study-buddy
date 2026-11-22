# ASCII survey of 21st.dev for the WGU Study Buddy design language

Surveyed 2026-11-20 in a separate browser tab (desktop layout, 1280x800). Purpose: find the 21st.dev components and effects that let ASCII be the main design language of the app (character grid, monospace-led type, terminal and hexdump vocabulary), with the user's theme (`21st/theme/wgu-study-buddy-theme.css`: gold `--primary #e3af35` on near-black `--background #09090b`) supplying every color and the trippin-spiral ASCII recipe (`21st/prompts/ascii--trippin-spiral.md`) as the background.

Nothing was installed or integrated. Six prompts were saved word for word (section 3).

## 0. Method

- Search and category pages: `ascii`, `hacker`, `scramble`, `decrypt`, `glitch`, `glitch text`, `typewriter`, `matrix`, `hex`, `hexdump`, `monospace`, `retro`, `dither`, `pixel`, `loader`, `progress`, `spinner`, `terminal`, plus the "ASCII Art" category. Follow-up semantic searches: ascii progress bar, ascii border/frame/box drawing, ascii button, ascii card, ascii divider, ascii list/navigation, ascii loader, ascii empty state, ascii table, terminal stats, box-drawing characters, hexdump viewer, cli progress bar, unicode block progress, TUI, command palette, figlet banner, corner brackets/HUD, CRT/scanline card.
- License, dependencies, download counts and descriptions come from 21st.dev's own listing data. For the shortlisted components the Claude Code prompt was captured through the page's copy menu, with the page's clipboard write hooked so nothing reached the real clipboard, then read in full (imports, ARIA, reduced motion, canvas vs DOM text, Next.js APIs).
- Already in the app, so not duplicated: GlyphMatrix, Dot Text, Number Ticker, Border Beam, Glowing Effect, Liquid Metal Button, Hero Minimalism, Tubelight Navbar, Timeline, Bento Grid, Stats, Question Tool, Empty State, Wordmark Footer, Dot Pattern, Blur Fade, Animated Circular Progress Bar, Base Badge, the shadcn basics, and the trippin-spiral ASCII background.

## 1. The ASCII tool (https://21st.dev/community/ascii)

- **Gallery** (`/community/ascii`): community "ASCII art recipes". Tags: Retro 45, Animated 24, Pixel 22, Terminal 19, Colorful 18, Minimal 17, Monochrome 16, Neon 15, Glitch 14, Cyberpunk 12, CRT 12, Mosaic 12, Halftone 6. Recipes include HANZO Secure Shield Hex, HANZO CCTV Binary, HANZO Biometric Braille, matrix01/02, codeflower, c-block-art.
- **Editor** (`/community/ascii/editor`). Source: Photo, Video, Shader or Gradient. Shader presets: Silk, Smoke, Flow field, Waves, Aurora, Orb, Caustics, Mesh drift, Metaballs, Plasma, Warp stripes, Rings, Halftone, Mesh Gradient, Static Mesh Gradient, Static Radial Gradient, Paper Texture, Water, Image Dithering, Dithering, Dot Grid, Warp, Swirl, Perlin Noise, Simplex Noise, Liquid Metal, Gem Smoke, Fluted Glass, Halftone Dots, Halftone CMYK, Heatmap, Neuro Noise, Smoke Ring, God Rays, Pulsing Border, Color Panels, Voronoi, Dot Orbit, Spiral, Grain Gradient. Render styles: Characters, Braille, Mixed, Hex Dump, Matrix, Dots, Cross, Diamond, Rings, Hearts, Stars, Hexagons, Triangles, Bubbles, Lines, Diagonal, Hatching, Contour, Dither, Pixel Art, Mosaic, Bricks, Voxel, Half Blocks, Disco. Panels: Style, Adjust, Effects, Motion, Mask, Lights, Community. Toolbar: Export, Copy prompt, Save art, Inspire, Restyle.
- The editor opened on the user's own trippin-spiral settings (Rings shader, Hex Dump, 8px cells, Color Dodge). I changed nothing in it.
- **Not picked again.** The tool's "Copy prompt" gives a Canvas2D recipe: pixels only, with no DOM text. It fills the background role, which the trippin spiral already covers. Its many published outputs on 21st.dev are looping MP4 videos (see section 2.8).

## 2. Every candidate surveyed

URLs are `https://21st.dev/@<author>/components/<slug>`. "No license" means the listing gives none or says no-license.

### 2.1 Page and hero titles, section labels (text decode / scramble / typewriter)

| Component | One line | License, deps | Verdict |
|---|---|---|---|
| [rmahammad/decrypt-text](https://21st.dev/@rmahammad/components/decrypt-text) | Text resolves out of scrambled glyphs left to right; `display` and `terminal` variants | MIT; clsx, tailwind-merge | **Picked** (3.1) |
| [kevingirelli/scramble-text](https://21st.dev/@kevingirelli/components/scramble-text) | Decodes from noise characters left to right, hacker-style | MIT; none | Not picked: same job as Decrypt Text, which also documents sr-only text, reduced motion and a terminal variant |
| [dqnamo/scramble-text](https://21st.dev/@dqnamo/components/scramble-text) | Masks content with "encrypted" characters, reveals one by one | MIT; none | Not picked: same job |
| [ibelick/text-scramble](https://21st.dev/@ibelick/components/text-scramble) | Cycles random characters before settling (520 downloads) | MIT; framer-motion | Not picked: same job, no terminal variant |
| [dillionverma/hyper-text](https://21st.dev/@dillionverma/components/hyper-text) | Magic UI hover scramble | MIT; framer-motion | Not picked: same job |
| [manuarora700/encrypted-text](https://21st.dev/@manuarora700/components/encrypted-text) | Gibberish that decrypts when scrolled into view | MIT; motion | Not picked: same job |
| [cnippet-dev/text-scramble](https://21st.dev/@cnippet-dev/components/text-scramble) | Cipher-decoding scramble | MIT; motion | Not picked: same job |
| [tom_ui/special-text](https://21st.dev/@tom_ui/components/special-text) | Scramble text | MIT; motion | Not picked: same job |
| [motiondotdev/motion-scramble-text](https://21st.dev/@motiondotdev/components/motion-scramble-text) (and `-hover`) | Official Motion scramble examples | MIT; none or motion | Not picked: same job |
| [pacekit/scramble-text](https://21st.dev/@pacekit/components/scramble-text) | Hover scramble | MIT; gsap, @gsap/react | Not picked: adds GSAP |
| [soralabs/text-scramble](https://21st.dev/@soralabs/components/text-scramble) | Scramble on mount, retrigger or hover | MIT + Commons Clause; motion | Not picked: restricted license |
| [soralabs/typer](https://21st.dev/@soralabs/components/typer) | Character-by-character reveal with flicker | MIT; none | Not picked: overlaps Decrypt Text |
| [hyperiux/glowing-text](https://21st.dev/@hyperiux/components/glowing-text) | Terminal typewriter where each character ignites in a glow | MIT; none | Not picked: overlaps; the glow fights the flat gold look |
| [hyperiux/typing-text](https://21st.dev/@hyperiux/components/typing-text) | Multi-line terminal typewriter | MIT; none | Not picked: the Terminal pick covers multi-line output |
| [danielpetho/typewriter](https://21st.dev/@danielpetho/components/typewriter), [preetsuthar17/typewriter-text](https://21st.dev/@preetsuthar17/components/typewriter-text), [dillionverma/typing-animation](https://21st.dev/@dillionverma/components/typing-animation), [manuarora700/typewriter-effect](https://21st.dev/@manuarora700/components/typewriter-effect) | Popular typewriters | MIT; framer-motion or none | Not picked: typing hides text until typed; decode keeps the line's length and layout from frame one |
| [kokonutd/matrix-text](https://21st.dev/@kokonutd/components/matrix-text) | Matrix-rain letters into text | MIT; motion | Not picked: the Matrix look is already GlyphMatrix and the background |
| [wensity/text-glitch](https://21st.dev/@wensity/components/text-glitch), [kokonutd/glitch-text](https://21st.dev/@kokonutd/components/glitch-text), [anurag-mishra22/animated-glitch-text](https://21st.dev/@anurag-mishra22/components/animated-glitch-text), [elements-/loader-glitch-text](https://21st.dev/@elements-/components/loader-glitch-text) | Glitch text (RGB channel split, clip slices) | MIT | Not picked: RGB split brings colors outside the gold and near-black theme; glitch is not ASCII |
| jatin-yadav05/text-scramble, rahil1202/text-scrammble, hamidonsol/text-scramble, deltacomponents/scramble-text, xubohuah/text-glitch-effect, arunachalam/corner-frame-scramble-text | Assorted scramble effects | No license (deltacomponents also uses use-scramble) | Not picked: no license |
| harshjadhavconnect/hyper-text, shadcnspace/animated-text-09 (Text Decoder) | Scramble / decoder | No license | Not picked: no license |

### 2.2 Loaders and progress

| Component | One line | License, deps | Verdict |
|---|---|---|---|
| [loading-ui/conveyor-loop](https://21st.dev/@loading-ui/components/conveyor-loop) | `█▓▒` blocks travel along a `░` track in a monospace cell row | MIT; none | **Picked** (3.2) |
| [elements-/loader-cli-spinner](https://21st.dev/@elements-/components/loader-cli-spinner) | 90 ASCII and braille CLI spinners | MIT; none | **Captured, then skipped**: the copied prompt imports `@/components/ui/loader-cli-spinner-utils/cli-spinner-data` (all 90 frame sets) but doesn't include that file, so Claude Code can't build it from the prompt |
| [loading-ui/square-snake](https://21st.dev/@loading-ui/components/square-snake), [infinity-track](https://21st.dev/@loading-ui/components/infinity-track), [infinity-square-snake](https://21st.dev/@loading-ui/components/infinity-square-snake), [symmetric-wave](https://21st.dev/@loading-ui/components/symmetric-wave), [square-accordion](https://21st.dev/@loading-ui/components/square-accordion) | Same family as Conveyor Loop: shaded block glyph spinners | MIT; none | Not picked: spinner shapes; Conveyor Loop also reads as a progress track |
| [loading-ui/accordion-loader](https://21st.dev/@loading-ui/components/accordion-loader) | Block glyphs slide like an accordion | No license | Not picked: no license |
| [elements-/loader-terminal-decode](https://21st.dev/@elements-/components/loader-terminal-decode) | Symbol, binary or hex characters resolve into text | No license | Not picked: no license |
| [saurabh-2607/great-ui-terminal-loader](https://21st.dev/@saurabh-2607/components/great-ui-terminal-loader) | Monospace block loader with density particles | MIT; none | Not picked: Conveyor Loop is smaller and simpler |
| [my/loader](https://21st.dev/@my/components/loader), [starc007/loader](https://21st.dev/@starc007/components/loader) | Multi-variant loaders (a few ASCII variants among many) | MIT; motion | Not picked: large multi-variant files for one variant |
| [scrollxui/modern-loader](https://21st.dev/@scrollxui/components/modern-loader) | Full fake-terminal loading screen | MIT; motion | Not picked: too big for inline loading |
| theorcdev/8bit-progress, 8bit-loading-screen, 8bit-spinner (8bitcn) | Pixel-art progress and spinners | MIT | Not picked: pixel art with a Press Start 2P font, not ASCII |
| zzzzshawn/dotm-* | Dot-matrix loaders | No license or custom proprietary | Not picked: license |
| (determinate ASCII bar like `[#####.....]`) | none found on 21st.dev | n/a | The shadcn Progress the app already has stays the determinate bar |

### 2.3 Code blocks and terminal output

| Component | One line | License, deps | Verdict |
|---|---|---|---|
| [thegridcn/terminal](https://21st.dev/@thegridcn/components/terminal) | Panel that types `lines` of type input `>`, system `::`, error `!` and output; HUD corner brackets | MIT; none | **Picked** (3.3) |
| [dillionverma/terminal](https://21st.dev/@dillionverma/components/terminal) | Magic UI fake terminal (TypingAnimation, AnimatedSpan) | MIT; motion | Runner-up, prompt captured for comparison but not saved: macOS traffic-light dots, no reduced-motion path, and its children API is less data-friendly than `lines` |
| [ziegfiroyt/terminal1](https://21st.dev/@ziegfiroyt/components/terminal1) | Terminal typewriter window | MIT; lucide-react | Not picked: macOS-window styling |
| [support_596fe4b8/terminal](https://21st.dev/@support_596fe4b8/components/terminal) | macOS terminal with optional keyboard sounds | MIT; framer-motion | Not picked: sounds and chrome |
| [aadixc0de/ansi-output](https://21st.dev/@aadixc0de/components/ansi-output), [aadixc0de/terminal](https://21st.dev/@aadixc0de/components/terminal) | Real ANSI-colored test output | MIT; none or @base-ui/react | Not picked: ANSI colors break the monochrome theme |
| [theorcdev/8bit-advanced1](https://21st.dev/@theorcdev/components/8bit-advanced1) | 8-bit demo shell | MIT; cva, tw-animate-css | Not picked: pixel font |
| [f0rextasy/console-panel](https://21st.dev/@f0rextasy/components/console-panel) | Interactive console with a command input | MIT; none | Not picked: the app has no commands to run |
| serafimcloud/bash-tool, aadixc0de/tool-bash | AI-agent tool cards | MIT | Not picked: not a study-app need |
| shugar/snippet, haydenbleasel/snippet, dillionverma/script-copy-button | Copyable command snippets | MPL-2.0 or MIT; shiki for the last | Not picked: copy-to-clipboard UI, not ASCII; shiki is heavy |
| dhileepkumargm/terminal-bento-grid, thegridcn/data-stream | CRT bento grid; log feed | No license | Not picked: license |

### 2.4 Navigation and lists

| Component | One line | License, deps | Verdict |
|---|---|---|---|
| [nikolas-sapa/tree-box-drawing](https://21st.dev/@nikolas-sapa/components/tree-box-drawing) | `tree`-style outline with real `├──` `└──` `│` connectors, WAI-ARIA tree | MIT; none | **Picked** (3.4) |
| [nikolas-sapa/post-list-ascii-index](https://21st.dev/@nikolas-sapa/components/post-list-ascii-index) | Keyboard list with a canvas-drawn ASCII index gutter | MIT; none | Not picked: the gutter is canvas, not text; the tree is DOM text |
| [nikolas-sapa/flamegraph-ascii-frames](https://21st.dev/@nikolas-sapa/components/flamegraph-ascii-frames) | CPU-profile flame graph in monospace cells | MIT; none | Not picked: too niche |
| cnippet-dev/m-random-letter-swap-1 | Nav links that shuffle letters on hover | No license | Not picked: license; Tubelight Navbar stays the top nav |

### 2.5 Buttons and links

| Component | One line | License, deps | Verdict |
|---|---|---|---|
| [hyperiux/scramble-link-button](https://21st.dev/@hyperiux/components/scramble-link-button) | `<a>` whose label scrambles into a-z0-9 glyphs on hover; optional underline and arrow | MIT; lucide-react | **Picked** (3.5) |
| [cnippet-dev/m-random-letter-swap-2](https://21st.dev/@cnippet-dev/components/m-random-letter-swap-2) | CTA buttons that reorder their letters on hover | MIT; none | Not picked: letter swapping, not glyph decoding |
| [shadcnspace/button-27](https://21st.dev/@shadcnspace/components/button-27) | "Encrypt Button": decrypt on hover plus a laser sweep | "Free License" (terms unclear); motion, lucide-react | Not picked: unclear license |
| [radiumcoders/dither-button](https://21st.dev/@radiumcoders/components/dither-button) | Button with a canvas Bayer-dither fill | MIT; none | Not picked: canvas fill, dither rather than ASCII |
| daiwiikharihar/hover-terminal | Button that turns into a CLI snippet to copy | MIT; lucide-react, framer-motion | Not picked: clipboard feature, not needed |
| nextjsshop/pixel-button, pixel-broke-button | Pixel-art buttons | No license | Not picked: license, pixel art |

### 2.6 Cards and frames

| Component | One line | License, deps | Verdict |
|---|---|---|---|
| [kevingirelli/corner-frame](https://21st.dev/@kevingirelli/components/corner-frame) | Static bracket marks on a box's corners, viewfinder style | MIT; @radix-ui/react-slot | **Picked** (3.6) |
| [manuarora700/evervault-card](https://21st.dev/@manuarora700/components/evervault-card) | Hover reveals encrypted characters over a gradient | MIT; framer-motion | Not picked: colorful gradient, novelty hover |
| [larsen66/admit-one-ticket](https://21st.dev/@larsen66/components/admit-one-ticket) | Dithered ticket card | MIT; none | Not picked: dither, not ASCII |
| (box-drawing card such as `┌──┐`) | none found | n/a | Corner Frame is the nearest |

### 2.7 Numbers and stats

| Component | One line | License, deps | Verdict |
|---|---|---|---|
| [f0rextasy/split-flap](https://21st.dev/@f0rextasy/components/split-flap), [harshjadhavconnect/split-flap-display](https://21st.dev/@harshjadhavconnect/components/split-flap-display), [manuarora700/text-flipping-board](https://21st.dev/@manuarora700/components/text-flipping-board) | Character-flip departure boards | MIT | Not picked: Number Ticker already covers animated numbers |
| [jakapatb/7-segment-number](https://21st.dev/@jakapatb/components/7-segment-number) | Seven-segment digits | MIT | Not picked: LED segments, not ASCII |
| [LegionWebDev/monospace-bar-chart](https://21st.dev/@LegionWebDev/components/monospace-bar-chart) | Monospace bar-chart card | MIT; motion, recharts | Not picked: would add recharts |

### 2.8 Backgrounds and ASCII art (role already filled by the trippin spiral)

- MIT, not picked because the background slot is taken: [nikolas-sapa/background-ascii-wake](https://21st.dev/@nikolas-sapa/components/background-ascii-wake), background-ascii-dither and background-ascii-nodal-lines; [ham7a311/glyph-swell](https://21st.dev/@ham7a311/components/glyph-swell); [mengto/particle-drift](https://21st.dev/@mengto/components/particle-drift) (renders in an iframe).
- No license: nikolas-sapa/background-ascii-plasma, nikolas-sapa/transition-ascii-dissolve, uilayout.contact/delicate-ascii-dots, uicapsule/ascii-renderer (also three.js), montekkundan/ascii-cube, ascii-pyramid and knot-animation, larsen66/hero-ascii and hero-ascii-one.
- About 200 community components described as "ASCII art ... made with the 21st.dev ASCII editor and baked to a looping video", for example serafimcloud/code-rain, serafimcloud/phosphor, serafimcloud/schematic, nblairwalker/n-ascii (Hex Dump) and tanusahu9894/minimal (Hex Dump). All MIT, all MP4 loops: not text, not accessible, extra download weight. Not picked.
- dillionverma/glyph-matrix is already in the app.

## 3. The picks

The six picks fill six different needs, and all are real DOM text or static decoration. None needs Next.js-only APIs (`"use client"` is a no-op in Vite), and none adds a new npm package: the app already has clsx, tailwind-merge, lucide-react and @radix-ui/react-slot. Shared colors come only from theme tokens; every palette shipped inside a prompt (Motiq blue, Tron cyan, ns blue, Hyperiux orange) is replaced.

| # | Need | Pick | Prompt file | SHA-256 (page = file) |
|---|---|---|---|---|
| 1 | Page and hero titles, section labels, one-line CLI prompts | Decrypt Text | `21st/prompts/rmahammad--decrypt-text.md` | `2527fad2137b7a3437aa0ce7d16ea220ba38ee1dbf8a3df77599d27a20035338` |
| 2 | Loaders and indeterminate progress | Conveyor Loop | `21st/prompts/loading-ui--conveyor-loop.md` | `0fd4dd38b9766711018f41f23b2956515ccee63812c6feeecc7b8268073b887e` |
| 3 | Code blocks and terminal or log output | Terminal (thegridcn) | `21st/prompts/thegridcn--terminal.md` | `a2cecfd6d09558705582301b405618c3325bd433a83338c895d967ec8465f30f` |
| 4 | In-page navigation and outlines | Tree Box Drawing | `21st/prompts/nikolas-sapa--tree-box-drawing.md` | `d922718725fc265ffcdac8e65349d83414b4b22c669572b9918fba3bf753808f` |
| 5 | Buttons and links (incl. the Home button to Courses) | Scramble Link Button | `21st/prompts/hyperiux--scramble-link-button.md` | `bae553a8a9242efe3f9f93aaf5845327fae3a8ae0966fe9668e8b906238ed6d2` |
| 6 | Cards, frames, stat tiles | Corner Frame | `21st/prompts/kevingirelli--corner-frame.md` | `3262649f1301055afb262ce3d4076bb55c397cfc9dcf24a1e358bfd0cd9c0bf9` |

Each has a manifest with the same name in `21st/manifest/`. Every prompt came from Change copy action > Claude Code, and the page's SHA-256 of the captured string equals Python's SHA-256 of the file byte for byte, with no normalization.

Needs the picks leave to existing assets: animated numbers (Number Ticker), dividers (shadcn Separator), empty states (Empty State, optionally with a Decrypt Text terminal line), top navigation (Tubelight Navbar), determinate progress (shadcn Progress), background (trippin spiral).

### 3.1 Decrypt Text — rmahammad (Mehi), Motiq library

- **URL**: https://21st.dev/@rmahammad/components/decrypt-text · **License**: MIT · **Published**: 7/30/2026 · **Deps**: clsx, tailwind-merge (in the app).
- **Looks like**: the line starts as boiling glyphs and locks in left to right with a short accent flash. The `display` variant is a big headline. The `terminal` variant is a mono card with a `$` prompt and a blinking block caret. Glyph pools: display `#%&@$?!*+=/{}[]<>~^`; terminal hex digits plus `$#%&*+=/|_~`. The terminal pool matches the hexdump background. Screenshots: `ascii-decrypt-text-1.jpg` (resolving), `ascii-decrypt-text-2.jpg` (scrambled).
- **Serves**: the Home title "WGU Study Buddy"; page titles for Courses, Learn, Cheat sheet, Exam and Misses; section labels; one-line CLI prompts such as `$ cd courses` above the Courses button, or an empty-state line.
- **Accessibility and motion**: the real string sits in an `sr-only` span and the glyph layer is `aria-hidden`. Server or first render shows the real text. `prefers-reduced-motion` renders it resolved. Animation pauses offscreen and in hidden tabs. One requestAnimationFrame loop writes only `textContent`.
- **Risks**: the default `loop` is 7000 ms, so titles re-decrypt every 7 s; pass `loop={false}` for titles. Each instance injects a `<style>` (the `@layer motiq` tokens plus per-instance keyframes); the code's own comment allows moving the tokens into global CSS. The display variant sets its own clamp() size and weight, which the app overrides with `className`.
- **Theme**: map `--motiq-fg` to `--foreground`, `--motiq-muted` to `--muted-foreground` (the scramble color), `--motiq-accent` and `--motiq-accent-text` to `--primary` (gold lock-in flash), `--motiq-secondary-accent` to `--primary` or `--chart-2`, `--motiq-success` (`$` and caret) to `--primary`, `--motiq-surface` to `--card`, `--motiq-border` to `--border`. Gold then shows only at the moment a character locks.
- **With the trippin spiral**: grey scramble glyphs echo the grayscale hexdump field, so put titles on a solid or scrimmed near-black surface, never straight on the moving glyphs. Size separates them too: titles of 2rem and up against 8px background cells.

### 3.2 Conveyor Loop — loading-ui (loading-ui.com)

- **URL**: https://21st.dev/@loading-ui/components/conveyor-loop · **License**: MIT · **Published**: 7/16/2026 · **Deps**: none (cn only).
- **Looks like**: `░░░░░░▒▓█` with a block head running along a fixed text track, about 10ch wide. Screenshot: `ascii-conveyor-loop-1.jpg`.
- **Serves**: inline loading next to mono labels, such as loading a course guide, starting or submitting an exam, or lazy views. It also reads as an indeterminate progress bar.
- **Accessibility and motion**: `role="status"` with an sr-only "Loading"; glyphs are `aria-hidden` text in `currentColor`. It has **no reduced-motion handling**: the CSS keyframes run forever. The integration must add one, for example `motion-reduce` with the animation off so the track stays static.
- **Risks**: each moving glyph paints a background box in `var(--mask-color, var(--background))` to hide the track under it. On a transparent area over the animated spiral those boxes show as dark squares, so use it only on solid surfaces and set `--mask-color` to that surface (`var(--card)` on cards). The block glyphs (U+2588, U+2591 to U+2593) need a font that has them at 1ch (see section 4).
- **Theme**: `text-primary` (gold) for active loading, `text-muted-foreground` for quiet states; the track glyph `░` takes the same color.
- **With the trippin spiral**: the same character-cell vocabulary as the hexdump background, at text size and on a card, so it reads as UI rather than background.

### 3.3 Terminal — thegridcn (The Gridcn)

- **URL**: https://21st.dev/@thegridcn/components/terminal · **License**: MIT · **Published**: 9/23/2026 · **Deps**: none (React and cn).
- **Looks like**: a bordered panel with a small uppercase title bar ("TERMINAL"). It types `lines` one by one with prefixes `> ` for input, `:: ` for system, `! ` for error and two spaces for output, then idles with a `> ▌` caret. HUD corner brackets, a faint scanline overlay and a scan sweep. Variants `default`, `danger` and `locked`. Screenshot: `ascii-terminal-1.jpg`.
- **Serves**: the Home hero "boot log" (for example `:: wgu study buddy`, `> ls courses`, `9 course guides`), terminal-style key facts or formulas in Cheat sheet and Learn, and an exam results log where misses are `!` lines.
- **Accessibility and motion**: the text is DOM text. While typing, though, screen readers get partial lines and there is no `aria-live`. There is **no reduced-motion path**: a setTimeout typewriter, an infinite `terminalScan` sweep and an `animate-pulse` caret. Integrate with `typewriter={false}` and no sweep when reduced motion is set. Then all lines render at once, which is also right for content-bearing panels.
- **Risks**: the prompt's CSS block also overwrites `:root` with a cyan Tron palette and repeats `@import` lines. Only `@keyframes terminalScan` belongs in the app; the theme supplies the colors. `bg-card/80 backdrop-blur-sm` over a constantly animating canvas re-blurs every frame, so prefer solid `bg-card`. The `lines` array must be stable (memoized), or the typewriter restarts on every render. `max-h-64` scrolls long logs.
- **Theme**: input lines use `text-primary` (gold); output uses `text-foreground/90`. The hard-coded `text-amber-500` (system) should become `--primary` or `--chart-2`, and `text-red-500` (error) should become `--destructive`. Brackets and borders use `border-primary/50` and are gold already.
- **With the trippin spiral**: a solid card panel works as a "window" over the hexdump field. Its corner brackets match Corner Frame (3.6), so frames, panels and stat tiles share one HUD and terminal vocabulary.

### 3.4 Tree Box Drawing — nikolas-sapa (Nikolas Sapalidis), @ns-ui

- **URL**: https://21st.dev/@nikolas-sapa/components/tree-box-drawing · **License**: MIT, Copyright (c) 2026 Nikolas Sapalidis · **Published**: 9/27/2026 · **Deps**: none (React only). Exports `BoughIndex` and type `BoughNode`.
- **Looks like**: the Unix `tree` command: `▾ src`, `├── ▾ components`, `│   ├── · button.tsx`, `└── · index.ts`. Collapsing retracts rows bottom-first and rewrites connectors live (`├──` becomes `└──`). Screenshots: `ascii-tree-box-drawing-1.jpg` (tree), `ascii-tree-box-drawing-2.jpg` (page header).
- **Serves**: in-page navigation and outlines. #courses can show the nine guides plus C952 as a tree (root, then course codes, then guide sections such as topics, key facts, plan and practice). It can also be the Learn or Cheat sheet outline.
- **Accessibility and motion**: WAI-ARIA tree pattern (`role` tree, treeitem and group; roving tabindex; Arrow keys, Home and End; Enter and Space). Connectors are `aria-hidden` text and labels are real buttons. `prefers-reduced-motion` shows the settled state with no sequence.
- **Risks**: there is no `onSelect` or `href` prop, so navigating to a hash route needs a small added callback. The `▾ ▸ ·` markers are inside the button text, so screen readers may read them; they could move into an `aria-hidden` span. Connectors depend on 1ch-wide box-drawing glyphs (section 4). Selection is internal state, not tied to the current route.
- **Theme**: map `--ns-muted` to `--muted-foreground`, `--surface` (selected row) to `--accent` (#1c1c21), and `--ns-accent` (focus ring) to `--ring` (#e3af35); drop the prompt's #006bff. Connectors use `text-border` (white at 8%), which is very faint on #09090b. They are decorative, but a stronger muted tone may read better.
- **With the trippin spiral**: thin connector lines over the hexdump field would vanish, so the tree belongs on a card or sidebar surface.

### 3.5 Scramble Link Button — hyperiux (Hyperiux Vault)

- **URL**: https://21st.dev/@hyperiux/components/scramble-link-button · **License**: MIT · **Published**: 9/2/2026 · **Deps**: lucide-react (in the app).
- **Looks like**: a text link (no fill). On hover the label scrambles through a-z0-9 for about 500 ms and resolves while the color shifts. There is an optional underline that draws in from the left and an optional arrow that rotates -45°. Screenshots: `ascii-scramble-link-button-1.jpg` (rest), `ascii-scramble-link-button-2.jpg` (hover: underline, rotated arrow).
- **Serves**: the user's request for a Home button that takes the user to Courses (`href="#courses"`), plus secondary text links such as "open guide", "start exam" and "review misses".
- **Accessibility and motion**: it is a real `<a href>`. The scrambling span has `aria-label` with the real label, and an invisible copy reserves the width, so there is no layout shift. Reduced motion skips the scramble and the underline and arrow transitions. The scramble runs on mouse enter (and on tap under 1025px); there is no keyboard-focus scramble, which is fine since the effect is decorative.
- **Risks**: the default font size uses viewport units (`text-[1.1vw]`, `max-lg:text-[3vw]`, `max-md:text-[4.2vw]`), so override it with `className`, for example a mono `text-sm` or `text-base`. `hoverColor` defaults to #ff6b00. As a lone link it is less prominent than a filled button; the designer may wrap it in Corner Frame or keep a shadcn Button where a filled CTA is needed.
- **Theme**: `hoverColor="var(--primary)"`; at rest the label is `--foreground` and the arrow is the lucide `ArrowRight`, or another lucide icon the app already uses.
- **With the trippin spiral**: the label has no background, so give the CTA a scrim or card. Gold on near-black is high contrast; on the mid-grey hexdump field it would not be.

### 3.6 Corner Frame — kevingirelli (Kevin Girelli), corsair-ui

- **URL**: https://21st.dev/@kevingirelli/components/corner-frame · **License**: MIT, Copyright (c) 2026 Kevin Girelli · **Published**: 10/3/2026 · **Deps**: @radix-ui/react-slot (in the app).
- **Looks like**: four small L-shaped brackets inside a box's corners, like a viewfinder or `[ ]` around a value. The demo frames three stat tiles with uppercase mono labels. Screenshot: `ascii-corner-frame-1.jpg`.
- **Serves**: cards and frames such as course cards, stat tiles (questions answered, accuracy, streak), the active exam question and a framed CTA. `asChild` lets it wrap an existing Card, Stats or Bento cell without extra DOM.
- **Accessibility and motion**: static, with no animation and no effects. The brackets are `aria-hidden` and `pointer-events-none`.
- **Risks**: barely any. It is CSS-border brackets rather than glyphs, which is the nearest 21st.dev offers to a box-drawing frame. Use `size` 12 to 16px and `thickness` 1 to 2px with the 0.875rem radius; very rounded parents can make the brackets look detached, so use `inset` to tune.
- **Theme**: brackets default to `var(--corner-frame-color, var(--primary))`, so they are gold with no change; `--muted-foreground` suits secondary tiles.
- **With the trippin spiral**: static gold corners on solid cards are the calmest element on the page, a stable counterweight to the always-moving background.

## 4. Cross-cutting notes for the designer and for Claude Code

- **Box-drawing and block glyph font.** The app loads only the Latin subset of Geist Mono (`src/index.css`, `geist-mono-latin-wght-normal.woff2`). `├──`, `└──`, `│` (Tree Box Drawing) and `█▓▒░` (Conveyor Loop) then fall back to system monospace fonts with different metrics. The installed `@fontsource-variable/geist-mono` package also ships `geist-mono-symbols2-wght-normal.woff2`, covering U+2000-2001, U+2004-2008, U+200A, U+23B8-23BD and U+2500-259F; adding that @font-face keeps them in Geist Mono at 1ch. `▸ ▾` (U+25B8, U+25BE) fall outside that range either way.
- **Monospace-led type.** Every pick assumes `font-mono`, and the app's `--font-mono` is Geist Mono. Decrypt Text's `display` variant is the one place where a sans headline (Geist) could stay.
- **Reduced motion.** Decrypt Text, Tree Box Drawing and Scramble Link Button handle it already. Conveyor Loop and the thegridcn Terminal need it added, and the trippin-spiral background should pause under it too.
- **Motion budget.** The background moves all the time. Foreground ASCII motion should happen on events (mount, hover, while loading) rather than loop: no Decrypt Text `loop` on titles, and Terminal typing once per mount.
- **Palettes shipped inside prompts.** Never adopt them: Motiq blue and green (`--motiq-*`), Tron cyan `:root` (thegridcn), ns blue `--ns-accent`, Hyperiux orange `hoverColor`. Map each to `--primary`, `--foreground`, `--muted-foreground`, `--card`, `--border`, `--accent`, `--ring` or `--destructive`.
- **Theme quirk.** The theme's `@theme inline` maps `--color-radius: var(--radius)`, a color named radius. None of the picks use it.
- **Licenses.** All six picks are MIT; two carry a copyright line (Nikolas Sapalidis, Kevin Girelli) for the README credits table.

## 5. Skipped or not captured

- `elements-/loader-cli-spinner`: prompt captured and read, but not saved, because it depends on a data file the prompt doesn't include (2.2).
- `dillionverma/terminal` (Magic UI): prompt captured for comparison, not saved (runner-up to thegridcn/terminal).
- Copy menus were present on every component page opened; no prompt was locked, and the clipboard hook caught every copy.
- The ASCII tool editor was only read, not changed (the user's trippin-spiral settings were loaded in it).
