import React, { useState } from 'react';
import { ImageOff, Loader2 } from 'lucide-react';
import { ElementProps } from './StickyNoteElement';

export const ImageElement: React.FC<ElementProps> = ({ element }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const url = element.data?.url || element.data?.proxyUrl;
  const stroke = element.data?.stroke || 'transparent';
  const strokeWidth = element.data?.strokeWidth ?? 0;
  const fill = element.data?.fill || 'transparent';
  const opacity = element.data?.opacity ?? 1;
  const borderRadius = element.data?.borderRadius ?? 16;

  return (
    <div
      className="w-full h-full relative overflow-hidden shadow-sm select-none flex items-center justify-center transition-all"
      style={{
        backgroundColor: fill === 'transparent' ? '#F9FAFB' : fill,
        border: strokeWidth > 0 && stroke !== 'transparent' ? `${strokeWidth}px solid ${stroke}` : '1px solid rgba(0,0,0,0.1)',
        borderRadius: `${borderRadius}px`,
        opacity,
      }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 z-10">
          <Loader2 className="w-5 h-5 text-[#2D6A4F] animate-spin" />
        </div>
      )}

      {hasError || !url ? (
        <div className="flex flex-col items-center justify-center text-gray-400 p-2 text-center">
          <ImageOff className="w-6 h-6 mb-1" />
          <span className="text-[10px]">Image Unavailable</span>
        </div>
      ) : (
        <img
          src={url}
          alt="Whiteboard Asset"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          className="w-full h-full object-contain pointer-events-none"
        />
      )}
    </div>
  );
};
