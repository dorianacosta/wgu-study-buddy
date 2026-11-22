# "trippin spiral": visual reference for the 21st.dev ASCII effect

What this is: notes taken by watching the effect so Claude Code can rebuild it from
`21st/prompts/ascii--trippin-spiral.md`. Everything here comes from looking at the rendered
output: the preview video, the live canvas, its pixels and the values shown in the editor
panel. No 21st.dev source code was read or copied. Nothing was saved, remixed, exported or
copied on 21st.dev.

- Observed: 2026-11-20, in a separate browser tab, read-only.
- Recipe page: https://21st.dev/community/ascii/trippin-spiral-fa23bfd9-dad9-49f9-be46-6f4ce2e61c29
  (title "Trippin Spiral", author shown as "jobsrip", description "trippin spiral turns any photo
  into hex dump ASCII art. Remix it free in the 21st.dev ASCII art editor."). The page shows no
  license.
- Live render: the 21st.dev ASCII editor with this recipe loaded through the page's own
  "Open in editor" link (`/community/ascii/editor?from=fa23bfd9-…`). I only switched panel tabs
  and hovered the canvas. I changed no parameter. The only POSTs were the site's page-view
  `/api/events`.

Labels used below: **OBSERVED** means seen on screen or measured from canvas pixels.
**INFERRED** means my reading of those observations.

## Reference images

| File | What it shows |
|---|---|
| `ascii-trippin-spiral-1.jpg` | A frame from the official 21st.dev preview recording (960x540 MP4, captured at 728x410). This is the look to match. |
| `ascii-trippin-spiral-2.jpg` | The live editor canvas with no cursor (578x325 capture of a 1072x603 CSS canvas). |
| `ascii-trippin-spiral-3.jpg` | The same view about 2 s after the pointer came to rest at the right of centre. The pointer is at about (451, 162) in this image, where the rings twist into a whirl. |
| `ascii-trippin-spiral-4.jpg` | A 3x close-up of the live canvas (nearest-neighbour). The hex digits are readable, and so is how the digit and its brightness rise toward the core of each band. |
| `ascii-trippin-spiral-5.jpg` | Halftone diagnostic: an 8x close-up with the canvas's CSS background switched from black to grey for the photo, so the transparent pixels show. The black disc in every cell becomes visible. In the real effect these discs are black on black. |

Frames were also taken at about 0 s, 1 s, 3 s and 6 s. They are not saved as files; the
motion numbers in section 6 come from the pixel time series instead.

## 1. One-paragraph description (OBSERVED)

The effect is a full-frame grid of tiny uppercase hex digits (`0-9 A-F`), grey on pure black,
forming wobbly concentric rings centred on the canvas. The rings travel slowly outward from the
centre; a new one appears roughly every 9 s. The innermost ring is a rounded triangle or heart
shape. The outer rings turn polygonal toward the edges. Bright bands are made mostly of `F E D
C B` and fade through middle digits to `0-3` at their edges, and the dark gaps between bands are
black. The digits churn all the time: about a fifth of the visible glyphs change on every redraw
(about 24 redraws a second), which gives a constant "data scrolling" shimmer while the rings
themselves move smoothly. A per-cell black halftone disc punches a hole in the middle of each
glyph, so the glyphs look hollow and broken. With a pointer over it, the rings around the pointer
twist into a local whirlpool. That twist is the "spiral". With no pointer there are no spiral arms.

## 2. Formats and grid (OBSERVED)

- The recipe page shows a **recording**: a muted, autoplaying, looping MP4, **960x540**,
  **2.5 s** long, displayed 800 CSS px wide. It does not react to the cursor.
- The live editor canvas has a black CSS background and transparent pixels where nothing is
  drawn. It was seen at two sizes:
  - 934x525 device px (467x263 CSS, DPR 2): cell pitch **7.78 px** (autocorrelation peaks at
    10 cells = 78 px, 20 = 155 px, 40 = 311 px).
  - 1886x1061 (1072x603 CSS): cell pitch **15.72 px**, with each glyph pixel doubled
    (nearest-neighbour upscale).
  - Both sizes give exactly **120 columns** (pitch = width / 120). That fits `cellSize: 8` on a
    **960x540 working raster**: 120 x 67.5 cells. Cells are square.
- The effect only redraws about every **41 ms (~24 fps)**: 50 changes in 2 s while
  `requestAnimationFrame` ran at about 100 fps.

## 3. Glyphs (OBSERVED)

- Character set: hex digits **0-9 and A-F, uppercase only**. No lowercase letters or
  punctuation appeared. The hexdump layout is not used: there is no address column, no byte
  spacing, and even and odd columns behave the same.
- Glyph size on the 960-px raster is about **5 px wide x 6 px tall** inside the 8 px cell. The
  glyph sits at the cell's **top-left**, leaving about 3 px blank on the right and 2 px at the
  bottom. The font is an antialiased monospace sans at about 8 px, so the edges have soft grey
  steps.
- **Digit tracks luminance, with jitter.** In every close-up, the brightest cells were mostly
  `F`/`E` with some `D C B`, middle cells showed `8 9 A 5-7`, and the dimmest visible cells
  showed `0-4`. Reading across a band gives runs like `1 3 A F`, `2 3 D F`, `3 7 F F` and
  `1 1 D E`. The mapping is not strict: a bright cell can briefly show `1` or `5`.
- **Brightness tracks luminance too.** The stroke grey (unpremultiplied) rises with the cell's
  peak brightness, through 18, 44, 70, 105, 130, 164, 172, 178 and 180 for peak bins 0-19 up to
  160-179.

## 4. Brightness and colour (OBSERVED)

These figures come from 6 frames of the 1886x1061 canvas.

- The output is **pure greyscale**: R = G = B, zero chroma pixels. The purple shader colours
  never show (`grayscale: 100`, `saturation: 0`).
- The image is **very dark**: 85% of pixels fall below 8/255. The other bands are 8-31: 6.6%,
  32-63: 3.1%, 64-95: 2.0%, 96-127: 1.3%, 128-159: 1.2%, 160-191: 0.5%, and 192 or above: 0%.
  - Percentiles: p90 = 21, p99 = 149, p99.9 = 176.
  - The maximum is **184 (#b8b8b8, about 72% grey)**. The glyphs never reach white.
- Even the brightest band only averages about 18-20/255 per cell, because a glyph covers about
  15% of its cell.
- Alpha: 20% of pixels fully transparent, 40% opaque black (the halftone discs), 40% partial
  (glyph antialiasing and disc edges).

## 5. Halftone, `pfx.halftone` 30 (OBSERVED)

- Each cell has **one opaque black disc** (#000, alpha 255), centred near the glyph's centre
  (about 3 px from the cell's top-left). It is drawn **over** the glyph.
- The disc's radius shrinks as the cell gets brighter. Measured on the 934-px canvas:
  - about **3.55 px (0.46 of a cell) in dark cells**, nearly filling the cell;
  - through 3.35, 3.13, 3.03 and 2.75;
  - to about **2.5 px (0.32 of a cell) in the brightest cells**.
- Visible result: bright `E F B 8 0` get a dark hole in the middle, and mid-grey glyphs are mostly
  erased to fragments shaped like `L`, `i` or `'`. On the black background the discs are
  otherwise invisible. Reference 5 shows them over a grey backdrop.

## 6. Ring field and motion (OBSERVED)

All measurements below are in cells (1 cell = 8 px of the 960x540 raster).

- **Centre:** the fitted ring centre is (60, 33), against a grid middle of (60, 33.5). The rings
  are centred on the canvas.
- **No spiral arms:** the ring phase winds 0 times around the centre in all 10 samples over 6 s.
  The rings are closed loops.
- **Wavelength: 8.7 cells.** That is about 70 px on the raster, about 7.3% of the width and about
  12.9% of the height. About 7 rings fit from the centre to the left or right edge, and about 4
  to the top or bottom.
  - Peak radii at one instant: 6, 15, 23, 32.5, 41.5, ~50, 59.5 and 67.5.
- **Band profile** (mean cell brightness every 1 cell outward):
  `8 17 19 13 9 4 2 2 5 10 15 18 12 7 3 2 2 8 14 17 14 11 7 3 2 2 …`
  - Brightness rises and falls like a sine wave, with the trough clipped flat at black.
  - About 4.5 cells of each period are lit and about 3-4 are dark.
- **Wobble (shape):**
  - Rings 4-18 cells from the centre wobble by an RMS of 1.0-1.7 cells, up to about 4 cells. The
    distortion is mostly **3-lobed** (a rounded triangle or heart, 0.7-1.2 cells), plus 2-lobed
    (0.4-1.2) and 1-lobed (0.3-0.8) parts.
  - Rings 18-33 cells out wobble by 0.5-1.1 cells, with higher lobe counts. They look polygonal,
    with corners pointing at the left and right edges. At the far edges a band sometimes bends
    the opposite way, but no second centre could be found.
  - **The wobble does not rotate**: its orientation held steady over 8 s. Its amplitude
    "breathes", and the shape had largely returned by 8 s (coherence 0.65 at 3 s, back to 0.89
    at 8 s).
- **Motion: the rings travel outward.** The ring phase fell steadily:
  - 1.90 rad at 0 s, then 1.79 at 0.29 s, 1.67 at 0.51 s, 1.53 at 0.76 s, 1.35 at 1.03 s,
    1.05 at 1.51 s, 0.70 at 2.00 s, -0.14 at 3.03 s, -0.86 at 4.03 s and -2.22 at 6.01 s.
  - That averages **0.69 rad/s** (between 0.55 and 0.84), or **about 0.95 cells/s** outward
    (about 7.6 px/s on the 960 raster).
  - So **one new ring is born at the centre every ~9.1 s**. Nothing spins.
  - In the 0/1/3/6 s frames the inner triangle grows into the first ring, and a new small blob
    starts forming at the centre.

## 7. Shimmer, `animStyle` "shimmer", 60% (OBSERVED)

- Glyphs change continually, independently of the slow ring drift:
  - Between consecutive redraws (41 ms), **22-26% of visible glyphs change**. That is still
    18-22% among cells whose brightness moved less than 6/255 (mean brightness change per redraw
    is about 3/255).
  - The changed share is 78% after 0.16 s, 85% after 0.57 s and 90% after 1.08 s.
  - So the average glyph lives about **4-5 redraws (~0.2 s)**.
- No separate brightness twinkle was measurable. The shimmer shows up as digit churn.
- The editor's Motion panel notes "Live: Hex Dump animates the image."

## 8. Cursor swirl (OBSERVED)

Editor values: React to cursor on, mode **Swirl** (the other modes are Push, Repel, Ripple and
Light), Strength **65%**, Radius **50%**.

- **What you see:** the rings near the pointer twist into a whirlpool (reference 3).
- **Reach:** the effect is strongest 3-9 cells from the pointer and fades out by about **24-27
  cells**, which is about 20-22% of the width or about 35-40% of the height.
  - Mean per-cell change, by 3-cell distance bins, 0.5 s after the pointer arrived: `2.6 10.6 8.3
    4.9 7.6 7.4 5.7 8.7 7.3 3.4 3.1`. The same measure with no pointer was about 2.4-3.6
    everywhere.
- **Twist angle and direction:** with the pointer on the ring centre, the pattern rotated
  **counter-clockwise on screen** by about 60-85° within about 15 cells of the pointer, falling to
  about 0° by 18-21 cells. The off-centre measurement (rotation that best matches each ring
  around the pointer) agrees once the symmetry of stripes is allowed for: about -66° to -114°
  within 9 cells. Confidence is medium.
- **Timing:**
  - Nothing changes for about **0.35-0.45 s** after the pointer arrives.
  - The twist then forms over about **0.3-0.4 s** (finished by about 0.9 s) and **holds still**
    while the pointer rests. It does not keep spinning.
  - After the pointer leaves, it **unwinds** over about 0.4 s, starting about 0.3 s later.

## 9. Editor panel values vs the prompt JSON (OBSERVED: every value matched)

| Panel (21st.dev editor) | Value shown | JSON key |
|---|---|---|
| Source | Shader, "rings" thumbnail (purple concentric rings) | `shaderSource.preset: "rings"` |
| Shader > Speed | 17% | `shaderSource.speed: 17` |
| Shader > Wobble | 20% | `shaderSource.intensity: 20` |
| Shader > Rings | 51% | `shaderSource.paramA: 51` |
| Shader > Zoom | 100% | `shaderSource.zoom: 100` |
| Shader > Warp | 48% | `shaderSource.warp: 48` |
| Shader > Contrast | 30% | `shaderSource.contrast: 30` |
| Cursor | React to cursor, Swirl, Strength 65%, Radius 50% | `mouseReactive`, `cursorEffect`, `cursorStrength`, `cursorRadius` |
| Background | Mode None, Opacity 90% | `bgMode: "none"`, `bgOpacity: 90` |
| Style | Hex Dump, Cell Size 8, Coverage 100%, Invert off, Blend Mode Color Dodge | `renderMode`, `cellSize`, `coverage`, `invert`, `styleBlend` |
| Adjust | Brightness 0, Contrast 150, Edge Emphasis 0%, Density 0%, Tone Curve Linear, Tint #3CA6FF at 0% Multiply, Saturation 0%, Grayscale 100%, Blur Off | same names |
| Effects | Halftone 30% (the only effect on) | `pfx.halftone` |
| Motion | Animated, Playback speed 100%, Shimmer, Motion strength 60% | `animated`, `animSpeed`, `animStyle`, `animIntensity` |

The editor panel does not show these shader keys: `detail 50`, `brightness 50`,
`saturation 50`, `hue 0`, `vignette 0`, `blur 0`, `grain 12`, `rotate 0`, `offsetX/Y 0`,
`seed 1`, `drift 0`. The tint (`#3ca6ff`) has no visible effect because its opacity is 0, and
Color Dodge (`styleBlend`) has no visible effect with `bgMode: "none"`.

**Editor chrome, not part of the effect (OBSERVED):** a second canvas behind the art draws a
blurred copy of it as a glow (blur 64 px, screen blend, opacity 0.65), and the art canvas has
rounded corners. The recipe does not include either. Leave both out unless the design system asks
for them.

## 10. INFERRED: how the JSON produces this

- `renderMode: "hexdump"` with `cellSize: 8` works on a fixed 960x540 raster. Each cell's average
  luminance picks a hex digit (0 = dark, F = bright, plus noise) and sets its grey. The raster is
  then scaled to the display with smoothing off.
- `shaderSource "rings"`:
  - `paramA` (Rings 51) sets ring density (wavelength about 0.13 of the height).
  - `speed 17` sets the outward phase speed (about 0.69 rad/s).
  - `intensity` (Wobble 20) and `warp 48` make the low-order, slowly breathing lobes and the
    polygonal outer rings.
  - The cursor parameters rotate the sample coordinates around the pointer, with the angle
    falling off over a radius of about 0.35-0.4 of the canvas height.
- `contrast: 150` (with shader contrast 30) produces the hard black troughs, so about half of
  each ring period is black.
- The brightness cap of about 72% grey is the combined result of contrast, the halftone and glyph
  antialiasing. It is not a separate setting.
- `animStyle "shimmer"` at 60% with speed 100% re-randomises the digit offset per cell about 5
  times a second.

## 11. Implementation recipe for Claude Code (INFERRED, written from scratch)

Plain Canvas2D, no libraries. These values match the observations above; tune them against
reference 1.

1. **Raster:** draw into an offscreen canvas at **960x540** (the original 16:9 raster), with
   `COLS = 120`, `CELL = 8` and `ROWS = 68`. Copy it to the visible canvas with
   `imageSmoothingEnabled = false`. Cap redraws at **~24 fps** (accumulate time and draw when
   at least 41 ms have passed).
   - For other aspect ratios, keep the cells square and work in height-normalised units so the
     rings stay round.
   - On narrow or portrait screens, 120 columns gives cells of about 3 px, which is noise. Use a
     minimum cell of about 6-8 CSS px there and accept fewer columns. This is a choice the
     original does not make.
2. **Field per cell** (cell centre `(cx, cy)` in cell units, origin at the grid centre
   `(60, 33.75)`, y pointing down, time `t` in seconds):
   - `(x, y) = swirl(cx - 60, cy - 33.75)` (step 5).
   - `r = hypot(x, y)`, `th = atan2(y, x)`.
   - `r += 1.2*sin(3*th + a3(t)) + 0.7*sin(2*th + a2(t)) + 0.6*noise(x/12, y/12, t*0.05)`.
     The lobes' phases `a2`/`a3` drift slowly or not at all; the amplitude can breathe over about
     8-9 s. Add a little higher-order noise in the outer rings for the polygonal look.
   - `v = 0.5 + 0.5*cos(2*PI*r/8.7 - 0.69*t)`. The minus sign makes the rings travel outward.
   - `lum = clamp((v - 0.5)*1.6 + 0.42, 0, 1)`. That is contrast plus a black floor; aim for
     about 40-50% of each period at 0.
3. **Glyph:**
   - `idx = clamp(round(lum*15 + jit[cell]), 0, 15)`, `ch = "0123456789ABCDEF"[idx]`.
   - `jit[cell]` is a random integer in [-3, 3]. On every redraw, re-roll it with probability
     about **0.22** per cell.
   - Skip cells with `lum < ~0.08`.
   - Draw `ch` with `textBaseline = "top"` at `(col*8 + 0.5, row*8 + 0.5)`, font about 8 px
     monospace, `fillStyle` grey = `round(184 * lum)`.
4. **Halftone:** after each glyph, fill a disc centred at `(col*8 + 3, row*8 + 3)` with radius
   `8 * (0.46 - 0.14*lum)` in the background colour. The original uses pure black on a black
   canvas, so the discs only show where they cut through glyphs.
5. **Cursor swirl** (from step 2):
   - Distance `d` from the smoothed pointer, `R ≈ 24-26` cells (about 0.36-0.38 of the height).
   - If `d < R`, sample the field at the point rotated about the pointer by
     `a = S * k * (1 - smoothstep(0, R, d))`, using `x' = x*cos(a) - y*sin(a)`,
     `y' = x*sin(a) + y*cos(a)` with y pointing down.
     - Rotating the sample point by a positive `a` this way makes the visible rings twist
       counter-clockwise on screen, as observed. If the result looks mirrored next to
       reference 3, flip the sign.
     - Use `S ≈ 1.6-1.9` rad for a peak twist of 90-110°.
     - The measured falloff stayed nearly flat to about 15 cells, then dropped to 0 by about 21,
       so a flatter curve also fits.
   - `k` eases from 0 to 1 over about 0.3-0.4 s while the pointer is over the area, and back to 0
     over about 0.4 s after it leaves.
   - Lerp the pointer position. The original's ~0.4 s delay before onset is not worth copying.
   - Track the pointer on `window`. A background canvas will sit under the content with
     `pointer-events: none`.
6. **Brightness budget:** max glyph grey is about 72% (#b8b8b8) and about 85% of pixels are
   black. Keep it at least this dark if it sits behind text.
7. **Reduced motion:** under `prefers-reduced-motion`, draw one still frame, with no shimmer
   re-rolls and no swirl.
8. **Theme mapping:** this is the design system's call; these are the switch points. The faithful
   baseline is neutral grey on black. The canvas fill and the halftone disc colour should be the
   same colour (the theme background `#09090b`), or the discs will show as a dot screen. The
   glyph colour is one token at `alpha = 0.72*lum` (or the grey above). `lum` drives the digit,
   the alpha and the disc radius together.

## 12. Confidence and gaps

- **High:**
  - the 120-column, 8-px grid on a 960x540 raster;
  - uppercase hex glyph set, top-left placement, about 5x6 px glyphs;
  - pure grey, the brightness histogram and max of about 184;
  - one black halftone disc per cell, with the measured radii;
  - concentric rings centred on the canvas, no spiral arms, wavelength 8.7 cells;
  - outward motion at about 0.95 cells/s (a ring every ~9 s);
  - ~24 fps redraw and about 22% glyph churn per redraw;
  - every panel value matching the JSON.
- **Medium:**
  - the digit-to-luminance mapping, read from close-ups rather than measured per cell, and the
    jitter size;
  - the swirl's direction (counter-clockwise) and peak angle (60-110°);
  - the swirl radius (about 24-27 cells);
  - the wobble's lobe make-up (3-lobed near the centre).
- **Not observed:**
  - the original's behaviour at non-16:9 sizes beyond the two editor sizes;
  - whether the swirl follows a moving pointer smoothly (only resting positions were tested);
  - any visible effect of `styleBlend` color-dodge or `bgOpacity` with `bgMode: "none"`.
