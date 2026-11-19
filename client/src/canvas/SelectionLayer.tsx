import React from 'react';
import { Lock, RotateCw } from 'lucide-react';
import { BoundingBox, Point } from './utils/coordinates';

export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

export interface SelectionLayerProps {
  boundingBox: BoundingBox | null;
  marqueeBox: BoundingBox | null;
  isLocked: boolean;
  onResizeStart: (handle: ResizeHandle, e: React.MouseEvent) => void;
  onRotateStart: (e: React.MouseEvent) => void;
}

export const SelectionLayer: React.FC<SelectionLayerProps> = ({
  boundingBox,
  marqueeBox,
  isLocked,
  onResizeStart,
  onRotateStart,
}) => {
  return (
    <>
      {/* Rubberband marquee selection box */}
      {marqueeBox && (
        <div
          className="absolute border border-[#2D6A4F] bg-[#2D6A4F]/10 pointer-events-none z-50 rounded-sm"
          style={{
            left: `${marqueeBox.minX}px`,
            top: `${marqueeBox.minY}px`,
            width: `${marqueeBox.width}px`,
            height: `${marqueeBox.height}px`,
          }}
        />
      )}

      {/* Selected elements bounding box and transform handles */}
      {boundingBox && (
        <div
          className="absolute border-2 border-[#2D6A4F] pointer-events-none z-50 select-none"
          style={{
            left: `${boundingBox.minX}px`,
            top: `${boundingBox.minY}px`,
            width: `${boundingBox.width}px`,
            height: `${boundingBox.height}px`,
          }}
        >
          {/* Lock Indicator */}
          {isLocked && (
            <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center shadow pointer-events-auto">
              <Lock className="w-3 h-3" />
            </div>
          )}

          {!isLocked && (
            <>
              {/* Rotation Handle */}
              <div
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onRotateStart(e);
                }}
                className="absolute -top-7 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white border-2 border-[#2D6A4F] text-[#2D6A4F] flex items-center justify-center cursor-grab active:cursor-grabbing pointer-events-auto shadow-xs hover:scale-110 transition-transform"
                title="Rotate element"
              >
                <RotateCw className="w-2.5 h-2.5" />
              </div>
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-0.5 h-2.5 bg-[#2D6A4F]" />

              {/* 8 Resize Handles */}
              {(
                [
                  { handle: 'nw', className: '-top-1.5 -left-1.5 cursor-nwse-resize' },
                  { handle: 'n', className: '-top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize' },
                  { handle: 'ne', className: '-top-1.5 -right-1.5 cursor-nesw-resize' },
                  { handle: 'e', className: 'top-1/2 -right-1.5 -translate-y-1/2 cursor-ew-resize' },
                  { handle: 'se', className: '-bottom-1.5 -right-1.5 cursor-nwse-resize' },
                  { handle: 's', className: '-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize' },
                  { handle: 'sw', className: '-bottom-1.5 -left-1.5 cursor-nesw-resize' },
                  { handle: 'w', className: 'top-1/2 -left-1.5 -translate-y-1/2 cursor-ew-resize' },
                ] as const
              ).map(({ handle, className }) => (
                <div
                  key={handle}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    onResizeStart(handle, e);
                  }}
                  className={`absolute w-3 h-3 bg-white border-2 border-[#2D6A4F] rounded-xs shadow-xs pointer-events-auto hover:scale-125 transition-transform ${className}`}
                />
              ))}
            </>
          )}
        </div>
      )}
    </>
  );
};
