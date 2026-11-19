import React from 'react';
import { CanvasElement } from '../../types';
import { StickyNoteElement } from './StickyNoteElement';
import { TextElement } from './TextElement';
import { ShapeElement } from './ShapeElement';
import { FreehandElement } from './FreehandElement';
import { ChartElement } from './ChartElement';
import { ImageElement } from './ImageElement';
import { ConnectorElement } from './ConnectorElement';

export interface CanvasElementRendererProps {
  element: CanvasElement;
  isSelected: boolean;
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  onEditChart?: (element: CanvasElement) => void;
}

export const CanvasElementRenderer: React.FC<CanvasElementRendererProps> = ({
  element,
  isSelected,
  onUpdate,
  onEditChart,
}) => {
  const isLocked = !!element.data?.isLocked;

  const renderContent = () => {
    switch (element.type) {
      case 'sticky_note':
        return (
          <StickyNoteElement
            element={element}
            isSelected={isSelected}
            onUpdate={onUpdate}
          />
        );

      case 'text':
        return (
          <TextElement
            element={element}
            isSelected={isSelected}
            onUpdate={onUpdate}
          />
        );

      case 'freehand':
        return (
          <FreehandElement
            element={element}
            isSelected={isSelected}
            onUpdate={onUpdate}
          />
        );

      case 'chart':
        return (
          <ChartElement
            element={element}
            isSelected={isSelected}
            onUpdate={onUpdate}
            onEditChart={onEditChart}
          />
        );

      case 'image':
        return (
          <ImageElement
            element={element}
            isSelected={isSelected}
            onUpdate={onUpdate}
          />
        );

      case 'connector':
      case 'arrow':
      case 'line':
        return (
          <ConnectorElement
            element={element}
            isSelected={isSelected}
            onUpdate={onUpdate}
          />
        );

      case 'shape':
      default:
        return (
          <ShapeElement
            element={element}
            isSelected={isSelected}
            onUpdate={onUpdate}
          />
        );
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: `${element.positionX}px`,
        top: `${element.positionY}px`,
        width: `${element.width}px`,
        height: `${element.height}px`,
        transform: `rotate(${element.rotation || 0}deg)`,
        transformOrigin: 'center center',
        zIndex: element.zIndex,
      }}
      data-element-id={element.id}
      className={`group ${isLocked ? 'cursor-not-allowed' : ''}`}
    >
      {renderContent()}
    </div>
  );
};
