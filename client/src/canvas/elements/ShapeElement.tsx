import React, { useState, useRef, useEffect } from 'react';
import { ElementProps } from './StickyNoteElement';

export const ShapeElement: React.FC<ElementProps> = ({
  element,
  isSelected,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(element.data?.text || '');
  const inputRef = useRef<HTMLInputElement>(null);

  const shapeType = element.data?.shapeType || element.type || 'rectangle';
  const fill = element.data?.fill || 'transparent';
  const stroke = element.data?.stroke || '#2D6A4F';
  const strokeWidth = element.data?.strokeWidth ?? 2;
  const opacity = element.data?.opacity ?? 1;
  const fontSize = element.data?.fontSize || 14;
  const fontFamily = element.data?.fontFamily || 'Inter';
  const fontWeight = element.data?.fontWeight || 'normal';
  const fontStyle = element.data?.fontStyle || 'normal';
  const textAlign = element.data?.textAlign || 'center';
  const isLocked = !!element.data?.isLocked;

  const w = element.width;
  const h = element.height;

  useEffect(() => {
    setText(element.data?.text || '');
  }, [element.data?.text]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (text !== element.data?.text) {
      onUpdate(element.id, {
        data: { ...element.data, text },
      });
    }
  };

  const renderShapePath = () => {
    switch (shapeType) {
      case 'circle':
      case 'ellipse':
        return (
          <ellipse
            cx={w / 2}
            cy={h / 2}
            rx={Math.max(1, (w - strokeWidth) / 2)}
            ry={Math.max(1, (h - strokeWidth) / 2)}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        );

      case 'rounded_rect':
        return (
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={Math.max(1, w - strokeWidth)}
            height={Math.max(1, h - strokeWidth)}
            rx={16}
            ry={16}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        );

      case 'triangle':
        const triPoints = `${w / 2},${strokeWidth} ${w - strokeWidth},${h - strokeWidth} ${strokeWidth},${h - strokeWidth}`;
        return (
          <polygon
            points={triPoints}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        );

      case 'diamond':
        const diamondPoints = `${w / 2},${strokeWidth} ${w - strokeWidth},${h / 2} ${w / 2},${h - strokeWidth} ${strokeWidth},${h / 2}`;
        return (
          <polygon
            points={diamondPoints}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        );

      case 'star': {
        const cx = w / 2;
        const cy = h / 2;
        const spikes = 5;
        const outerR = Math.min(w, h) / 2 - strokeWidth;
        const innerR = outerR / 2.5;
        let rot = (Math.PI / 2) * 3;
        let step = Math.PI / spikes;
        const points = [];

        for (let i = 0; i < spikes; i++) {
          points.push(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
          rot += step;
          points.push(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
          rot += step;
        }

        return (
          <polygon
            points={points.join(' ')}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        );
      }

      case 'cylinder':
      case 'database': {
        const topH = Math.min(h * 0.25, 24);
        return (
          <g>
            <path
              d={`M ${strokeWidth / 2} ${topH} L ${strokeWidth / 2} ${h - topH} A ${w / 2} ${topH} 0 0 0 ${w - strokeWidth / 2} ${h - topH} L ${w - strokeWidth / 2} ${topH} Z`}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
            <ellipse
              cx={w / 2}
              cy={topH}
              rx={w / 2 - strokeWidth / 2}
              ry={topH}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
          </g>
        );
      }

      case 'line':
        return (
          <line
            x1={strokeWidth}
            y1={h / 2}
            x2={w - strokeWidth}
            y2={h / 2}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        );

      case 'arrow': {
        const arrowId = `arrow-marker-${element.id}`;
        return (
          <g>
            <defs>
              <marker
                id={arrowId}
                markerWidth="10"
                markerHeight="10"
                refX="8"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill={stroke} />
              </marker>
            </defs>
            <line
              x1={strokeWidth}
              y1={h / 2}
              x2={w - 8}
              y2={h / 2}
              stroke={stroke}
              strokeWidth={strokeWidth}
              markerEnd={`url(#${arrowId})`}
            />
          </g>
        );
      }

      case 'rectangle':
      default:
        return (
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={Math.max(1, w - strokeWidth)}
            height={Math.max(1, h - strokeWidth)}
            rx={4}
            ry={4}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        );
    }
  };

  return (
    <div
      onDoubleClick={(e) => {
        if (!isLocked) {
          e.stopPropagation();
          setIsEditing(true);
        }
      }}
      className="w-full h-full relative select-none"
      style={{ opacity }}
    >
      <svg className="w-full h-full overflow-visible pointer-events-none">
        {renderShapePath()}
      </svg>

      {/* Embedded text overlay */}
      <div className="absolute inset-0 flex items-center justify-center p-2 text-center pointer-events-auto">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleBlur}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'Escape') {
                handleBlur();
              }
            }}
            className="w-full bg-transparent text-center border-none outline-none font-medium"
            style={{
              fontSize: `${fontSize}px`,
              fontFamily,
              fontWeight,
              fontStyle,
              textAlign: textAlign as any,
              color: stroke,
            }}
          />
        ) : (
          <span
            className="font-medium px-2 py-0.5 rounded pointer-events-none select-none break-words max-w-full"
            style={{
              fontSize: `${fontSize}px`,
              fontFamily,
              fontWeight,
              fontStyle,
              textAlign: textAlign as any,
              color: stroke,
            }}
          >
            {text}
          </span>
        )}
      </div>
    </div>
  );
};
