import React from 'react';
import { ElementProps } from './StickyNoteElement';

export const ConnectorElement: React.FC<ElementProps> = ({ element }) => {
  const stroke = element.data?.stroke || '#2D6A4F';
  const strokeWidth = element.data?.strokeWidth || 2;
  const label = element.data?.label || '';
  const endArrow = element.data?.endArrow ?? true;

  const w = Math.max(element.width, 20);
  const h = Math.max(element.height, 20);

  // Compute marker id for unique arrow rendering
  const markerId = `arrow-${element.id}`;

  return (
    <div className="w-full h-full relative pointer-events-none select-none">
      <svg className="w-full h-full overflow-visible">
        <defs>
          {endArrow && (
            <marker
              id={markerId}
              markerWidth="10"
              markerHeight="10"
              refX="8"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill={stroke} />
            </marker>
          )}
        </defs>

        <line
          x1={strokeWidth}
          y1={h / 2}
          x2={w - (endArrow ? 8 : strokeWidth)}
          y2={h / 2}
          stroke={stroke}
          strokeWidth={strokeWidth}
          markerEnd={endArrow ? `url(#${markerId})` : undefined}
        />

        {label && (
          <text
            x={w / 2}
            y={h / 2 - 8}
            textAnchor="middle"
            fill={stroke}
            fontSize="11"
            fontWeight="600"
            className="bg-white"
          >
            {label}
          </text>
        )}
      </svg>
    </div>
  );
};
