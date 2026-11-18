import { getStroke } from 'perfect-freehand';

export function getSvgPathFromStroke(stroke: number[][]): string {
  if (!stroke.length) return '';

  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ['M', ...stroke[0], 'Q'],
  );

  d.push('Z');
  return d.join(' ');
}

export function renderFreehandStroke(
  points: number[][],
  size: number = 4,
  thinning: number = 0.5,
  smoothing: number = 0.5,
  streamline: number = 0.5,
): string {
  const stroke = getStroke(points, {
    size,
    thinning,
    smoothing,
    streamline,
  });

  return getSvgPathFromStroke(stroke);
}
