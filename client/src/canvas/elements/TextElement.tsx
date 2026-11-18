import React, { useState, useRef, useEffect } from 'react';
import { CanvasElement } from '../../types';
import { ElementProps } from './StickyNoteElement';

export const TextElement: React.FC<ElementProps> = ({
  element,
  isSelected,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(element.data?.text || '');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const fontSize = element.data?.fontSize || 18;
  const fontFamily = element.data?.fontFamily || 'Inter';
  const color = element.data?.color || '#1A1A1A';
  const fontWeight = element.data?.fontWeight || 'normal';
  const fontStyle = element.data?.fontStyle || 'normal';
  const textDecoration = element.data?.textDecoration || 'none';
  const textAlign = element.data?.textAlign || 'left';
  const isLocked = !!element.data?.isLocked;

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

  return (
    <div
      onDoubleClick={(e) => {
        if (!isLocked) {
          e.stopPropagation();
          setIsEditing(true);
        }
      }}
      className="w-full h-full p-1 select-none flex flex-col justify-center"
      style={{
        fontFamily,
        fontSize: `${fontSize}px`,
        fontWeight,
        fontStyle,
        textDecoration,
        color,
        textAlign: textAlign as any,
      }}
    >
      {isEditing ? (
        <textarea
          ref={inputRef}
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
          className="w-full h-full bg-transparent resize-none border-none outline-none leading-normal p-0"
          style={{
            fontFamily,
            fontSize: `${fontSize}px`,
            fontWeight,
            fontStyle,
            textDecoration,
            color,
            textAlign: textAlign as any,
          }}
        />
      ) : (
        <div className="w-full h-full whitespace-pre-wrap break-words leading-normal">
          {text || (isSelected ? 'Type text...' : '')}
        </div>
      )}
    </div>
  );
};
