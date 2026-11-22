/*
 * TrippinSpiral: the field. Small grey hex digits on the 8px cell grid, forming wobbly concentric rings that
 * travel outward from the centre of the viewport, churn constantly, and twist into a whirl around a resting pointer.
 *
 * Rebuilt in plain Canvas2D from the 21st.dev ASCII recipe "Trippin Spiral" by jobsrip
 * (21st/prompts/ascii--trippin-spiral.md; its page shows no license), the measured reference
 * (21st/reference/ascii-trippin-spiral.md) and the design system's Background.md. The prompt asks for a
 * reimplementation, so no 21st.dev source was read or copied. Every value is the prompt's (TRIPPIN_SPIRAL).
 */
import { useEffect, useRef } from "react"

import { cn } from "@/lib/utils"

// The "Full parameters (JSON)" block of 21st/prompts/ascii--trippin-spiral.md, pasted word for word.
export const TRIPPIN_SPIRAL = {
  "renderMode": "hexdump",
  "bgMode": "none",
  "bgBlur": 12,
  "bgOpacity": 90,
  "cellSize": 8,
  "coverage": 100,
  "invert": false,
  "styleBlend": "color-dodge",
  "charSet": "standard",
  "customChars": "",
  "brightness": 0,
  "contrast": 150,
  "edgeEmphasis": 0,
  "density": 0,
  "toneCurve": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 1,
      "y": 1
    }
  ],
  "tint": "#3ca6ff",
  "tintOpacity": 0,
  "overlayBlend": "multiply",
  "saturation": 0,
  "grayscale": 100,
  "blurType": "off",
  "blurAmount": 35,
  "blurAngle": 0,
  "directionalBothSides": false,
  "tiltFocus": 35,
  "tiltPosition": 50,
  "tiltFeather": 15,
  "lensFocus": 40,
  "blurCenterX": 50,
  "blurCenterY": 50,
  "progressivePosition": 55,
  "progressiveReverse": false,
  "pfx": {
    "vignette": {
      "enabled": false,
      "intensity": 38
    },
    "scanLines": {
      "enabled": false,
      "intensity": 40
    },
    "chromatic": {
      "enabled": false,
      "intensity": 15
    },
    "bloom": {
      "enabled": false,
      "intensity": 25
    },
    "filmGrain": {
      "enabled": false,
      "intensity": 30
    },
    "glitch": {
      "enabled": false,
      "intensity": 20
    },
    "pixelate": {
      "enabled": false,
      "intensity": 15
    },
    "halftone": {
      "enabled": true,
      "intensity": 30
    },
    "filmDust": {
      "enabled": false,
      "intensity": 20
    }
  },
  "animated": true,
  "animStyle": "shimmer",
  "animSpeed": {
    "enabled": true,
    "intensity": 100
  },
  "animIntensity": {
    "enabled": true,
    "intensity": 60
  },
  "lights": {
    "enabled": false,
    "points": []
  },
  "mask": {
    "enabled": false,
    "tool": "freehand",
    "brushSize": 30,
    "showOverlay": false,
    "invert": false,
    "dataUrl": null,
    "shapes": []
  },
  "shaderSource": {
    "preset": "rings",
    "variant": 0,
    "colors": [
      "#10002B",
      "#5A189A",
      "#9D4EDD",
      "#E0AAFF"
    ],
    "speed": 17,
    "zoom": 100,
    "intensity": 20,
    "paramA": 51,
    "warp": 48,
    "detail": 50,
    "contrast": 30,
    "brightness": 50,
    "saturation": 50,
    "hue": 0,
    "vignette": 0,
    "blur": 0,
    "grain": 12,
    "rotate": 0,
    "offsetX": 0,
    "offsetY": 0,
    "seed": 1,
    "animated": true,
    "drift": 0,
    "motionReverse": false,
    "mouseReactive": true,
    "cursorEffect": "swirl",
    "cursorStrength": 65,
    "cursorRadius": 50,
    "oklab": false,
    "customCode": null
  }
} as const

const P = TRIPPIN_SPIRAL, S = P.shaderSource

// The rings field (Background.md, Constants). Calibrated so the prompt's values reproduce the measured reference;
// each constant scales linearly with its parameter. H is the raster height; a reference cell is 8/540 H.
const CELL = P.cellSize                         // 8 raster px
const REF = 8 / 540                             // one reference cell, in H
const F = 0.15213 * S.paramA                    // 7.759 rings per H: wavelength 0.1289 H
const OMEGA = 0.04059 * S.speed                 // 0.690 rad/s of ring phase: a ring every 9.1 s
const ZOOM = 100 / S.zoom                       // 1
const A1 = 0.5 * REF * (S.intensity / 20)       // 1-lobe wobble (H)
const A2 = 0.7 * REF * (S.intensity / 20)       // 2-lobe wobble
const A3 = 1.2 * REF * (S.intensity / 20)       // 3-lobe wobble: the triangle or heart
const A6 = 0.8 * REF * (S.detail / 50)          // 6-lobe outer polygon, corners left and right
const OCTAVES = 1 + Math.round(S.detail / 25)   // 3 warp octaves
const WAMP = 0.02 * (S.warp / 48)               // warp displacement (H), 1.35 reference cells
const GRAIN = S.grain / 100 / 8                 // 0.015 peak to peak on Y
const BREATHE = 0.35                            // amplitude swing of every lobe and warp octave
const smoothstep = (a: number, b: number, x: number) => {
  const u = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return u * u * (3 - 2 * u)
}

// Grey only (saturation 0, grayscale 100): just the Rec. 601 luma of the four shader colours survives
// (0.0380, 0.2296, 0.4624, 0.7680), interpolated in sRGB (oklab false). The colours themselves are never drawn.
const LUMA = S.colors.map((hex) => {
  const n = parseInt(hex.slice(1), 16)
  return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
})
const SEGS = LUMA.length - 1                    // lumaRamp: piecewise linear through the stops

// Cell luminance (Contrast 150, linear toneCurve) and the glyph (renderMode hexdump)
const CONTRAST = 1 + P.contrast / 100           // 2.5, about mid grey
const BRIGHT = P.brightness / 100               // 0
const HEX = "0123456789ABCDEF"
const TOP = HEX.length - 1                      // digit F
const LUM_MIN = 0.08                            // darker cells draw nothing
const INK = 0.72                                // the ink cap: field-glyph at 0.72 x lum, brightest #b7b7b7

// Halftone 30, the only active post effect: a background disc per cell, cut into the atlas sprites.
// Calibrated on Geist Mono against the reference raster (mean grey 10/255, p90 21-25, digits readable as in
// reference image 4): 0.6 x Background.md's 0.46 and 0.14, whose 3.68-2.56 px discs erase every 8px digit
// to a dash (mean 3.5/255, 96% of pixels at the ground).
const HALF_R0 = 0.276 * (P.pfx.halftone.intensity / 30)  // disc radius in cells at lum 0
const HALF_R1 = 0.084 * (P.pfx.halftone.intensity / 30)
const holeRadius = (lum: number) => CELL * (HALF_R0 - HALF_R1 * lum)   // 2.21 px down to 1.54 px
const HOLES = 8                                 // atlas rows: hole sizes

// Shimmer (animStyle shimmer, animSpeed 100, animIntensity 60)
const JIT = Math.round(P.animIntensity.intensity / 20)   // 3: jitter in -3..3
const REROLL = 0.22 * (P.animSpeed.intensity / 100)      // chance per cell per redraw
const PLAYBACK = P.animSpeed.intensity / 100             // field clock factor (1)
const FRESH = 255                                        // shown digit: none yet, pick one this redraw
const ANIMATED = P.animated && S.animated

// Cursor swirl (mouseReactive, cursorEffect swirl, cursorStrength 65, cursorRadius 50)
const SWIRL_ON = S.mouseReactive && S.cursorEffect === "swirl"
const SWIRL_ANGLE = 0.026923 * S.cursorStrength   // 1.75 rad (100 degrees) at the pointer
const SWIRL_R = 0.0074 * S.cursorRadius           // 0.37 H
const SWIRL_IN = 0.4 * SWIRL_R                    // full twist inside 0.148 H

// Rate, raster and energy (Background.md, Performance budget)
const STEP = 1000 / 24                          // 41.7 ms: 24 redraws a second
const SLOW_STEP = 1000 / 12                     // 83.3 ms: the fallback, and the rate while curtained
const SLOW_MS = 12, SLOW_N = 48                 // fall back when the mean of the last 48 redraws exceeds 12 ms
const IDLE_MS = 60_000                          // curtained: hold the frame after 60 s without input
const TOUCH_IDLE_MS = 10_000                    // 10 s on a coarse pointer, where only a tap or a key counts
const RASTER_W = 1920, RASTER_H = 1080          // raster cap in CSS px; larger boxes scale the raster up
const IDLE_EVENTS = ["pointermove", "pointerdown", "keydown", "wheel", "scroll", "touchstart", "click"] as const
const PASSIVE: AddEventListenerOptions = { passive: true }
// The `mono` token's stack, used only when --font-mono cannot be read from CSS
const MONO = '"Geist Mono Variable", "Geist Mono Symbols", ui-monospace, "SF Mono", Menlo, monospace'

// Seed 1 feeds two mulberry32 streams (32-bit PRNG, 0..1), so the same still frame appears on every load
function mulberry32(seed: number) {
  let a = seed | 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), a | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(S.seed)                          // field stream
const PHI = [0, 1, 2].map(() => rand() * 2 * Math.PI)    // phases of lobes 1, 2, 3 (fixed: the shape never rotates)
const PSI = [0, 1, 2, 3].map(() => rand() * 2 * Math.PI) // breathing phases of lobes 1, 2, 3 and the hexagon
const WAVES = Array.from({ length: OCTAVES }, () => ({   // per warp octave
  ax: rand() * 2 * Math.PI, px: rand() * 2 * Math.PI,    // direction and phase of the x-displacement wave
  ay: rand() * 2 * Math.PI, py: rand() * 2 * Math.PI,    // direction and phase of the y-displacement wave
  psi: rand() * 2 * Math.PI,                             // breathing phase
}))
const cosPHI = PHI.map(Math.cos), sinPHI = PHI.map(Math.sin)
const WEIGHT = WAVES.map((_, o) => 2 ** -o / (2 - 2 ** (1 - OCTAVES)))   // 0.571, 0.286, 0.143
const SEED_MIX = Math.imul(S.seed, 0x9e3779b1)           // the seed's share of the grain hash
// the shimmer stream, mulberry32(S.seed + 1), is created per field on allocation (seedJitter)

interface FieldProps {
  still: boolean
  swirl: boolean
  curtained: boolean
}

interface Field {
  set(props: FieldProps): void
  destroy(): void
}

function createField(canvas: HTMLCanvasElement): Field {
  const ctx = canvas.getContext("2d")
  const atlas = document.createElement("canvas")          // glyph atlas: 16 digits x 8 hole sizes, 128 x 64 px
  atlas.width = HEX.length * CELL
  atlas.height = HOLES * CELL
  const actx = atlas.getContext("2d")
  if (!ctx || !actx) return { set() {}, destroy() {} }
  return runField(canvas, ctx, atlas, actx)
}

// One field on one canvas: everything below runs outside React, so a redraw never re-renders anything.
function runField(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  atlas: HTMLCanvasElement,
  actx: CanvasRenderingContext2D,
): Field {
  // Props and environment
  let dead = false, configured = false
  let still = false, swirlAllowed = true, curtained = false
  const reducedMq = window.matchMedia("(prefers-reduced-motion: reduce)")
  const fineMq = window.matchMedia("(hover: hover) and (pointer: fine)")
  const coarseMq = window.matchMedia("(pointer: coarse)")
  let coarse = coarseMq.matches
  let dprMq: MediaQueryList | null = null
  let hidden = document.hidden, onScreen = true, wasAnimated = true
  const animated = () => ANIMATED && !reducedMq.matches && !still

  // Tokens, read from CSS: the ink, the ground (a change of either is a colour change) and the mono stack
  let glyph = "", ground = "", mono = MONO, atlasReady = false

  // Raster: scale s (CSS px per raster px), size Wr x Hr, first column edge gx, grid cols x rows
  let s = 1, Wr = 0, Hr = 0, gx = 0, cols = 0, rows = 0
  let colX = new Float32Array(0), rowY = new Float32Array(0)   // cell-centre positions in H, before the warp
  let basis = new Float32Array(0)                              // warp basis: WX, WY per octave, 6 per cell
  let jit = new Int8Array(0)                                   // shimmer jitter per cell, -3..3
  let shown = new Uint8Array(0)                                // digit on screen per cell; FRESH: pick anew
  let jitterRand = mulberry32(S.seed + 1)
  const wo = new Float64Array(OCTAVES)                         // per-redraw warp amplitudes

  // Clock, rate and the 12 fps fallback
  let t = 0, frame = 0, raf = 0, last = 0, lastDraw = 0, acc = 0, resetClock = true
  const costs = new Float64Array(SLOW_N)
  let costSum = 0, costI = 0, costN = 0, slow = false

  // Energy (idle hold while curtained) and the cursor swirl
  let idleOn = false, held = false, lastInput = 0
  let gate = false, havePointer = false, clientX = 0, clientY = 0
  let target = 0, k = 0, e = 0, cx = 0, cy = 0

  function readTokens(): boolean {
    const root = getComputedStyle(document.documentElement)
    const g = root.getPropertyValue("--field-glyph").trim()
      || root.getPropertyValue("--foreground").trim()
      || getComputedStyle(canvas).color
    const b = root.getPropertyValue("--background").trim()
    const m = root.getPropertyValue("--font-mono").trim() || MONO
    const changed = g !== glyph || b !== ground || m !== mono
    glyph = g
    ground = b
    mono = m
    return changed
  }

  // Each sprite: the digit in field-glyph at the cell's top-left, with the halftone hole cut through it.
  // The canvas is transparent over body's background, so a cut hole and a background disc are the same pixels.
  function buildAtlas() {
    actx.clearRect(0, 0, atlas.width, atlas.height)
    actx.font = `500 ${CELL}px ${mono}`
    actx.textBaseline = "alphabetic"
    actx.textAlign = "left"
    // Ink from the cell's top edge: about 4.8 x 5.8 px from (0.5, 0.2), 3 px clear on the right and 2 px below,
    // so the (3, 3) hole sits in the middle of the glyph. Whole-pixel baseline: Chrome snaps it anyway.
    const baseline = Math.round(actx.measureText("0").actualBoundingBoxAscent)   // 6
    for (let h = 0; h < HOLES; h++) {
      const radius = holeRadius((h + 0.5) / HOLES)                       // 2.17 down to 1.58 px
      for (let d = 0; d < HEX.length; d++) {
        const x = d * CELL, y = h * CELL
        actx.save()
        actx.beginPath()
        actx.rect(x, y, CELL, CELL)
        actx.clip()
        actx.fillStyle = glyph
        actx.fillText(HEX[d], x + 0.5, y + baseline)
        if (P.pfx.halftone.enabled) {
          actx.globalCompositeOperation = "destination-out"
          actx.beginPath()
          actx.arc(x + 3, y + 3, radius, 0, 2 * Math.PI)
          actx.fill()
        }
        actx.restore()
      }
    }
    atlasReady = true
  }

  // Crisp doubled pixels only when the raster maps to a whole number of 2 or more device pixels
  function setRendering() {
    const scale = s * window.devicePixelRatio, whole = Math.round(scale)
    canvas.style.imageRendering = whole >= 2 && Math.abs(scale - whole) < 1e-3 ? "pixelated" : "auto"
  }
  const onDpr = () => {
    setRendering()
    watchDpr()
  }
  function watchDpr() {
    dprMq?.removeEventListener("change", onDpr)
    dprMq = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
    dprMq.addEventListener("change", onDpr)
  }

  function seedJitter() {
    jitterRand = mulberry32(S.seed + 1)
    for (let i = 0; i < jit.length; i++) jit[i] = Math.floor(jitterRand() * (2 * JIT + 1)) - JIT
    shown.fill(FRESH)
  }

  // W x H: the canvas's CSS box. One raster px per CSS px (DPR cap 1) up to 1920 x 1080, scaled up beyond.
  function resize(W: number, H: number) {
    if (W <= 0 || H <= 0) return
    s = Math.max(1, W / RASTER_W, H / RASTER_H)
    setRendering()
    const wr = Math.ceil(W / s), hr = Math.ceil(H / s)
    if (wr === Wr && hr === Hr) return
    Wr = wr
    Hr = hr
    canvas.width = Wr
    canvas.height = Hr
    const ox = Math.floor(Wr / 2)                    // a cell edge on the centre line, on a whole pixel
    gx = ox - CELL * Math.ceil(ox / CELL)            // first column edge, 0 or less: partial cells at both sides
    cols = Math.ceil((Wr - gx) / CELL)
    rows = Math.ceil(Hr / CELL)
    colX = new Float32Array(cols)
    rowY = new Float32Array(rows)
    for (let c = 0; c < cols; c++) colX[c] = ((gx + c * CELL + CELL / 2 - Wr / 2) / Hr) * ZOOM
    for (let r = 0; r < rows; r++) rowY[r] = ((r * CELL + CELL / 2 - Hr / 2) / Hr) * ZOOM
    basis = new Float32Array(cols * rows * 2 * OCTAVES)
    for (let o = 0; o < OCTAVES; o++) {
      const fo = 2 * Math.PI * 2.2 * 2 ** o, { ax, px, ay, py } = WAVES[o]   // 2.2, 4.4, 8.8 waves per H
      const xa = Math.cos(ax), ya = Math.sin(ax), xb = Math.cos(ay), yb = Math.sin(ay)
      for (let r = 0, i = 2 * o; r < rows; r++) {
        const y = rowY[r]
        for (let c = 0; c < cols; c++, i += 2 * OCTAVES) {
          const x = colX[c]
          basis[i] = Math.sin(fo * (x * xa + y * ya) + px)
          basis[i + 1] = Math.sin(fo * (x * xb + y * yb) + py)
        }
      }
    }
    jit = new Int8Array(cols * rows)
    shown = new Uint8Array(cols * rows)
    seedJitter()
    render()
  }

  // One redraw of the current state: the rings shader once per cell centre, then one atlas sprite per lit cell.
  // Allocates nothing; no fillText, arc or path per cell.
  function render() {
    if (!atlasReady || Wr === 0) return
    // the closure's mutable state as locals, read once per redraw instead of once per cell
    const xs = colX, ys = rowY, warp = basis, jitter = jit, digits = shown, waves = wo
    const nCols = cols, nRows = rows, left = gx, fr = frame, g = ctx, sprites = atlas
    const bt = OMEGA * t                                                 // breathing, period 9.1 s
    const w1 = A1 * (1 + BREATHE * Math.sin(bt + PSI[0]))
    const w2 = A2 * (1 + BREATHE * Math.sin(bt + PSI[1]))
    const w3 = A3 * (1 + BREATHE * Math.sin(bt + PSI[2]))
    const w6 = A6 * (1 + BREATHE * Math.sin(bt + PSI[3]))
    for (let o = 0; o < OCTAVES; o++) wo[o] = WAMP * WEIGHT[o] * (1 + BREATHE * Math.sin(bt + WAVES[o].psi))
    const c1 = cosPHI[0], c2 = cosPHI[1], c3 = cosPHI[2], s1 = sinPHI[0], s2 = sinPHI[1], s3 = sinPHI[2]
    const ring = 2 * Math.PI * F, stride = 2 * OCTAVES
    const twist = SWIRL_ANGLE * e, px = cx, py = cy

    g.imageSmoothingEnabled = false                   // whole-pixel sprite copies; reset by every resize
    g.globalAlpha = 1
    g.clearRect(0, 0, Wr, Hr)                         // bgMode none: transparent over body's background
    let alpha = 1
    for (let row = 0, cell = 0; row < nRows; row++) {
      const y0 = row * CELL, yc = ys[row]
      for (let col = 0; col < nCols; col++, cell++) {
        // 1 position, 2 warp
        let x = xs[col], y = yc
        for (let o = 0, i = cell * stride; o < OCTAVES; o++, i += 2) {
          x += waves[o] * warp[i]
          y += waves[o] * warp[i + 1]
        }
        // 3 cursor swirl: sample the field at the point rotated by +a about the smoothed pointer
        if (twist > 0) {
          const dx = x - px, dy = y - py, d = Math.sqrt(dx * dx + dy * dy)
          if (d < SWIRL_R) {
            const a = twist * (1 - smoothstep(SWIRL_IN, SWIRL_R, d))
            const ca = Math.cos(a), sa = Math.sin(a)
            x = px + dx * ca - dy * sa
            y = py + dx * sa + dy * ca
          }
        }
        // 4 radius and angle terms, no atan2
        const r = Math.sqrt(x * x + y * y)             // Background.md's Math.hypot: the same value, inlined by V8
        const co = r > 1e-6 ? x / r : 1, si = r > 1e-6 ? y / r : 0
        const sin2 = 2 * si * co, cos2 = co * co - si * si
        const sin3 = 3 * si - 4 * si * si * si, cos3 = 4 * co * co * co - 3 * co
        const cos6 = 2 * cos3 * cos3 - 1
        const lobes = w1 * (si * c1 + co * s1)        // sin(n * theta + PHI[n - 1])
                    + w2 * (sin2 * c2 + cos2 * s2)
                    + w3 * (sin3 * c3 + cos3 * s3)
        const outer = smoothstep(0.21, 0.45, r)       // 14 to 30 reference cells out
        const rho = r
          + lobes * smoothstep(0, 0.044, r) * (1 - 0.45 * outer)   // taper inside 3 cells, fade to 55% outside
          - w6 * cos6 * outer                                        // corners left and right, flat top and bottom
        // 5 ring profile, travelling outward
        const v = 0.5 + 0.5 * Math.cos(ring * rho - bt)
        // 6 palette luma plus grain: a 32-bit hash of the cell, the redraw counter and the seed
        const q = v * SEGS, j = Math.min(SEGS - 1, Math.floor(q))
        let h = Math.imul(cell, 0x85ebca6b) ^ Math.imul(fr, 0xc2b2ae35) ^ SEED_MIX
        h = Math.imul(h ^ (h >>> 16), 0x7feb352d)
        h = Math.imul(h ^ (h >>> 15), 0x846ca68b)
        h ^= h >>> 16
        const Y = LUMA[j] + (LUMA[j + 1] - LUMA[j]) * (q - j) + ((h >>> 0) / 4294967296 - 0.5) * GRAIN
        // cell luminance: contrast 150 about mid grey, brightness 0, linear toneCurve
        const lum = Math.min(1, Math.max(0, (Y - 0.5) * CONTRAST + 0.5 + BRIGHT))
        if (lum < LUM_MIN) {                          // dark cell: draw nothing
          digits[cell] = FRESH
          continue
        }
        // glyph: the hex digit from lum plus the cell's shimmer jitter, picked when the cell appears or re-rolls
        // and held between re-rolls (a glyph lives about 5 redraws); alpha and hole follow lum every redraw
        let digit = digits[cell]
        if (digit === FRESH) digits[cell] = digit = Math.min(TOP, Math.max(0, Math.round(TOP * lum) + jitter[cell]))
        const hole = Math.min(HOLES - 1, Math.floor(HOLES * lum))
        if (INK * lum !== alpha) g.globalAlpha = alpha = INK * lum   // at most one set per cell (crest runs share 0.72)
        g.drawImage(sprites, digit * CELL, hole * CELL, CELL, CELL, left + col * CELL, y0, CELL, CELL)
      }
    }
    g.globalAlpha = 1
  }

  // Motion for one animated redraw: the field clock, the shimmer re-rolls and the swirl easing
  function advance(dt: number) {
    t += dt * PLAYBACK
    frame = (frame + 1) | 0
    for (let i = 0; i < jit.length; i++) {
      if (jitterRand() < REROLL) {
        jit[i] = Math.floor(jitterRand() * (2 * JIT + 1)) - JIT
        shown[i] = FRESH
      }
    }
    if (target === 0 && k === 0) return
    if (havePointer) {
      const rect = canvas.getBoundingClientRect()
      const qx = (((clientX - rect.left) / s - Wr / 2) / Hr) * ZOOM   // the pointer in H units
      const qy = (((clientY - rect.top) / s - Hr / 2) / Hr) * ZOOM
      if (k === 0) {                                  // snap, so a whirl never flies in from an old spot
        cx = qx
        cy = qy
      } else {
        const f = 1 - Math.exp(-dt / 0.12)
        cx += (qx - cx) * f
        cy += (qy - cy) * f
      }
    }
    k = target > k ? Math.min(target, k + dt / 0.35) : Math.max(target, k - dt / 0.4)   // forms 0.35 s, unwinds 0.4 s
    e = k * k * (3 - 2 * k)
  }

  // Mean cost of the last 48 redraws; above 12 ms the field redraws at 12 fps instead (never lower)
  function record(ms: number) {
    costSum += ms - costs[costI]
    costs[costI] = ms
    costI = (costI + 1) % SLOW_N
    if (costN < SLOW_N) costN++
    if (costN === SLOW_N) slow = costSum / SLOW_N > SLOW_MS
  }

  // One requestAnimationFrame loop with an accumulator: 60 Hz screens alternate 3 and 2 frames and average 24 fps
  function tick(now: number) {
    raf = requestAnimationFrame(tick)
    if (resetClock) {                                 // (re)start: dt 0, so the rings carry on without a jump
      resetClock = false
      last = lastDraw = now
      acc = 0
      return
    }
    if (idleOn && now - lastInput >= (coarse ? TOUCH_IDLE_MS : IDLE_MS)) {   // curtained and idle: keep the last frame
      held = true
      cancelAnimationFrame(raf)
      raf = 0
      return
    }
    const step = curtained || slow ? SLOW_STEP : STEP
    acc += now - last
    last = now
    if (acc < step) return
    acc = Math.min(acc - step, step)                  // keep the remainder, never bank a burst
    const dt = Math.min(now - lastDraw, 100) / 1000   // seconds, clamped to 0.1 s
    lastDraw = now
    const t0 = performance.now()
    advance(dt)
    render()
    record(performance.now() - t0)
  }

  // Pointer (swirl gate open only): tracked on window, passive; the canvas never takes pointer events
  const onPointerMove = (ev: PointerEvent) => {
    if (ev.pointerType === "touch") return            // a finger never twists the rings
    clientX = ev.clientX
    clientY = ev.clientY
    havePointer = true
    target = 1
  }
  const onPointerGone = () => {
    target = 0
  }
  const onPointerOut = (ev: PointerEvent) => {
    if (!ev.relatedTarget && ev.pointerType !== "touch") target = 0   // left the window
  }
  function addPointer() {
    window.addEventListener("pointermove", onPointerMove, PASSIVE)
    window.addEventListener("pointerout", onPointerOut, PASSIVE)
    window.addEventListener("blur", onPointerGone)
    document.documentElement.addEventListener("pointerleave", onPointerGone)
  }
  function removePointer() {
    window.removeEventListener("pointermove", onPointerMove, PASSIVE)
    window.removeEventListener("pointerout", onPointerOut, PASSIVE)
    window.removeEventListener("blur", onPointerGone)
    document.documentElement.removeEventListener("pointerleave", onPointerGone)
    havePointer = false
    target = 0                                        // an open whirl unwinds over 0.4 s while the loop runs
  }

  // Energy: while curtained, any input resets the 60 s idle timer and resumes a held frame. On a coarse pointer only
  // a tap (click) or a key counts: reading on a phone is scrolling, and every touch scroll starts with a pointerdown
  const onInput = (ev: Event) => {
    if (coarse && ev.type !== "click" && ev.type !== "keydown") return
    lastInput = performance.now()
    if (held) {
      held = false
      sync()                                          // restarts like a hidden tab: dt 0, nothing jumps
    }
  }
  function idleListeners(on: boolean) {
    for (const type of IDLE_EVENTS) {
      if (on) window.addEventListener(type, onInput, PASSIVE)
      else window.removeEventListener(type, onInput, PASSIVE)
    }
  }

  const onVisibility = () => {
    hidden = document.hidden
    if (hidden) target = 0
    sync()
  }
  // A page restored from the back-forward cache (iOS Safari on Back) restarts like a shown tab: dt 0, no jump
  const onPageShow = (ev: PageTransitionEvent) => {
    if (!ev.persisted) return
    hidden = document.hidden
    if (raf) cancelAnimationFrame(raf)
    raf = 0
    sync()
  }

  // Applies every state change: still frame, swirl gate, idle listeners, and the loop running or not
  function sync() {
    if (dead || !configured) return
    coarse = coarseMq.matches
    const anim = animated()
    if (anim !== wasAnimated) {
      wasAnimated = anim
      t = 0                                           // the still frame, and a restart, begin at t = 0
      frame = 0
      k = 0
      e = 0
      if (!anim) {
        seedJitter()                                  // the seeded initial jitter, no re-rolls, no swirl
        render()
      }
    }
    const g = SWIRL_ON && swirlAllowed && anim && fineMq.matches
    if (g !== gate) {
      gate = g
      if (g) addPointer()
      else removePointer()
    }
    const idle = anim && curtained
    if (idle !== idleOn) {
      idleOn = idle
      idleListeners(idle)
      lastInput = performance.now()
    }
    if (!idle) held = false
    const run = anim && atlasReady && Wr > 0 && !hidden && onScreen && !held
    if (run && !raf) {
      resetClock = true
      raf = requestAnimationFrame(tick)
    } else if (!run && raf) {
      cancelAnimationFrame(raf)
      raf = 0
    }
  }

  // Mount: read the tokens, await the font, build the atlas, draw the first frame
  const fonts = document.fonts
  const ready = () => {
    if (dead) return
    buildAtlas()
    render()
    sync()
  }
  const onLoadingDone = () => {                       // the font failed to load at first: rebuild once
    fonts.removeEventListener("loadingdone", onLoadingDone)
    if (dead) return
    buildAtlas()
    render()
  }
  readTokens()
  fonts.load(`500 ${CELL}px ${mono.split(",")[0].trim()}`, HEX).then(ready, () => {
    ready()
    if (!dead) fonts.addEventListener("loadingdone", onLoadingDone)
  })

  // A colour change (theme class or inline style on <html>): rebuild the atlas and redraw
  const colours = new MutationObserver(() => {
    if (!readTokens() || !atlasReady) return
    buildAtlas()
    render()
  })
  colours.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style", "data-theme"] })

  const sizes = new ResizeObserver((entries) => {
    const box = entries[entries.length - 1].contentRect
    resize(box.width, box.height)
    sync()
  })
  sizes.observe(canvas)

  // Off-screen (boxed previews): pause; the fixed field always intersects
  const view = new IntersectionObserver((entries) => {
    onScreen = entries[entries.length - 1].isIntersecting
    sync()
  })
  view.observe(canvas)

  document.addEventListener("visibilitychange", onVisibility)
  window.addEventListener("pageshow", onPageShow)
  reducedMq.addEventListener("change", sync)          // switch live on reduce and release
  fineMq.addEventListener("change", sync)
  coarseMq.addEventListener("change", sync)
  watchDpr()

  return {
    set(props) {
      still = props.still
      swirlAllowed = props.swirl
      curtained = props.curtained
      configured = true
      sync()
    },
    destroy() {
      dead = true
      if (raf) cancelAnimationFrame(raf)
      raf = 0
      colours.disconnect()
      sizes.disconnect()
      view.disconnect()
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("pageshow", onPageShow)
      reducedMq.removeEventListener("change", sync)
      fineMq.removeEventListener("change", sync)
      coarseMq.removeEventListener("change", sync)
      dprMq?.removeEventListener("change", onDpr)
      fonts.removeEventListener("loadingdone", onLoadingDone)
      if (gate) removePointer()
      if (idleOn) idleListeners(false)
      gate = idleOn = false
    },
  }
}

export interface TrippinSpiralProps {
  /** Merged with cn() onto the canvas. Boxed preview: "absolute inset-0 z-0 h-full" inside a
   *  "relative overflow-hidden bg-background" parent */
  className?: string
  /** Forces the reduced-motion still frame: the reader's pause ("Animate background" off), previews, tests */
  still?: boolean
  /** Allows the cursor swirl, still gated by pointer type and reduced motion */
  swirl?: boolean
  /** No full-strength field on screen (the App passes !useFieldExposed()): 12 fps, held after 60 s without input
   *  (10 s on a coarse pointer, where only a tap or a key counts) */
  curtained?: boolean
}

export function TrippinSpiral({ className, still = false, swirl = true, curtained = false }: TrippinSpiralProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fieldRef = useRef<Field | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const field = createField(canvas)
    fieldRef.current = field
    return () => {
      field.destroy()
      fieldRef.current = null
    }
  }, [])

  useEffect(() => {
    fieldRef.current?.set({ still, swirl, curtained })
  }, [still, swirl, curtained])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-slot="trippin-spiral"
      data-field=""
      className={cn("pointer-events-none fixed inset-x-0 top-0 -z-20 h-[100lvh] w-full", className)}
    />
  )
}
