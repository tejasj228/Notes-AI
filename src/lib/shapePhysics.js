/* Pure collision helpers for the auth-screen background shapes.
   Kept free of DOM/React so the maths can be reasoned about and tested
   on its own. Every shape is modelled as a circle of radius size/2. */

export const REST = 0.78; // restitution — energy kept per bounce
export const FRICTION = 0.988; // only applied above ambient speed
export const AMBIENT = 0.085; // px/frame — the resting drift
export const MAX_THROW = 42; // px/frame cap on a throw
export const BURST_FLOOR = 7; // only real impacts make a noise
export const BURST_COOLDOWN = 220; // ms, per shape

/** Keep a shape inside the viewport. `bounce` also reflects its velocity. */
export function clampWalls(s, w, h, bounce) {
  if (s.x < 0) {
    s.x = 0;
    if (bounce) s.vx = Math.abs(s.vx) * REST;
  } else if (s.x + s.size > w) {
    s.x = w - s.size;
    if (bounce) s.vx = -Math.abs(s.vx) * REST;
  }
  if (s.y < 0) {
    s.y = 0;
    if (bounce) s.vy = Math.abs(s.vy) * REST;
  } else if (s.y + s.size > h) {
    s.y = h - s.size;
    if (bounce) s.vy = -Math.abs(s.vy) * REST;
  }
}

/**
 * Circle-vs-rect. Pushes the shape clear of the rect.
 * @returns {{x:number,y:number,impact:number}|null} contact point + arrival
 *          speed, or null when there was no overlap.
 */
export function resolveRect(s, rect, bounce) {
  const r = s.size / 2;
  const cx = s.x + r;
  const cy = s.y + r;
  const px = Math.max(rect.left, Math.min(cx, rect.right));
  const py = Math.max(rect.top, Math.min(cy, rect.bottom));
  const dx = cx - px;
  const dy = cy - py;
  const d2 = dx * dx + dy * dy;
  if (d2 > r * r) return null;

  let d = Math.sqrt(d2);
  let nx;
  let ny;
  if (d > 0.0001) {
    nx = dx / d;
    ny = dy / d;
  } else {
    // centre is inside the rect — eject along the shallowest axis
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

  if (bounce) {
    const dot = s.vx * nx + s.vy * ny;
    if (dot < 0) {
      s.vx = (s.vx - 2 * dot * nx) * REST;
      s.vy = (s.vy - 2 * dot * ny) * REST;
    }
  }
  return { x: px, y: py, impact };
}

/**
 * Walk a dragged shape toward the pointer target instead of teleporting it.
 *
 * Teleporting straight to the pointer lets the centre land deep inside the
 * card, and `resolveRect` then ejects along whichever face is nearest — which
 * flips once the centre crosses the midline, popping the shape out the FAR
 * side. Stepping there in small increments means it always contacts the near
 * face first and simply stops, so you can't drag a shape in behind the card.
 */
export function dragTo(s, tx, ty, w, h, rect) {
  const dx = tx - s.x;
  const dy = ty - s.y;
  const dist = Math.hypot(dx, dy);
  const subs = Math.max(1, Math.ceil(dist / 8));
  for (let k = 0; k < subs; k++) {
    s.x += dx / subs;
    s.y += dy / subs;
    clampWalls(s, w, h, false);
    if (rect) resolveRect(s, rect, false);
    clampWalls(s, w, h, false);
  }
}

/**
 * Shape-vs-shape for every pair. Equal mass, except a shape being dragged is
 * immovable — it shoves the other aside. Fires at most ONE burst per pair, at
 * the contact point, so a collision makes a single noise rather than two.
 */
export function collidePairs(list, now, onBurst) {
  for (let a = 0; a < list.length; a++) {
    for (let b = a + 1; b < list.length; b++) {
      const A = list[a];
      const B = list[b];
      const ra = A.size / 2;
      const rb = B.size / 2;
      const ax = A.x + ra;
      const ay = A.y + ra;
      const bx = B.x + rb;
      const by = B.y + rb;
      let dx = bx - ax;
      let dy = by - ay;
      let d = Math.hypot(dx, dy);
      const min = ra + rb;
      if (d >= min) continue;
      if (d < 0.0001) {
        // perfectly stacked — nudge apart on an arbitrary axis
        dx = 1;
        dy = 0;
        d = 1;
      }
      const nx = dx / d;
      const ny = dy / d;
      const overlap = min - d;

      // closing speed along the normal, for the burst test
      const relSpeed = Math.abs((B.vx - A.vx) * nx + (B.vy - A.vy) * ny);

      if (A.dragging && B.dragging) {
        A.x -= nx * overlap * 0.5;
        A.y -= ny * overlap * 0.5;
        B.x += nx * overlap * 0.5;
        B.y += ny * overlap * 0.5;
      } else if (A.dragging) {
        B.x += nx * overlap;
        B.y += ny * overlap;
        const dot = B.vx * nx + B.vy * ny;
        if (dot < 0) {
          B.vx = (B.vx - 2 * dot * nx) * REST;
          B.vy = (B.vy - 2 * dot * ny) * REST;
        }
        B.vx += A.vx * 0.5; // carry the drag's momentum into the shove
        B.vy += A.vy * 0.5;
      } else if (B.dragging) {
        A.x -= nx * overlap;
        A.y -= ny * overlap;
        const dot = A.vx * -nx + A.vy * -ny;
        if (dot < 0) {
          A.vx = (A.vx + 2 * dot * nx) * REST;
          A.vy = (A.vy + 2 * dot * ny) * REST;
        }
        A.vx += B.vx * 0.5;
        A.vy += B.vy * 0.5;
      } else {
        A.x -= nx * overlap * 0.5;
        A.y -= ny * overlap * 0.5;
        B.x += nx * overlap * 0.5;
        B.y += ny * overlap * 0.5;
        // swap the normal components (equal mass), damped
        const va = A.vx * nx + A.vy * ny;
        const vb = B.vx * nx + B.vy * ny;
        if (va - vb > 0) {
          const diff = (va - vb) * REST;
          A.vx -= diff * nx;
          A.vy -= diff * ny;
          B.vx += diff * nx;
          B.vy += diff * ny;
        }
      }

      if (
        onBurst &&
        relSpeed > BURST_FLOOR &&
        now - A.lastBurst > BURST_COOLDOWN &&
        now - B.lastBurst > BURST_COOLDOWN
      ) {
        A.lastBurst = now;
        B.lastBurst = now;
        onBurst(ax + nx * ra, ay + ny * ra);
      }
    }
  }
}
