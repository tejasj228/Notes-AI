'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

/* ---------------------------------------------------------------
   Floating outlined shapes behind the auth card.

   One rAF loop owns every position — drift, throwing and collision
   are a single system. CSS keyframes are deliberately NOT used:
   a keyframe knows nothing about the card, so shapes would sail
   straight through it, and its animated transform would sit between
   the layout box and where the shape actually appears, which makes
   the collision maths wrong.

   Positions live in refs, not state: they update ~60x/sec and
   re-rendering for decoration is waste. Only the rare impact
   bursts touch React state.
---------------------------------------------------------------- */

const SHAPES = [
  { kind: 'circle', size: 190, color: 'var(--sc-cyan)', fx: 0.14, fy: 0.17 },
  { kind: 'square', size: 150, color: 'var(--sc-lime)', fx: 0.79, fy: 0.13 },
  { kind: 'triangle', size: 112, color: 'var(--sc-pink)', fx: 0.09, fy: 0.7 },
  { kind: 'square', size: 96, color: 'var(--sc-tangerine)', fx: 0.85, fy: 0.73 },
  { kind: 'circle', size: 78, color: 'var(--sc-periwinkle)', fx: 0.52, fy: 0.9 },
];

const REST = 0.78; // restitution — energy kept per bounce
const FRICTION = 0.988; // only applied above ambient speed
const AMBIENT = 0.085; // px/frame — the resting drift
const MAX_THROW = 42; // px/frame cap, so a flick can't launch it across the screen
const HISTORY_MS = 90; // pointer history window used for throw velocity
const BURST_FLOOR = 7; // speed floor: only real throws make a noise
const BURST_COOLDOWN = 220; // per-shape, so one shape can't chatter
const HINT_KEY = 'sc-shapes-hint-dismissed';

const WORDS = ['BONK!', 'THUD!', 'OOF!', 'WHAM!', 'CLUNK!', 'DOINK!'];

const StampShapes = ({ cardRef }) => {
  const elsRef = useRef([]);
  const stateRef = useRef([]);
  const cardRectRef = useRef(null);
  const rafRef = useRef(0);
  const burstIdRef = useRef(0);
  const reducedRef = useRef(false);

  const [bursts, setBursts] = useState([]);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    try {
      setShowHint(!localStorage.getItem(HINT_KEY));
    } catch (_) {
      setShowHint(true);
    }
  }, []);

  const dismissHint = useCallback(() => {
    setShowHint(false);
    try {
      localStorage.setItem(HINT_KEY, '1');
    } catch (_) {}
  }, []);

  const spawnBurst = useCallback((x, y) => {
    const id = ++burstIdRef.current;
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    const rot = (Math.random() * 22 - 11).toFixed(1);
    setBursts((b) => [...b, { id, x, y, word, rot }]);
    setTimeout(() => setBursts((b) => b.filter((n) => n.id !== id)), 640);
  }, []);

  // ---- init positions + the animation loop -----------------------
  useEffect(() => {
    reducedRef.current =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const W = () => window.innerWidth;
    const H = () => window.innerHeight;

    stateRef.current = SHAPES.map((s, i) => {
      const angle = Math.random() * Math.PI * 2;
      return {
        i,
        size: s.size,
        x: Math.min(Math.max(s.fx * W() - s.size / 2, 0), Math.max(W() - s.size, 0)),
        y: Math.min(Math.max(s.fy * H() - s.size / 2, 0), Math.max(H() - s.size, 0)),
        vx: Math.cos(angle) * AMBIENT,
        vy: Math.sin(angle) * AMBIENT,
        dragging: false,
        grabDX: 0,
        grabDY: 0,
        history: [],
        lastBurst: 0,
      };
    });

    // Paint initial positions immediately so nothing flashes at 0,0
    stateRef.current.forEach((s) => {
      const el = elsRef.current[s.i];
      if (el) el.style.transform = `translate3d(${s.x}px, ${s.y}px, 0)`;
    });

    const refreshCardRect = () => {
      cardRectRef.current = cardRef?.current?.getBoundingClientRect() || null;
    };
    refreshCardRect();

    // Cache the card rect rather than measuring every frame (that would
    // interleave layout reads with transform writes).
    const rectTimer = setInterval(refreshCardRect, 400);
    const onResize = () => {
      refreshCardRect();
      // keep shapes inside the new viewport
      stateRef.current.forEach((s) => {
        s.x = Math.min(s.x, Math.max(window.innerWidth - s.size, 0));
        s.y = Math.min(s.y, Math.max(window.innerHeight - s.size, 0));
      });
    };
    window.addEventListener('resize', onResize);

    // Reduced motion: no drift, no loop. Dragging still works (it's
    // user-initiated) and writes its own transform.
    if (reducedRef.current) {
      return () => {
        clearInterval(rectTimer);
        window.removeEventListener('resize', onResize);
      };
    }

    const collideCard = (s, rect, now) => {
      const r = s.size / 2;
      const cx = s.x + r;
      const cy = s.y + r;
      const px = Math.max(rect.left, Math.min(cx, rect.right));
      const py = Math.max(rect.top, Math.min(cy, rect.bottom));
      const dx = cx - px;
      const dy = cy - py;
      const d2 = dx * dx + dy * dy;
      if (d2 > r * r) return;

      let d = Math.sqrt(d2);
      let nx;
      let ny;
      if (d > 0.0001) {
        nx = dx / d;
        ny = dy / d;
      } else {
        // centre is inside the card — eject along the shallowest axis
        const toL = cx - rect.left;
        const toR = rect.right - cx;
        const toT = cy - rect.top;
        const toB = rect.bottom - cy;
        const m = Math.min(toL, toR, toT, toB);
        if (m === toL) [nx, ny] = [-1, 0];
        else if (m === toR) [nx, ny] = [1, 0];
        else if (m === toT) [nx, ny] = [0, -1];
        else [nx, ny] = [0, 1];
        d = 0;
      }

      const impact = Math.hypot(s.vx, s.vy);
      s.x += nx * (r - d);
      s.y += ny * (r - d);

      const dot = s.vx * nx + s.vy * ny;
      if (dot < 0) {
        s.vx = (s.vx - 2 * dot * nx) * REST;
        s.vy = (s.vy - 2 * dot * ny) * REST;
      }

      if (impact > BURST_FLOOR && now - s.lastBurst > BURST_COOLDOWN) {
        s.lastBurst = now;
        spawnBurst(px, py);
      }
    };

    const collideWalls = (s, w, h) => {
      if (s.x < 0) {
        s.x = 0;
        s.vx = Math.abs(s.vx) * REST;
      } else if (s.x + s.size > w) {
        s.x = w - s.size;
        s.vx = -Math.abs(s.vx) * REST;
      }
      if (s.y < 0) {
        s.y = 0;
        s.vy = Math.abs(s.vy) * REST;
      } else if (s.y + s.size > h) {
        s.y = h - s.size;
        s.vy = -Math.abs(s.vy) * REST;
      }
    };

    // A stale loop (StrictMode double-mount, Fast Refresh) would keep
    // integrating the same objects and multiply every shape's speed.
    let alive = true;

    const step = () => {
      if (!alive) return;
      const now = performance.now();
      const w = W();
      const h = H();
      const rect = cardRectRef.current;

      for (const s of stateRef.current) {
        const el = elsRef.current[s.i];
        if (!el) continue;

        if (s.dragging) {
          el.style.transform = `translate3d(${s.x}px, ${s.y}px, 0)`;
          continue;
        }

        const speed = Math.hypot(s.vx, s.vy);
        if (speed > AMBIENT) {
          // bleed energy only while it's travelling faster than a drift
          s.vx *= FRICTION;
          s.vy *= FRICTION;
        } else if (speed > 0.0001) {
          // settled — hold it at ambient drift in whatever direction it ended up
          s.vx = (s.vx / speed) * AMBIENT;
          s.vy = (s.vy / speed) * AMBIENT;
        }

        // Sub-step long travel so a fast throw can't tunnel through the card.
        const dist = Math.hypot(s.vx, s.vy);
        const subs = Math.max(1, Math.ceil(dist / 8));
        for (let k = 0; k < subs; k++) {
          s.x += s.vx / subs;
          s.y += s.vy / subs;
          collideWalls(s, w, h);
          if (rect) collideCard(s, rect, now);
          // Card ejection can shove a wedged shape back past a wall, so the
          // walls get the final say.
          collideWalls(s, w, h);
        }

        el.style.transform = `translate3d(${s.x}px, ${s.y}px, 0)`;
      }

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      alive = false;
      cancelAnimationFrame(rafRef.current);
      clearInterval(rectTimer);
      window.removeEventListener('resize', onResize);
    };
  }, [cardRef, spawnBurst]);

  // ---- pointer handling ------------------------------------------
  const onPointerDown = (e, i) => {
    const s = stateRef.current[i];
    if (!s) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    s.dragging = true;
    s.grabDX = e.clientX - s.x;
    s.grabDY = e.clientY - s.y;
    s.history = [{ t: performance.now(), x: e.clientX, y: e.clientY }];
    s.vx = 0;
    s.vy = 0;
    e.currentTarget.dataset.dragging = 'true';
    e.currentTarget.style.zIndex = '3';
    dismissHint();
  };

  const onPointerMove = (e, i) => {
    const s = stateRef.current[i];
    if (!s || !s.dragging) return;
    s.x = e.clientX - s.grabDX;
    s.y = e.clientY - s.grabDY;
    const now = performance.now();
    s.history.push({ t: now, x: e.clientX, y: e.clientY });
    while (s.history.length > 2 && now - s.history[0].t > HISTORY_MS) s.history.shift();
    if (reducedRef.current) {
      e.currentTarget.style.transform = `translate3d(${s.x}px, ${s.y}px, 0)`;
    }
  };

  const onPointerUp = (e, i) => {
    const s = stateRef.current[i];
    if (!s || !s.dragging) return;
    s.dragging = false;
    e.currentTarget.dataset.dragging = 'false';
    e.currentTarget.style.zIndex = '';
    e.currentTarget.releasePointerCapture?.(e.pointerId);

    if (reducedRef.current) return;

    // Throw velocity from recent pointer history, capped.
    const h = s.history;
    if (h.length >= 2) {
      const a = h[0];
      const b = h[h.length - 1];
      const dt = Math.max(b.t - a.t, 1);
      let vx = ((b.x - a.x) / dt) * 16.67; // → px per frame
      let vy = ((b.y - a.y) / dt) * 16.67;
      const sp = Math.hypot(vx, vy);
      if (sp > MAX_THROW) {
        vx = (vx / sp) * MAX_THROW;
        vy = (vy / sp) * MAX_THROW;
      }
      s.vx = vx;
      s.vy = vy;
    }
    s.history = [];
  };

  return (
    <>
      {/* Shapes sit BEHIND the card so they can never swallow a click meant
          for the form, but stay grabbable everywhere else. They're fixed, so
          they contribute nothing to the scrollable area. */}
      <div className="sc-shape-layer" aria-hidden="true">
        {SHAPES.map((s, i) => (
          <div
            key={i}
            ref={(el) => {
              elsRef.current[i] = el;
            }}
            className="sc-shape"
            data-dragging="false"
            style={{ width: s.size, height: s.size }}
            onPointerDown={(e) => onPointerDown(e, i)}
            onPointerMove={(e) => onPointerMove(e, i)}
            onPointerUp={(e) => onPointerUp(e, i)}
            onPointerCancel={(e) => onPointerUp(e, i)}
          >
            {s.kind === 'triangle' ? (
              /* Clipping a bordered box clips the border away with it, so the
                 outline is drawn as a second triangle showing through from
                 behind. The inset is uneven — bigger at the apex, because at a
                 sharp angle it takes more vertical travel to clear the same
                 perpendicular distance. */
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'var(--sc-ink)',
                    clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 8,
                    left: 3,
                    right: 3,
                    bottom: 3,
                    background: s.color,
                    clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
                  }}
                />
              </div>
            ) : (
              <div
                className={`sc-shape-body ${s.kind === 'circle' ? 'is-circle' : ''}`}
                style={{ background: s.color }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Impact stickers */}
      {bursts.map((b) => (
        <div
          key={b.id}
          className="sc-burst"
          aria-hidden="true"
          style={{ left: b.x, top: b.y, '--sc-rot': `${b.rot}deg` }}
        >
          <span className="sc-burst-line" />
          <span className="sc-burst-word">{b.word}</span>
          <span className="sc-burst-line" />
        </div>
      ))}

      {/* Says its piece once, then gets out of the way for good. */}
      {showHint && <div className="sc-hint">Drag the shapes</div>}
    </>
  );
};

export default StampShapes;
