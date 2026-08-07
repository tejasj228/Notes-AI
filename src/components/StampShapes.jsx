'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  REST,
  FRICTION,
  AMBIENT,
  MAX_THROW,
  BURST_FLOOR,
  BURST_COOLDOWN,
  clampWalls,
  resolveRect,
  collidePairs,
  dragTo,
} from '@/lib/shapePhysics';

/* ---------------------------------------------------------------
   Floating outlined shapes behind the auth card.

   One rAF loop owns every position — drift, dragging, throwing and
   collision are a single system. CSS keyframes are deliberately NOT
   used: a keyframe knows nothing about the card, so shapes would
   sail straight through it, and its animated transform would sit
   between the layout box and where the shape appears, which makes
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

const HISTORY_MS = 90; // pointer history window used for throw velocity
const HINT_KEY = 'sc-shapes-hint-dismissed';

// Shape sizes above were tuned for desktop — on a phone-width viewport the
// biggest one (190px) is close to the screen itself, so scale everything
// down with the viewport instead of shipping one fixed size for all widths.
const sizeScale = (w) => {
  if (w < 420) return 0.4;
  if (w < 640) return 0.52;
  if (w < 900) return 0.72;
  return 1;
};

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

  useEffect(() => {
    reducedRef.current =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const W = () => window.innerWidth;
    const H = () => window.innerHeight;

    const scale0 = sizeScale(W());
    stateRef.current = SHAPES.map((s, i) => {
      const size = s.size * scale0;
      const angle = Math.random() * Math.PI * 2;
      const x = Math.min(Math.max(s.fx * W() - size / 2, 0), Math.max(W() - size, 0));
      const y = Math.min(Math.max(s.fy * H() - size / 2, 0), Math.max(H() - size, 0));
      return {
        i,
        size,
        x,
        y,
        prevX: x,
        prevY: y,
        targetX: x,
        targetY: y,
        vx: Math.cos(angle) * AMBIENT,
        vy: Math.sin(angle) * AMBIENT,
        dragging: false,
        grabDX: 0,
        grabDY: 0,
        history: [],
        lastBurst: 0,
      };
    });

    // Paint initial size + position immediately so nothing flashes at the
    // desktop size before the first resize handler would otherwise fire.
    stateRef.current.forEach((s) => {
      const el = elsRef.current[s.i];
      if (el) {
        el.style.width = `${s.size}px`;
        el.style.height = `${s.size}px`;
        el.style.transform = `translate3d(${s.x}px, ${s.y}px, 0)`;
      }
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
      const scale = sizeScale(window.innerWidth);
      stateRef.current.forEach((s) => {
        const size = SHAPES[s.i].size * scale;
        if (size !== s.size) {
          // Re-centre on the shape's current middle so it doesn't jump when
          // its radius changes size mid-drift.
          s.x += (s.size - size) / 2;
          s.y += (s.size - size) / 2;
          s.size = size;
          const el = elsRef.current[s.i];
          if (el) {
            el.style.width = `${size}px`;
            el.style.height = `${size}px`;
          }
        }
        s.x = Math.min(s.x, Math.max(window.innerWidth - s.size, 0));
        s.y = Math.min(s.y, Math.max(window.innerHeight - s.size, 0));
      });
    };
    window.addEventListener('resize', onResize);

    // A stale loop (StrictMode double-mount, Fast Refresh) would keep
    // integrating the same objects and multiply every shape's speed.
    let alive = true;
    const reduced = reducedRef.current;

    const step = () => {
      if (!alive) return;
      const now = performance.now();
      const w = W();
      const h = H();
      const rect = cardRectRef.current;
      const list = stateRef.current;

      for (const s of list) {
        const el = elsRef.current[s.i];
        if (!el) continue;

        if (s.dragging) {
          // Follow the pointer, but the card and the walls still hold: you
          // can't drag a shape in behind the card, it slides along the edge.
          dragTo(s, s.targetX, s.targetY, w, h, rect);
          // Real velocity from how fast the shape is actually travelling, so
          // shoving it into a neighbour still registers as an impact.
          s.vx = s.x - s.prevX;
          s.vy = s.y - s.prevY;
          s.prevX = s.x;
          s.prevY = s.y;
          continue;
        }

        if (reduced) {
          s.prevX = s.x;
          s.prevY = s.y;
          continue; // no drift under reduced motion
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
          clampWalls(s, w, h, true);
          if (rect) {
            const hit = resolveRect(s, rect, true);
            if (
              hit &&
              !reduced &&
              hit.impact > BURST_FLOOR &&
              now - s.lastBurst > BURST_COOLDOWN
            ) {
              s.lastBurst = now;
              spawnBurst(hit.x, hit.y);
            }
          }
          // Card ejection can shove a wedged shape back past a wall, so the
          // walls get the final say.
          clampWalls(s, w, h, true);
        }

        s.prevX = s.x;
        s.prevY = s.y;
      }

      collidePairs(list, now, reduced ? null : spawnBurst);

      // Separation can push a shape into the card or a wall — settle it.
      for (const s of list) {
        clampWalls(s, w, h, false);
        if (rect) resolveRect(s, rect, false);
        clampWalls(s, w, h, false);
        const el = elsRef.current[s.i];
        if (el) el.style.transform = `translate3d(${s.x}px, ${s.y}px, 0)`;
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
    s.targetX = s.x;
    s.targetY = s.y;
    s.prevX = s.x;
    s.prevY = s.y;
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
    // The loop resolves this against the card/walls before painting.
    s.targetX = e.clientX - s.grabDX;
    s.targetY = e.clientY - s.grabDY;
    const now = performance.now();
    s.history.push({ t: now, x: e.clientX, y: e.clientY });
    while (s.history.length > 2 && now - s.history[0].t > HISTORY_MS) s.history.shift();
  };

  const onPointerUp = (e, i) => {
    const s = stateRef.current[i];
    if (!s || !s.dragging) return;
    s.dragging = false;
    e.currentTarget.dataset.dragging = 'false';
    e.currentTarget.style.zIndex = '';
    e.currentTarget.releasePointerCapture?.(e.pointerId);

    if (reducedRef.current) {
      s.vx = 0;
      s.vy = 0;
      return;
    }

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
            /* Actual width/height are set imperatively in the rAF effect —
               they depend on viewport size, computed after mount. */
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
                    top: '7%',
                    left: '2.5%',
                    right: '2.5%',
                    bottom: '2.5%',
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

      {/* Impact stickers — above the card, so an edge hit isn't half-hidden */}
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
