import React, { useMemo } from 'react';
import { ElementProps } from './StickyNoteElement';
import { renderFreehandStroke } from '../utils/svgPath';

export const FreehandElement: React.FC<ElementProps> = ({ element }) => {
  const rawPoints = element.data?.points || [];
  const strokeColor = element.data?.stroke || '#2D6A4F';
  const strokeWidth = element.data?.strokeWidth || 4;
  const tool = element.data?.tool || 'pen';
  const opacity =
    element.data?.opacity ??
    (tool === 'highlighter' ? 0.45 : tool === 'pencil' ? 0.85 : 1);

  const points = useMemo(() => {
    if (!rawPoints || rawPoints.length === 0) return [];
    // Backwards compatibility: if points were stored as world coordinates (legacy)
    // where point x is significantly larger than the element box, offset by positionX/positionY
    const firstX = rawPoints[0][0];
    const firstY = rawPoints[0][1];
    if (
      element.positionX > 0 &&
      firstX >= element.positionX - 5 &&
      firstX <= element.positionX + element.width + 50
    ) {
      return rawPoints.map(([x, y, p]: number[]) => [
        Math.max(0, x - element.positionX),
        Math.max(0, y - element.positionY),
        p ?? 0.5,
      ]);
    }
    return rawPoints;
  }, [rawPoints, element.positionX, element.positionY, element.width]);

  const pathData = useMemo(() => {
    if (!points || points.length === 0) return '';
    return renderFreehandStroke(
      points,
      strokeWidth,
      tool === 'highlighter' ? 0 : tool === 'pencil' ? 0.6 : 0.5,
      tool === 'pencil' ? 0.3 : 0.5,
      0.5,
    );
  }, [points, strokeWidth, tool]);

  const origW = useMemo(() => {
    if (element.data?.origWidth) return element.data.origWidth;
    if (points.length === 0) return Math.max(element.width, 10);
    const maxX = Math.max(...points.map((p: number[]) => p[0]));
    return Math.max(maxX, 10);
  }, [points, element.data?.origWidth, element.width]);

  const origH = useMemo(() => {
    if (element.data?.origHeight) return element.data.origHeight;
    if (points.length === 0) return Math.max(element.height, 10);
    const maxY = Math.max(...points.map((p: number[]) => p[1]));
    return Math.max(maxY, 10);
  }, [points, element.data?.origHeight, element.height]);

  if (!pathData) return null;

  return (
    <div
      className="w-full h-full relative pointer-events-none select-none"
      style={{
        opacity,
        mixBlendMode: tool === 'highlighter' ? 'multiply' : 'normal',
      }}
    >
      <svg
        className="w-full h-full overflow-visible"
        viewBox={`0 0 ${origW} ${origH}`}
        preserveAspectRatio="none"
      >
        <path d={pathData} fill={strokeColor} />
      </svg>
    </div>
  );
};
