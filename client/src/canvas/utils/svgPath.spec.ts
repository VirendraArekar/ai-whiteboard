import { describe, it, expect } from 'vitest';
import { renderFreehandStroke, getSvgPathFromStroke } from './svgPath';

describe('Freehand SVG Rendering', () => {
  it('should generate valid SVG path from stroke points', () => {
    const points = [
      [10, 10, 0.5],
      [15, 20, 0.5],
      [25, 35, 0.6],
      [40, 50, 0.7],
    ];

    const svgPath = renderFreehandStroke(points, 4);
    expect(svgPath).toBeDefined();
    expect(svgPath.startsWith('M')).toBe(true);
    expect(svgPath.endsWith('Z')).toBe(true);
  });

  it('should return empty string for empty points array', () => {
    expect(getSvgPathFromStroke([])).toBe('');
  });
});
