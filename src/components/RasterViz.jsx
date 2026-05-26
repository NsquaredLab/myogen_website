// RasterViz.jsx — motor-unit raster hero visualization (React island).
//
// Ported from myogen-landing.html (the raster branch of the original <EmgViz>):
//   - mulberry32 PRNG ............ source lines 1362–1369 (verbatim)
//   - makeRaster() ............... trapezoidal force-ramp drive (adapted from the source ramp)
//   - rAF loop / seed re-seed .... source lines 1428–1447
//   - #viz-time / title / meta ... source lines 1449–1468
//   - raster SVG render .......... source lines 1490–1547
//
// Adaptations from the source (the Tweaks panel + EMG/schematic variants were dropped):
//   - Props reduced to { animate = true } — no variant/accent/signal/dark props.
//   - All colors are CSS custom properties applied via inline `style` (the CSS `stroke`/
//     `fill` properties accept var(); SVG presentation *attributes* do not). They use
//     var(--accent), var(--signal) and var(--viz-grid|axis|row|dim|dim-spike) from
//     tokens.css and resolve per theme purely through the `.dark` class — no JS theme
//     detection — so the grid is always theme-correct and re-themes automatically when the
//     nav toggle flips, with no pre-hydration flash.
//   - Rendering is SVG, exactly as the source.

import { useEffect, useMemo, useRef, useState } from 'react';

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Trapezoidal drive profile: ramp up -> plateau -> ramp down (the classic force-ramp
// paradigm). Plateau spans [up, down].
function trapezoidDrive(t) {
  const up = 0.28, down = 0.72;
  if (t < up) return t / up;
  if (t > down) return Math.max(0, (1 - t) / (1 - down));
  return 1;
}

function makeRaster(nUnits, seed) {
  const rng = mulberry32(seed);
  const units = [];
  for (let u = 0; u < nUnits; u++) {
    // Recruitment threshold per unit (low-numbered = low threshold = recruits first).
    const threshold = ((u + 0.5) / nUnits) * 0.92;
    const spikes = [];
    let t = 0;
    while (t < 1) {
      const drive = trapezoidDrive(t);
      if (drive <= threshold) {
        t += 0.01; // below threshold: not recruited at this instant
        continue;
      }
      // Firing rate scales with how far the drive exceeds the unit's threshold.
      const rate = 8 + (drive - threshold) * 18 + (rng() - 0.5) * 1.5;
      t += 1 / (rate * 1.6) + (rng() - 0.5) * 0.004; // advance one interspike interval
      if (t < 1 && trapezoidDrive(t) > threshold) spikes.push(t);
    }
    units.push(spikes);
  }
  // A unit fires while the drive exceeds its threshold, so low-threshold units span a wide
  // base and high-threshold units fire only during the plateau -> the raster is a trapezoid.
  return units;
}

export default function RasterViz({ animate = true }) {
  const [seed, setSeed] = useState(7);
  const [t, setT] = useState(0);

  const rafRef = useRef(0);
  const lastRef = useRef(typeof performance !== 'undefined' ? performance.now() : 0);
  const tRef = useRef(0);
  const timeElRef = useRef(null); // cached #viz-time node (looked up once, written every frame)

  // Honor the OS "reduce motion" preference: when set, hold the static frame instead of
  // looping. Tracked as state with a live listener so toggling the OS setting takes effect
  // without a reload. SSR-safe: defaults to playing, then corrects on mount.
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  const playing = animate && !reduceMotion;

  // 14-second animation loop with t in [0,1]; pause at t=0.62 when not playing.
  // The motor-unit pattern is re-seeded ONLY when the loop wraps (t crosses 1 -> 0), so the
  // raster and the force curves never jump mid-sweep (the previous 12s timer caused that).
  useEffect(() => {
    if (!playing) {
      tRef.current = 0.62;
      setT(0.62);
      return;
    }
    let active = true;
    lastRef.current = performance.now();
    const loop = (now) => {
      const dt = (now - lastRef.current) / 1000;
      lastRef.current = now;
      let next = tRef.current + dt / 14;
      if (next > 1) {
        next -= 1;
        setSeed((s) => s + 1); // new pattern, only at loop restart
      }
      tRef.current = next;
      setT(next);
      if (active) rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      active = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [playing]);

  // One-time DOM wiring into the Astro card shell: static caption + meta, plus a cached handle
  // to the live time readout so the per-frame effect below never re-queries the DOM.
  // (source lines 1454–1468)
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const title = document.getElementById('viz-title');
    if (title) title.textContent = 'motor_unit.raster(units=18)';
    const meta = document.getElementById('viz-meta');
    if (meta) meta.textContent = '18 motor units · ramp drive';
    timeElRef.current = document.getElementById('viz-time');
  }, []);

  // Footer time readout — matches the source's loop→seconds mapping (t in [0,1] → 0–10s).
  // Writes the cached node directly; runs every frame. (source lines 1449–1452)
  useEffect(() => {
    const el = timeElRef.current;
    if (el) el.textContent = `t = ${(t * 10).toFixed(2)}s`;
  }, [t]);

  const W = 560, H = 380;
  const pad = { l: 36, r: 14, t: 8, b: 22 };
  const topGap = 16; // headroom so the cursor/dot leads above the signals

  const nUnits = 18;
  const units = useMemo(() => makeRaster(nUnits, seed * 31 + 11), [seed]);
  const innerW = W - pad.l - pad.r;
  const plotTop = pad.t + topGap; // top of spikes + force curves
  const plotBot = H - pad.b;
  const innerH = plotBot - plotTop;
  const rowH = innerH / nUnits;
  const cursorX = pad.l + t * innerW;

  // Required force (target trapezoid) + the Hann-windowed cumulative spike train across all
  // units (a force estimate), overlaid on the raster. Values 0..1 map to the full plot height.
  const force = useMemo(() => {
    const N = 120;
    const hist = new Array(N).fill(0);
    for (const spikes of units) {
      for (const st of spikes) hist[Math.min(N - 1, Math.floor(st * N))] += 1;
    }
    const K = 15, half = (K - 1) / 2; // Hann window
    const win = Array.from({ length: K }, (_, i) => 0.5 * (1 - Math.cos((2 * Math.PI * i) / (K - 1))));
    const wsum = win.reduce((a, b) => a + b, 0);
    const smooth = hist.map((_, i) => {
      let acc = 0;
      for (let k = 0; k < K; k++) {
        const j = i + k - half;
        if (j >= 0 && j < N) acc += hist[j] * win[k];
      }
      return acc / wsum;
    });
    const max = Math.max(...smooth, 1e-6);
    const xx = (i) => pad.l + ((i + 0.5) / N) * innerW;
    const yy = (v) => H - pad.b - v * innerH; // 0 -> plot bottom, 1 -> plot top
    const pt = (i, v) => ({ tt: (i + 0.5) / N, x: xx(i), y: yy(v) });
    const output = smooth.map((v, i) => pt(i, v / max));
    const target = smooth.map((_, i) => pt(i, trapezoidDrive((i + 0.5) / N)));
    return { output, target };
  }, [units]);

  // Draw the force curves in real time: only the part up to the cursor, no future "ghost".
  const drawnUpTo = (pts) => {
    let cut = pts.findIndex((p) => p.tt > t);
    if (cut === -1) cut = pts.length;
    return pts.slice(0, cut).map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  };
  const targetC = drawnUpTo(force.target);
  const outputC = drawnUpTo(force.output);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
      {Array.from({ length: 11 }, (_, i) => {
        const x = pad.l + (i * innerW) / 10;
        return (
          <line key={i} x1={x} y1={plotTop} x2={x} y2={plotBot}
            style={{ stroke: 'var(--viz-grid)' }} strokeWidth="1" strokeDasharray={i % 5 === 0 ? '' : '2 4'} />
        );
      })}
      {Array.from({ length: 6 }, (_, i) => (
        <text key={i} x={pad.l + (i * innerW) / 5} y={H - 6}
          fontFamily="IBM Plex Mono" fontSize="9" style={{ fill: 'var(--viz-axis)' }} textAnchor="middle">
          {(i * 2).toFixed(1)}s
        </text>
      ))}
      {Array.from({ length: nUnits }, (_, u) => (
        u % 3 === 0 ? (
          <text key={u} x={pad.l - 6} y={plotTop + (nUnits - 1 - u + 0.7) * rowH}
            fontFamily="IBM Plex Mono" fontSize="9" style={{ fill: 'var(--viz-axis)' }} textAnchor="end">
            {`MU ${String(u + 1).padStart(2, '0')}`}
          </text>
        ) : null
      ))}
      {units.map((spikes, u) => {
        const y = plotTop + (nUnits - 1 - u) * rowH;
        const recruited = spikes.length > 0;
        const color = recruited ? 'var(--accent)' : 'var(--viz-dim)';
        return (
          <g key={u}>
            <line x1={pad.l} y1={y + rowH / 2} x2={W - pad.r} y2={y + rowH / 2}
              style={{ stroke: 'var(--viz-row)' }} strokeWidth="1" />
            {spikes.map((st, i) => {
              if (st > t) return null; // future spikes not drawn yet (real-time reveal)
              const x = pad.l + st * innerW;
              const fresh = (t - st) < 0.04;
              return (
                <line key={i} x1={x} y1={y + rowH * 0.18} x2={x} y2={y + rowH * 0.82}
                  style={{ stroke: fresh ? 'var(--signal)' : color }}
                  strokeWidth={fresh ? 1.6 : 1.0}
                  opacity="0.95" />
              );
            })}
          </g>
        );
      })}
      {/* required force (dashed) + Hann cumulative spike train (solid), drawn in real time up to
          the cursor only — no preview of the upcoming signal */}
      <polyline points={targetC} fill="none" style={{ stroke: 'var(--viz-axis)' }} strokeWidth="1.5" strokeDasharray="3 3" />
      <polyline points={outputC} fill="none" style={{ stroke: 'var(--accent)' }} strokeWidth="2" />
      <g fontFamily="IBM Plex Mono" fontSize="8" style={{ fill: 'var(--viz-axis)' }}>
        <line x1={pad.l + 4} y1={pad.t + 6} x2={pad.l + 18} y2={pad.t + 6} style={{ stroke: 'var(--viz-axis)' }} strokeWidth="1.5" strokeDasharray="3 3" />
        <text x={pad.l + 22} y={pad.t + 8.8}>required force</text>
        <line x1={pad.l + 4} y1={pad.t + 17} x2={pad.l + 18} y2={pad.t + 17} style={{ stroke: 'var(--accent)' }} strokeWidth="2" />
        <text x={pad.l + 22} y={pad.t + 19.8}>∑ spikes · Hann</text>
      </g>

      <line x1={cursorX} y1={pad.t} x2={cursorX} y2={plotBot}
        style={{ stroke: 'var(--signal)' }} strokeWidth="1" opacity="0.6" />
      <circle cx={cursorX} cy={pad.t} r="3" style={{ fill: 'var(--signal)' }} />
    </svg>
  );
}
