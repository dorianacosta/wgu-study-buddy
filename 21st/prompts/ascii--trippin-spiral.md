Recreate the "trippin spiral" ASCII-art effect from 21st.dev (https://21st.dev/community/ascii) using Canvas2D (or an equivalent 2D raster API).

Source: the procedural shader recipe in `shaderSource` below; do not substitute a photo.

Render pipeline (reimplement, don't assume our internal code is available):
1. Render the procedural background described by `shaderSource` into a canvas at the target size; use that canvas as the sampled source. `bgMode`/`bgBlur`/`bgOpacity` control what shows behind the ASCII effect.
2. Divide the canvas into a grid of `cellSize`px cells and sample the average color/luminance of each cell.
3. For each cell, draw a shape per `renderMode`: "characters" draws a glyph from `charSet` sized/colored by luminance; "dither"/"mosaic"/"pixel"/"dots"/"cross"/"diamond"/"voxel"/"lego"/"mixed"/"lines"/"diagonal"/"braille"/"disco"/"hexdump" (hex-digit glyphs)/"matrix" (green code rain, self-animated)/"rings"/"hearts"/"stars"/"hexagons" (honeycomb)/"triangles" (low-poly)/"bubbles"/"hatch" (pencil cross-hatch)/"contour" (topographic iso-lines)/"halfblocks" (double vertical detail) each draw their own primitive shape instead. Respect `coverage` (% of cells drawn), `density`, `invert`, and `edgeEmphasis`.
4. Apply color adjustments in order: `brightness`, `contrast`, `saturation`, `grayscale`, then the `tint` color at `tintOpacity` via `overlayBlend`, then `blurType`/`blurAmount`.
5. Layer post-effects from `pfx` for every key where `enabled` is true, at its `intensity` (0-100): scanLines, vignette, bloom, chromatic, filmGrain, glitch, halftone, pixelate, filmDust.
6. If `lights.enabled`, add glow at each point in `lights.points` (normalized x/y, radius, intensity).
7. If `mask.enabled`, use `mask.dataUrl` as a reveal mask back to the plain photo (inverted if `mask.invert`).
8. This look is animated — see `animSpeed`, `animStyle` (wave/pulse/shimmer/ripple/flicker), and `animIntensity` for how it moves over time.

Full parameters (JSON):
```json
{
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
}
```
