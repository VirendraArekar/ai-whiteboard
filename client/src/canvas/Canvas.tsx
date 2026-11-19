import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  screenToWorld,
  worldToScreen,
  getElementBoundingBox,
  getElementsBoundingBox,
  isPointInBox,
  boxesIntersect,
  BoundingBox,
  Point,
} from './utils/coordinates';
import { useCanvasStore } from '../store/canvasStore';
import { useCollaborationStore } from '../store/collaborationStore';
import { useThemeStore } from '../store/themeStore';
import { CanvasElementRenderer } from './elements/CanvasElementRenderer';
import { SelectionLayer, ResizeHandle } from './SelectionLayer';
import { CanvasElement } from '../types';
import { renderFreehandStroke } from './utils/svgPath';
import { syncHistoryChange } from './utils/historySync';
import { sliceStrokeAtPoint } from './utils/strokeEraser';

// Calculate squared distance from point (px, py) to segment (x1, y1)-(x2, y2)
function distToSegmentSquared(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return (px - x1) * (px - x1) + (py - y1) * (py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * (x2 - x1);
  const projY = y1 + t * (y2 - y1);
  return (px - projX) * (px - projX) + (py - projY) * (py - projY);
}

// Extract world-space points for a freehand element
function getStrokeWorldPoints(el: CanvasElement): [number, number][] {
  const raw = el.data?.points || [];
  if (raw.length === 0) return [];
  const firstX = raw[0][0];
  const isLegacyWorld =
    el.positionX > 0 &&
    firstX >= el.positionX - 5 &&
    firstX <= el.positionX + el.width + 50;

  if (isLegacyWorld) {
    return raw.map(([x, y]: number[]) => [x, y]);
  }
  return raw.map(([rx, ry]: number[]) => [el.positionX + rx, el.positionY + ry]);
}

export interface CanvasProps {
  boardId: string;
  onEditChart?: (element: CanvasElement) => void;
  onElementChange?: (element: CanvasElement) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  boardId,
  onEditChart,
  onElementChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    elements,
    selectedIds,
    currentTool,
    zoom,
    pan,
    gridMode,
    strokeColor,
    fillColor,
    strokeWidth,
    opacity,
    fontSize,
    fontFamily,
    setZoom,
    setPan,
    setSelectedIds,
    clearSelection,
    addElement,
    updateElement,
    updateElementsBatch,
    pushHistory,
    pushSnapshot,
    undo,
    redo,
    copy,
    paste,
    duplicateSelected,
    deleteSelected,
    deleteElement,
    setCurrentTool,
    eraserMode,
    eraserRadius,
  } = useCanvasStore();

  const collabEmitter = useCollaborationStore();
  const {
    emitCursorMove,
    emitElementCreate,
    emitElementUpdate,
    emitElementDelete,
    emitBulkUpdate,
    emitLiveStroke,
    emitStrokeEnd,
    userCursors,
  } = collabEmitter;

  // Interaction States
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // Synchronized element updates (persists to backend and emits to peers)
  const handleElementUpdate = useCallback(
    (id: string, updates: Partial<CanvasElement>) => {
      updateElement(id, updates);
      const updated = useCanvasStore
        .getState()
        .elements.find((el) => el.id === id);
      if (updated) {
        emitElementUpdate(updated);
        onElementChange?.(updated);
      }
    },
    [updateElement, emitElementUpdate, onElementChange],
  );

  // Marquee selection
  const [marqueeStart, setMarqueeStart] = useState<Point | null>(null);
  const [marqueeBox, setMarqueeBox] = useState<BoundingBox | null>(null);

  // Dragging elements
  const [isDraggingElements, setIsDraggingElements] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<Point>({ x: 0, y: 0 });
  const [elementStartPositions, setElementStartPositions] = useState<
    Map<string, { x: number; y: number }>
  >(new Map());

  // Resizing elements
  const [activeResizeHandle, setActiveResizeHandle] = useState<ResizeHandle | null>(null);
  const [resizeStartBBox, setResizeStartBBox] = useState<BoundingBox | null>(null);
  const [resizeStartPos, setResizeStartPos] = useState<Point>({ x: 0, y: 0 });

  // Rotating element
  const [isRotating, setIsRotating] = useState(false);
  const [rotateCenter, setRotateCenter] = useState<Point>({ x: 0, y: 0 });
  const [rotateStartAngle, setRotateStartAngle] = useState(0);

  // Freehand drawing in-progress
  const [currentStrokePoints, setCurrentStrokePoints] = useState<number[][]>([]);
  const [currentStrokeId, setCurrentStrokeId] = useState<string>('');

  // Shape creation in-progress
  const [shapeStartPos, setShapeStartPos] = useState<Point | null>(null);
  const [shapeCurrentPos, setShapeCurrentPos] = useState<Point | null>(null);

  // Eraser in-progress
  const [isErasing, setIsErasing] = useState(false);
  const [lastEraserPos, setLastEraserPos] = useState<Point | null>(null);
  const [cursorWorldPos, setCursorWorldPos] = useState<Point | null>(null);

  // Snapshot before starting interactive mutation (drag/resize/rotate)
  const beforeMutationElements = useRef<CanvasElement[]>([]);

  // Compute selected bounding box
  const selectedElements = elements.filter((el) => selectedIds.includes(el.id));
  const selectionBBox = getElementsBoundingBox(selectedElements);
  const isSelectedLocked = selectedElements.some((el) => el.data?.isLocked);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.code === 'Space' && !isSpacePressed) {
        setIsSpacePressed(true);
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;

      if (cmdKey && e.key === 'z') {
        e.preventDefault();
        const before = [...elements];
        if (e.shiftKey) {
          const after = redo();
          if (after) syncHistoryChange(before, after, collabEmitter);
        } else {
          const after = undo();
          if (after) syncHistoryChange(before, after, collabEmitter);
        }
      } else if (cmdKey && e.key === 'c') {
        e.preventDefault();
        copy();
      } else if (cmdKey && e.key === 'v') {
        e.preventDefault();
        const pasted = paste();
        pasted.forEach((p) => emitElementCreate(p));
      } else if (cmdKey && e.key === 'd') {
        e.preventDefault();
        const duplicated = duplicateSelected();
        duplicated.forEach((d) => emitElementCreate(d));
      } else if (cmdKey && e.key === 'a') {
        e.preventDefault();
        setSelectedIds(elements.map((el) => el.id));
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        const deletedIds = deleteSelected();
        deletedIds.forEach((id) => emitElementDelete(id));
      } else if (e.key === 'Escape') {
        clearSelection();
        setCurrentTool('select');
      } else if (e.key === 'v' || e.key === 'V') {
        setCurrentTool('select');
      } else if (e.key === 'h' || e.key === 'H') {
        setCurrentTool('hand');
      } else if (e.key === 'p' || e.key === 'P') {
        setCurrentTool('pen');
      } else if (e.key === 'b' || e.key === 'B') {
        setCurrentTool('pencil');
      } else if (e.key === 'e' || e.key === 'E') {
        setCurrentTool('eraser');
      } else if (e.key === 'r' || e.key === 'R') {
        setCurrentTool('rectangle');
      } else if (e.key === 'l' || e.key === 'L') {
        setCurrentTool('line');
      } else if (e.key === 's' || e.key === 'S') {
        setCurrentTool('sticky_note');
      } else if (e.key === 't' || e.key === 'T') {
        setCurrentTool('text');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    isSpacePressed,
    undo,
    redo,
    copy,
    paste,
    duplicateSelected,
    deleteSelected,
    elements,
    setSelectedIds,
    clearSelection,
    setCurrentTool,
    emitElementCreate,
    emitElementDelete,
  ]);

  // Wheel Zoom (anchored to cursor)
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (e.ctrlKey || e.metaKey) {
        // Zooming
        const zoomDelta = -e.deltaY * 0.002;
        const newZoom = Math.min(Math.max(zoom * (1 + zoomDelta), 0.1), 5);

        // Adjust pan so mouse point remains stationary in world space
        const worldPos = screenToWorld(mouseX, mouseY, pan, zoom);
        const newPan = {
          x: mouseX - worldPos.x * newZoom,
          y: mouseY - worldPos.y * newZoom,
        };

        setZoom(newZoom);
        setPan(newPan);
      } else {
        // Panning with two-finger swipe or scroll
        setPan((prev) => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }));
      }
    },
    [zoom, pan, setZoom, setPan],
  );

  const executeErase = useCallback(
    (from: Point, to: Point) => {
      const radius = eraserRadius || 16;
      const currentElements = useCanvasStore.getState().elements;

      if (eraserMode === 'area') {
        // Area Eraser (Stroke Slicing): erases only the specific path/points within the brush radius
        const dist = Math.hypot(to.x - from.x, to.y - from.y);
        const stepSize = Math.max(4, radius / 3);
        const steps = Math.max(1, Math.ceil(dist / stepSize));

        let workingElements = [...currentElements];

        for (let s = 1; s <= steps; s++) {
          const t = s / steps;
          const cx = from.x + (to.x - from.x) * t;
          const cy = from.y + (to.y - from.y) * t;

          const nextElements: CanvasElement[] = [];

          for (const el of workingElements) {
            if (el.type !== 'freehand' || el.data?.isLocked) {
              nextElements.push(el);
              continue;
            }

            const res = sliceStrokeAtPoint(el, cx, cy, radius);
            if (!res.modified) {
              nextElements.push(el);
            } else {
              // Stroke was sliced/trimmed in the specific area touched
              if (res.survivingPieces.length === 0) {
                // Entire stroke erased
                deleteElement(el.id);
                emitElementDelete(el.id);
              } else {
                // First piece updates the element
                const firstPiece = res.survivingPieces[0];
                updateElement(el.id, firstPiece);
                emitElementUpdate(firstPiece);
                nextElements.push(firstPiece);

                // Any split sub-strokes are created as separate elements
                for (let i = 1; i < res.survivingPieces.length; i++) {
                  const newPiece = res.survivingPieces[i];
                  addElement(newPiece, false);
                  emitElementCreate(newPiece);
                  nextElements.push(newPiece);
                }
              }
            }
          }

          workingElements = nextElements;
        }
      } else {
        // Object Eraser mode: deletes whole element when clicked
        const hit = currentElements
          .slice()
          .reverse()
          .find((el) => {
            if (el.data?.isLocked) return false;
            return isPointInBox(to, {
              minX: el.positionX - 6,
              minY: el.positionY - 6,
              maxX: el.positionX + Math.max(el.width, 16) + 6,
              maxY: el.positionY + Math.max(el.height, 16) + 6,
              width: Math.max(el.width, 16) + 12,
              height: Math.max(el.height, 16) + 12,
            });
          });

        if (hit) {
          deleteElement(hit.id);
          emitElementDelete(hit.id);
        }
      }
    },
    [
      eraserRadius,
      eraserMode,
      deleteElement,
      updateElement,
      addElement,
      emitElementDelete,
      emitElementUpdate,
      emitElementCreate,
    ],
  );

  // Mouse Down Handler
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const worldPos = screenToWorld(screenX, screenY, pan, zoom);

    // 1. Middle mouse or Hand tool or Spacebar pan
    if (e.button === 1 || currentTool === 'hand' || isSpacePressed) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    // Only left clicks handle tool actions
    if (e.button !== 0) return;

    // 2. Eraser Tool: Click or drag to erase
    if (currentTool === 'eraser') {
      setIsErasing(true);
      setLastEraserPos(worldPos);
      executeErase(worldPos, worldPos);
      return;
    }

    // 3. Freehand Tools (pen, pencil, highlighter)
    if (['pen', 'pencil', 'highlighter'].includes(currentTool)) {
      const activeColor = strokeColor || (currentTool === 'pencil' ? '#374151' : '#2D6A4F');
      const strokeId = crypto.randomUUID();
      setCurrentStrokeId(strokeId);
      const initialPoint = [worldPos.x, worldPos.y, 0.5];
      setCurrentStrokePoints([initialPoint]);
      const initialWidth = currentTool === 'pencil' ? 1.5 : (strokeWidth || 4);
      emitLiveStroke(strokeId, initialPoint, activeColor, initialWidth);
      return;
    }

    // 4. Sticky Note Tool: Click to place
    if (currentTool === 'sticky_note') {
      const newNote: CanvasElement = {
        id: crypto.randomUUID(),
        whiteboardId: boardId,
        type: 'sticky_note',
        positionX: Math.round(worldPos.x - 90),
        positionY: Math.round(worldPos.y - 90),
        width: 180,
        height: 180,
        rotation: 0,
        zIndex: elements.length + 1,
        data: {
          text: '',
          color: fillColor === 'transparent' ? '#FEF08A' : fillColor,
          fontSize: 16,
        },
      };
      addElement(newNote);
      emitElementCreate(newNote);
      setCurrentTool('select');
      return;
    }

    // 5. Text Tool: Click to place
    if (currentTool === 'text') {
      const newText: CanvasElement = {
        id: crypto.randomUUID(),
        whiteboardId: boardId,
        type: 'text',
        positionX: Math.round(worldPos.x),
        positionY: Math.round(worldPos.y),
        width: 160,
        height: 50,
        rotation: 0,
        zIndex: elements.length + 1,
        data: {
          text: '',
          fontSize: fontSize || 18,
          fontFamily: fontFamily || 'Inter',
          color: strokeColor || '#1A1A1A',
        },
      };
      addElement(newText);
      emitElementCreate(newText);
      setCurrentTool('select');
      return;
    }

    // 6. Shape & Connector Tools (rectangle, rounded_rect, circle, triangle, diamond, star, cylinder, line, arrow, connector)
    if (
      [
        'rectangle',
        'rounded_rect',
        'circle',
        'ellipse',
        'triangle',
        'diamond',
        'star',
        'cylinder',
        'line',
        'arrow',
        'connector',
      ].includes(currentTool)
    ) {
      setShapeStartPos(worldPos);
      setShapeCurrentPos(worldPos);
      return;
    }

    // 7. Select Tool: Check if clicking an element or empty background
    const clickedElement = [...elements]
      .reverse()
      .find((el) => {
        const pad = 10;
        return (
          worldPos.x >= el.positionX - pad &&
          worldPos.x <= el.positionX + Math.max(el.width, 16) + pad &&
          worldPos.y >= el.positionY - pad &&
          worldPos.y <= el.positionY + Math.max(el.height, 16) + pad
        );
      });

    if (clickedElement) {
      const isShift = e.shiftKey;
      if (isShift) {
        if (selectedIds.includes(clickedElement.id)) {
          setSelectedIds(selectedIds.filter((id) => id !== clickedElement.id));
        } else {
          setSelectedIds([...selectedIds, clickedElement.id]);
        }
      } else {
        if (!selectedIds.includes(clickedElement.id)) {
          setSelectedIds([clickedElement.id]);
        }
      }

      // Initialize dragging
      if (!clickedElement.data?.isLocked) {
        beforeMutationElements.current = [...elements];
        setIsDraggingElements(true);
        setDragStartPos(worldPos);
        const startMap = new Map();
        const toMove = selectedIds.includes(clickedElement.id)
          ? selectedElements
          : [clickedElement];
        toMove.forEach((el) =>
          startMap.set(el.id, { x: el.positionX, y: el.positionY }),
        );
        setElementStartPositions(startMap);
      }
    } else {
      // Clicked background: Start marquee selection
      clearSelection();
      setMarqueeStart(worldPos);
      setMarqueeBox({
        minX: worldPos.x,
        minY: worldPos.y,
        maxX: worldPos.x,
        maxY: worldPos.y,
        width: 0,
        height: 0,
      });
    }
  };

  // Mouse Move Handler
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const worldPos = screenToWorld(screenX, screenY, pan, zoom);

    // Track world cursor position for visual reticles
    setCursorWorldPos(worldPos);

    // Broadcast cursor position over socket
    emitCursorMove(worldPos.x, worldPos.y);

    // 0. Eraser tool in-progress
    if (currentTool === 'eraser' && isErasing) {
      const from = lastEraserPos || worldPos;
      executeErase(from, worldPos);
      setLastEraserPos(worldPos);
      return;
    }

    // 1. Panning canvas
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    // 2. Freehand drawing in-progress
    if (['pen', 'pencil', 'highlighter'].includes(currentTool) && currentStrokePoints.length > 0) {
      const activeColor = strokeColor || (currentTool === 'pencil' ? '#374151' : '#2D6A4F');
      const newPoint = [worldPos.x, worldPos.y, 0.5];
      setCurrentStrokePoints((prev) => [...prev, newPoint]);
      const currentWidth = currentTool === 'pencil' ? 1.5 : (strokeWidth || 4);
      emitLiveStroke(currentStrokeId, newPoint, activeColor, currentWidth);
      return;
    }

    // 3. Shape creation in-progress
    if (shapeStartPos) {
      setShapeCurrentPos(worldPos);
      return;
    }

    // 4. Marquee drag selection
    if (marqueeStart) {
      const minX = Math.min(marqueeStart.x, worldPos.x);
      const minY = Math.min(marqueeStart.y, worldPos.y);
      const maxX = Math.max(marqueeStart.x, worldPos.x);
      const maxY = Math.max(marqueeStart.y, worldPos.y);
      const box: BoundingBox = {
        minX,
        minY,
        maxX,
        maxY,
        width: maxX - minX,
        height: maxY - minY,
      };
      setMarqueeBox(box);

      // Select intersecting elements
      const intersecting = elements
        .filter((el) => boxesIntersect(box, getElementBoundingBox(el)))
        .map((el) => el.id);
      setSelectedIds(intersecting);
      return;
    }

    // 5. Dragging elements
    if (isDraggingElements) {
      const deltaX = worldPos.x - dragStartPos.x;
      const deltaY = worldPos.y - dragStartPos.y;

      // 3px deadzone prevents click jitter from breaking double-click editing
      if (Math.hypot(deltaX, deltaY) < 3) return;

      const batch = Array.from(elementStartPositions.entries()).map(
        ([id, start]) => ({
          id,
          changes: {
            positionX: Math.round(start.x + deltaX),
            positionY: Math.round(start.y + deltaY),
          },
        }),
      );

      updateElementsBatch(batch);
      return;
    }

    // 6. Resizing elements
    if (activeResizeHandle && resizeStartBBox) {
      const deltaX = worldPos.x - resizeStartPos.x;
      const deltaY = worldPos.y - resizeStartPos.y;

      let newX = resizeStartBBox.minX;
      let newY = resizeStartBBox.minY;
      let newW = resizeStartBBox.width;
      let newH = resizeStartBBox.height;

      if (activeResizeHandle.includes('e')) newW = Math.max(20, resizeStartBBox.width + deltaX);
      if (activeResizeHandle.includes('s')) newH = Math.max(20, resizeStartBBox.height + deltaY);
      if (activeResizeHandle.includes('w')) {
        const potentialW = resizeStartBBox.width - deltaX;
        if (potentialW > 20) {
          newX = resizeStartBBox.minX + deltaX;
          newW = potentialW;
        }
      }
      if (activeResizeHandle.includes('n')) {
        const potentialH = resizeStartBBox.height - deltaY;
        if (potentialH > 20) {
          newY = resizeStartBBox.minY + deltaY;
          newH = potentialH;
        }
      }

      const scaleX = newW / resizeStartBBox.width;
      const scaleY = newH / resizeStartBBox.height;

      const batch = selectedElements.map((el) => {
        const relX = el.positionX - resizeStartBBox.minX;
        const relY = el.positionY - resizeStartBBox.minY;
        return {
          id: el.id,
          changes: {
            positionX: Math.round(newX + relX * scaleX),
            positionY: Math.round(newY + relY * scaleY),
            width: Math.round(el.width * scaleX),
            height: Math.round(el.height * scaleY),
          },
        };
      });

      updateElementsBatch(batch);
      return;
    }

    // 7. Rotating elements
    if (isRotating && selectionBBox) {
      const angleRad = Math.atan2(
        worldPos.y - rotateCenter.y,
        worldPos.x - rotateCenter.x,
      );
      const angleDeg = Math.round((angleRad * 180) / Math.PI) + 90;

      selectedElements.forEach((el) => {
        updateElement(el.id, { rotation: angleDeg });
      });
      return;
    }
  };

  // Mouse Up Handler
  const handleMouseUp = (e: React.MouseEvent) => {
    // 0. End Eraser
    if (isErasing) {
      setIsErasing(false);
      setLastEraserPos(null);
    }

    // 1. End Pan
    if (isPanning) {
      setIsPanning(false);
    }

    // 2. Finalize Freehand Stroke
    if (['pen', 'pencil', 'highlighter'].includes(currentTool) && currentStrokePoints.length > 0) {
      const minX = Math.min(...currentStrokePoints.map((p) => p[0]));
      const minY = Math.min(...currentStrokePoints.map((p) => p[1]));
      const maxX = Math.max(...currentStrokePoints.map((p) => p[0]));
      const maxY = Math.max(...currentStrokePoints.map((p) => p[1]));

      // Normalize points relative to element top-left
      const normalizedPoints = currentStrokePoints.map(([x, y, p]) => [
        Math.round(x - minX),
        Math.round(y - minY),
        p ?? 0.5,
      ]);

      const newElement: CanvasElement = {
        id: currentStrokeId || crypto.randomUUID(),
        whiteboardId: boardId,
        type: 'freehand',
        positionX: Math.round(minX),
        positionY: Math.round(minY),
        width: Math.max(Math.round(maxX - minX), 10),
        height: Math.max(Math.round(maxY - minY), 10),
        rotation: 0,
        zIndex: elements.length + 1,
        data: {
          points: normalizedPoints,
          stroke: strokeColor || (currentTool === 'pencil' ? '#374151' : '#2D6A4F'),
          strokeWidth: currentTool === 'pencil' ? 1.5 : (strokeWidth || 4),
          tool: currentTool,
          opacity: currentTool === 'highlighter' ? 0.45 : currentTool === 'pencil' ? 0.85 : opacity,
        },
      };

      addElement(newElement, false);
      emitStrokeEnd(newElement);
      setCurrentStrokePoints([]);
      setCurrentStrokeId('');
    }

    // 3. Finalize Shape Creation
    if (shapeStartPos) {
      const p1 = shapeStartPos;
      const p2 = shapeCurrentPos || p1;
      const minX = Math.min(p1.x, p2.x);
      const minY = Math.min(p1.y, p2.y);
      const dx = Math.abs(p2.x - p1.x);
      const dy = Math.abs(p2.y - p1.y);

      const isConnector = currentTool === 'line' || currentTool === 'arrow' || currentTool === 'connector';
      const width = dx < 10 ? (isConnector ? 160 : 140) : Math.max(dx, 20);
      const height = dy < 10 ? (isConnector ? 40 : 100) : Math.max(dy, 20);
      const posX = dx < 10 ? p1.x - width / 2 : minX;
      const posY = dy < 10 ? p1.y - height / 2 : minY;

      const newShape: CanvasElement = {
        id: crypto.randomUUID(),
        whiteboardId: boardId,
        type: isConnector ? 'connector' : 'shape',
        positionX: Math.round(posX),
        positionY: Math.round(posY),
        width: Math.round(width),
        height: Math.round(height),
        rotation: 0,
        zIndex: elements.length + 1,
        data: {
          shapeType: currentTool === 'connector' ? 'arrow' : currentTool,
          fill: isConnector ? 'transparent' : (fillColor || 'transparent'),
          stroke: strokeColor || '#2D6A4F',
          strokeWidth: strokeWidth || 2,
          opacity: opacity ?? 1,
          text: '',
          endArrow: currentTool === 'arrow' || currentTool === 'connector',
        },
      };

      addElement(newShape);
      emitElementCreate(newShape);
      setSelectedIds([newShape.id]);
      setCurrentTool('select');
      setShapeStartPos(null);
      setShapeCurrentPos(null);
    }

    // 4. End Marquee
    if (marqueeStart) {
      setMarqueeStart(null);
      setMarqueeBox(null);
    }

    // 5. End Dragging
    if (isDraggingElements) {
      setIsDraggingElements(false);
      if (beforeMutationElements.current.length > 0) {
        pushSnapshot(beforeMutationElements.current);
      }
      emitBulkUpdate(selectedElements);
    }

    // 6. End Resizing
    if (activeResizeHandle) {
      setActiveResizeHandle(null);
      setResizeStartBBox(null);
      if (beforeMutationElements.current.length > 0) {
        pushSnapshot(beforeMutationElements.current);
      }
      emitBulkUpdate(selectedElements);
    }

    // 7. End Rotating
    if (isRotating) {
      setIsRotating(false);
      if (beforeMutationElements.current.length > 0) {
        pushSnapshot(beforeMutationElements.current);
      }
      emitBulkUpdate(selectedElements);
    }
  };

  // Handlers for selection layer transforms
  const handleResizeStart = (handle: ResizeHandle, e: React.MouseEvent) => {
    if (!selectionBBox || !containerRef.current) return;
    beforeMutationElements.current = [...elements];
    const rect = containerRef.current.getBoundingClientRect();
    const worldPos = screenToWorld(e.clientX - rect.left, e.clientY - rect.top, pan, zoom);

    setActiveResizeHandle(handle);
    setResizeStartBBox(selectionBBox);
    setResizeStartPos(worldPos);
  };

  const handleRotateStart = (e: React.MouseEvent) => {
    if (!selectionBBox) return;
    beforeMutationElements.current = [...elements];
    setIsRotating(true);
    setRotateCenter({
      x: selectionBBox.minX + selectionBBox.width / 2,
      y: selectionBBox.minY + selectionBBox.height / 2,
    });
  };

  const { theme } = useThemeStore();
  const isDarkTheme = theme === 'dark' || gridMode === 'dark';

  // Grid background CSS calculation
  const getGridStyle = () => {
    const bgColor = isDarkTheme ? '#0B0F19' : '#F8F9FA';
    const dotColor = isDarkTheme ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)';
    const gridLineColor = isDarkTheme ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

    switch (gridMode) {
      case 'grid':
        return {
          backgroundColor: bgColor,
          backgroundImage: `linear-gradient(to right, ${gridLineColor} 1px, transparent 1px), linear-gradient(to bottom, ${gridLineColor} 1px, transparent 1px)`,
          backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        };
      case 'plain':
        return {
          backgroundColor: isDarkTheme ? '#0B0F19' : '#FFFFFF',
        };
      case 'dark':
        return {
          backgroundColor: '#0F172A',
          backgroundImage:
            'radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)',
          backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        };
      case 'dots':
      default:
        return {
          backgroundColor: bgColor,
          backgroundImage: `radial-gradient(${dotColor} 1.2px, transparent 1.2px)`,
          backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        };
    }
  };

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        if (isErasing) {
          setIsErasing(false);
          setLastEraserPos(null);
        }
        setCursorWorldPos(null);
      }}
      onContextMenu={(e) => e.preventDefault()}
      style={getGridStyle()}
      className={`w-full h-full relative overflow-hidden select-none ${
        currentTool === 'hand' || isSpacePressed
          ? isPanning
            ? 'cursor-grabbing'
            : 'cursor-grab'
          : currentTool === 'pen' || currentTool === 'pencil' || currentTool === 'highlighter'
          ? 'cursor-crosshair'
          : currentTool === 'eraser'
          ? 'cursor-cell'
          : [
              'rectangle',
              'rounded_rect',
              'circle',
              'ellipse',
              'triangle',
              'diamond',
              'star',
              'cylinder',
              'line',
              'arrow',
              'connector',
            ].includes(currentTool)
          ? 'cursor-crosshair'
          : 'cursor-default'
      }`}
    >
      {/* World Canvas Transformation Container */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      >
        {/* Render Persisted Elements */}
        {elements.map((el) => (
          <CanvasElementRenderer
            key={el.id}
            element={el}
            isSelected={selectedIds.includes(el.id)}
            onUpdate={handleElementUpdate}
            onEditChart={onEditChart}
          />
        ))}

        {/* Live In-Progress Freehand Stroke */}
        {currentStrokePoints.length > 0 && (
          <svg className="w-full h-full overflow-visible pointer-events-none">
            <path
              d={renderFreehandStroke(
                currentStrokePoints,
                currentTool === 'pencil' ? 1.5 : (strokeWidth || 4),
                currentTool === 'highlighter' ? 0 : currentTool === 'pencil' ? 0.6 : 0.5,
                currentTool === 'pencil' ? 0.3 : 0.5,
              )}
              fill={strokeColor || (currentTool === 'pencil' ? '#374151' : '#2D6A4F')}
              opacity={currentTool === 'highlighter' ? 0.45 : currentTool === 'pencil' ? 0.85 : opacity}
            />
          </svg>
        )}

        {/* Live In-Progress Shape Creation Preview */}
        {shapeStartPos && shapeCurrentPos && (
          <div
            style={{
              position: 'absolute',
              left: `${Math.min(shapeStartPos.x, shapeCurrentPos.x)}px`,
              top: `${Math.min(shapeStartPos.y, shapeCurrentPos.y)}px`,
              width: `${Math.max(Math.abs(shapeCurrentPos.x - shapeStartPos.x), 5)}px`,
              height: `${Math.max(Math.abs(shapeCurrentPos.y - shapeStartPos.y), 5)}px`,
              border: `2px dashed ${strokeColor || '#2D6A4F'}`,
              backgroundColor:
                fillColor === 'transparent'
                  ? 'rgba(45, 106, 79, 0.08)'
                  : fillColor,
              borderRadius:
                currentTool === 'circle'
                  ? '9999px'
                  : currentTool === 'rounded_rect'
                  ? '16px'
                  : '4px',
              pointerEvents: 'none',
              zIndex: 9998,
            }}
          />
        )}

        {/* Selection Box & Resize Handles (Only shown in Select tool) */}
        {currentTool === 'select' && (
          <SelectionLayer
            boundingBox={selectionBBox}
            marqueeBox={marqueeBox}
            isLocked={isSelectedLocked}
            onResizeStart={handleResizeStart}
            onRotateStart={handleRotateStart}
          />
        )}

        {/* Visual Eraser Reticle */}
        {currentTool === 'eraser' && cursorWorldPos && (
          <div
            style={{
              position: 'absolute',
              left: `${cursorWorldPos.x - (eraserRadius || 16)}px`,
              top: `${cursorWorldPos.y - (eraserRadius || 16)}px`,
              width: `${(eraserRadius || 16) * 2}px`,
              height: `${(eraserRadius || 16) * 2}px`,
              borderRadius: '9999px',
              border: '2px solid rgba(239, 68, 68, 0.95)',
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)',
              pointerEvents: 'none',
              zIndex: 9999,
              transform: 'translate3d(0,0,0)',
            }}
          >
            <div className="absolute inset-0 m-auto w-1.5 h-1.5 rounded-full bg-red-600" />
          </div>
        )}

        {/* Collaborators' Live Moving Cursors */}
        {Object.values(userCursors).map((cursor) => (
          <div
            key={cursor.socketId}
            style={{
              position: 'absolute',
              left: `${cursor.x}px`,
              top: `${cursor.y}px`,
              transform: 'translate(-2px, -2px)',
              pointerEvents: 'none',
              zIndex: 9999,
              transition: 'all 50ms linear',
            }}
            className="flex items-start gap-1 select-none"
          >
            <svg
              className="w-4 h-4 drop-shadow-md"
              viewBox="0 0 24 24"
              fill={cursor.color || '#2D6A4F'}
            >
              <path d="M4 2l16 11.5-6.5 1.5 4 7-2.5 1.5-4-7-5 5.5z" />
            </svg>
            <span
              className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded-md shadow-md whitespace-nowrap"
              style={{ backgroundColor: cursor.color || '#2D6A4F' }}
            >
              {cursor.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
