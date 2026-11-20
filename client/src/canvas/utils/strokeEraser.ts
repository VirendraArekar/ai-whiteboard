import { CanvasElement } from '../../types';
import { Point } from './coordinates';

// Convert stored points to world space coordinates
export function getStrokeWorldPoints(el: CanvasElement): [number, number, number][] {
  const raw = el.data?.points || [];
  if (raw.length === 0) return [];
  const firstX = raw[0][0];
  const isLegacyWorld =
    el.positionX > 0 &&
    firstX >= el.positionX - 5 &&
    firstX <= el.positionX + el.width + 50;

  if (isLegacyWorld) {
    return raw.map(([x, y, p]: number[]) => [x, y, p ?? 0.5]);
  }
  return raw.map(([rx, ry, p]: number[]) => [
    el.positionX + rx,
    el.positionY + ry,
    p ?? 0.5,
  ]);
}

// Densify stroke points so rapid mouse movements don't skip eraser hits
export function densifyStroke(
  points: [number, number, number][],
  maxStep = 4,
): [number, number, number][] {
  if (points.length <= 1) return points;
  const result: [number, number, number][] = [points[0]];

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const dist = Math.hypot(dx, dy);

    if (dist > maxStep) {
      const steps = Math.ceil(dist / maxStep);
      for (let s = 1; s < steps; s++) {
        const t = s / steps;
        result.push([
          p1[0] + dx * t,
          p1[1] + dy * t,
          p1[2] + (p2[2] - p1[2]) * t,
        ]);
      }
    }
    result.push(p2);
  }
  return result;
}

export interface SliceResult {
  modified: boolean;
  survivingPieces: CanvasElement[];
}

/**
 * Slices a freehand stroke by removing points within eraser radius R of center (ex, ey).
 * Returns modified flag and list of surviving new/trimmed CanvasElements (can be empty if fully erased).
 */
export function sliceStrokeAtPoint(
  el: CanvasElement,
  ex: number,
  ey: number,
  radius: number,
): SliceResult {
  if (el.type !== 'freehand') {
    return { modified: false, survivingPieces: [el] };
  }

  // Quick bounding box check (radius padding)
  const r = radius;
  if (
    ex + r < el.positionX ||
    ex - r > el.positionX + el.width ||
    ey + r < el.positionY ||
    ey - r > el.positionY + el.height
  ) {
    return { modified: false, survivingPieces: [el] };
  }

  const worldPoints = getStrokeWorldPoints(el);
  if (worldPoints.length === 0) {
    return { modified: true, survivingPieces: [] };
  }

  const densified = densifyStroke(worldPoints, Math.max(3, radius / 4));
  const rSq = radius * radius;

  // Check if any point is actually inside the circle
  let anyInside = false;
  for (const pt of densified) {
    const dx = pt[0] - ex;
    const dy = pt[1] - ey;
    if (dx * dx + dy * dy <= rSq) {
      anyInside = true;
      break;
    }
  }

  if (!anyInside) {
    return { modified: false, survivingPieces: [el] };
  }

  // Partition surviving points into contiguous runs (outside the eraser circle)
  const runs: [number, number, number][][] = [];
  let currentRun: [number, number, number][] = [];

  for (const pt of densified) {
    const dx = pt[0] - ex;
    const dy = pt[1] - ey;
    if (dx * dx + dy * dy > rSq) {
      currentRun.push(pt);
    } else {
      if (currentRun.length >= 2) {
        runs.push(currentRun);
      }
      currentRun = [];
    }
  }
  if (currentRun.length >= 2) {
    runs.push(currentRun);
  }

  // Convert each run to a CanvasElement
  const survivingPieces: CanvasElement[] = runs.map((run, idx) => {
    const xs = run.map((p) => p[0]);
    const ys = run.map((p) => p[1]);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const normPoints = run.map(([x, y, p]) => [
      Math.round(x - minX),
      Math.round(y - minY),
      p,
    ]);

    return {
      id: idx === 0 ? el.id : crypto.randomUUID(),
      whiteboardId: el.whiteboardId,
      type: 'freehand',
      positionX: Math.round(minX),
      positionY: Math.round(minY),
      width: Math.max(Math.round(maxX - minX), 10),
      height: Math.max(Math.round(maxY - minY), 10),
      rotation: 0,
      zIndex: el.zIndex,
      data: {
        ...el.data,
        points: normPoints,
        origWidth: Math.max(Math.round(maxX - minX), 10),
        origHeight: Math.max(Math.round(maxY - minY), 10),
      },
    };
  });

  return {
    modified: true,
    survivingPieces,
  };
}
