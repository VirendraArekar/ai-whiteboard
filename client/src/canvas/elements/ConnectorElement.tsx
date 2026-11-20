import React from 'react';
import { ElementProps } from './StickyNoteElement';

export const ConnectorElement: React.FC<ElementProps> = ({ element, isSelected }) => {
  const stroke = element.data?.stroke || '#2D6A4F';
  const strokeWidth = element.data?.strokeWidth || 2;
  const label = element.data?.label || '';
  const endArrow = element.data?.endArrow ?? true;
  const routing = element.data?.routing || 'smooth'; // 'smooth' | 'straight' | 'orthogonal'

  const w = Math.max(element.width, 20);
  const h = Math.max(element.height, 20);
  const markerId = `arrow-${element.id}`;

  // Start and end points relative to element (positionX, positionY)
  let x1: number;
  let y1: number;
  let x2: number;
  let y2: number;

  if (
    Array.isArray(element.data?.startPoint) &&
    element.data.startPoint.length >= 2 &&
    Array.isArray(element.data?.endPoint) &&
    element.data.endPoint.length >= 2
  ) {
    x1 = element.data.startPoint[0] - element.positionX;
    y1 = element.data.startPoint[1] - element.positionY;
    x2 = element.data.endPoint[0] - element.positionX;
    y2 = element.data.endPoint[1] - element.positionY;
  } else {
    // Default horizontal fallback
    x1 = strokeWidth;
    y1 = h / 2;
    x2 = w - (endArrow ? 8 : strokeWidth);
    y2 = h / 2;
  }

  const dx = x2 - x1;
  const dy = y2 - y1;

  // Build SVG path data based on routing style
  let pathD = '';
  if (routing === 'straight') {
    pathD = `M ${x1} ${y1} L ${x2} ${y2}`;
  } else if (routing === 'orthogonal') {
    if (Math.abs(dx) > Math.abs(dy)) {
      const midX = x1 + dx * 0.5;
      pathD = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
    } else {
      const midY = y1 + dy * 0.5;
      pathD = `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;
    }
  } else {
    // Default: 'smooth' curved bezier line
    if (Math.abs(dx) >= Math.abs(dy)) {
      const cp1x = x1 + dx * 0.5;
      const cp1y = y1;
      const cp2x = x1 + dx * 0.5;
      const cp2y = y2;
      pathD = `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
    } else {
      const cp1x = x1;
      const cp1y = y1 + dy * 0.5;
      const cp2x = x2;
      const cp2y = y1 + dy * 0.5;
      pathD = `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
    }
  }

  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const pillWidth = Math.max(label.length * 6.5 + 16, 36);

  return (
    <div className="w-full h-full relative pointer-events-none select-none">
      <svg className="w-full h-full overflow-visible pointer-events-none">
        <defs>
          {endArrow && (
            <marker
              id={markerId}
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={stroke} />
            </marker>
          )}
        </defs>

        {/* Wide hit area for easy selection */}
        <path
          d={pathD}
          fill="none"
          stroke="transparent"
          strokeWidth={Math.max(strokeWidth + 12, 16)}
          className="pointer-events-auto cursor-pointer"
        />

        {/* Visible connector path */}
        <path
          d={pathD}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={element.data?.strokeStyle === 'dashed' ? '6,4' : undefined}
          markerEnd={endArrow ? `url(#${markerId})` : undefined}
          className={`transition-colors pointer-events-none ${
            isSelected ? 'stroke-emerald-600 dark:stroke-emerald-400' : ''
          }`}
        />

        {/* Descriptive label badge if present */}
        {label && (
          <g className="pointer-events-auto">
            <rect
              x={midX - pillWidth / 2}
              y={midY - 10}
              width={pillWidth}
              height={20}
              rx={6}
              className="fill-white dark:fill-gray-900 stroke-gray-200 dark:stroke-gray-700 shadow-xs"
              strokeWidth={1}
            />
            <text
              x={midX}
              y={midY + 3.5}
              textAnchor="middle"
              fill={stroke}
              fontSize="10"
              fontWeight="600"
              className="select-none pointer-events-none font-sans"
            >
              {label}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};
