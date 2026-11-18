import React, { useState, useRef, useEffect } from 'react';
import { CanvasElement } from '../../types';

export interface ElementProps {
  element: CanvasElement;
  isSelected: boolean;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
}

export const StickyNoteElement: React.FC<ElementProps> = ({
  element,
  isSelected,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(element.data?.text || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const color = element.data?.color || '#FEF08A';
  const fontSize = element.data?.fontSize || 16;
  const fontFamily = element.data?.fontFamily || 'font-handwriting';
  const fontWeight = element.data?.fontWeight || 'normal';
  const fontStyle = element.data?.fontStyle || 'normal';
  const textAlign = element.data?.textAlign || 'left';
  const isLocked = !!element.data?.isLocked;

  useEffect(() => {
    setText(element.data?.text || '');
  }, [element.data?.text]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
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

  return (
    <div
      onDoubleClick={(e) => {
        if (!isLocked) {
          e.stopPropagation();
          setIsEditing(true);
        }
      }}
      className="w-full h-full p-4 rounded-2xl shadow-md border border-black/5 flex flex-col justify-between overflow-hidden select-none transition-shadow"
      style={{
        backgroundColor: color,
        textAlign: textAlign as any,
      }}
    >
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              handleBlur();
            }
          }}
          className="w-full h-full bg-transparent resize-none border-none outline-none font-handwriting leading-tight text-gray-900"
          style={{
            fontSize: `${fontSize}px`,
            fontFamily: fontFamily === 'font-handwriting' ? undefined : fontFamily,
            fontWeight,
            fontStyle,
            textAlign: textAlign as any,
          }}
        />
      ) : (
        <div
          className="w-full h-full font-handwriting leading-tight text-gray-900 whitespace-pre-wrap break-words overflow-hidden"
          style={{
            fontSize: `${fontSize}px`,
            fontFamily: fontFamily === 'font-handwriting' ? undefined : fontFamily,
            fontWeight,
            fontStyle,
            textAlign: textAlign as any,
          }}
        >
          {text || (isSelected ? 'Type note content...' : '')}
        </div>
      )}
    </div>
  );
};
