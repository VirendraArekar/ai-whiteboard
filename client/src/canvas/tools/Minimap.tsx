import React, { useRef, useEffect, useState, useCallback } from 'react';
import { MapPin, ChevronDown, ChevronUp, Compass } from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';
import { getElementsBoundingBox, screenToWorld } from '../utils/coordinates';

export const Minimap: React.FC = () => {
  const { elements, pan, zoom, setPan } = useCanvasStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const MAP_WIDTH = 180;
  const MAP_HEIGHT = 120;
  const PADDING = 400;

  const drawMinimap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || isCollapsed) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Viewport window dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // World bounding box of all elements plus current viewport
    const contentBBox = getElementsBoundingBox(elements) || {
      minX: -500,
      minY: -400,
      maxX: 1500,
      maxY: 1200,
    };

    // Calculate current viewport in world coords
    const viewWorldMin = screenToWorld(0, 0, pan, zoom);
    const viewWorldMax = screenToWorld(viewportWidth, viewportHeight, pan, zoom);

    const worldMinX = Math.min(contentBBox.minX - PADDING, viewWorldMin.x - PADDING);
    const worldMinY = Math.min(contentBBox.minY - PADDING, viewWorldMin.y - PADDING);
    const worldMaxX = Math.max(contentBBox.maxX + PADDING, viewWorldMax.x + PADDING);
    const worldMaxY = Math.max(contentBBox.maxY + PADDING, viewWorldMax.y + PADDING);

    const worldWidth = Math.max(worldMaxX - worldMinX, 1000);
    const worldHeight = Math.max(worldMaxY - worldMinY, 800);

    const scale = Math.min(MAP_WIDTH / worldWidth, MAP_HEIGHT / worldHeight);

    // Clear
    ctx.clearRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

    // Draw elements
    elements.forEach((el) => {
      const rx = (el.positionX - worldMinX) * scale;
      const ry = (el.positionY - worldMinY) * scale;
      const rw = Math.max(el.width * scale, 3);
      const rh = Math.max(el.height * scale, 3);

      switch (el.type) {
        case 'sticky_note':
        case 'sticky':
          ctx.fillStyle = el.data?.color || '#FEF08A';
          break;
        case 'chart':
          ctx.fillStyle = '#60A5FA';
          break;
        case 'image':
          ctx.fillStyle = '#A78BFA';
          break;
        default:
          ctx.fillStyle = el.data?.fillColor || '#40916C';
      }

      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(rx, ry, rw, rh, 2) : ctx.rect(rx, ry, rw, rh);
      ctx.fill();
    });

    // Draw Viewport Rect
    const vx = (viewWorldMin.x - worldMinX) * scale;
    const vy = (viewWorldMin.y - worldMinY) * scale;
    const vw = (viewWorldMax.x - viewWorldMin.x) * scale;
    const vh = (viewWorldMax.y - viewWorldMin.y) * scale;

    ctx.fillStyle = 'rgba(45, 106, 79, 0.15)';
    ctx.strokeStyle = '#2D6A4F';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.rect(vx, vy, vw, vh);
    ctx.fill();
    ctx.stroke();
  }, [elements, pan, zoom, isCollapsed]);

  useEffect(() => {
    drawMinimap();
  }, [drawMinimap]);

  const handleMinimapClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const contentBBox = getElementsBoundingBox(elements) || {
      minX: -500,
      minY: -400,
      maxX: 1500,
      maxY: 1200,
    };

    const viewWorldMin = screenToWorld(0, 0, pan, zoom);
    const viewWorldMax = screenToWorld(viewportWidth, viewportHeight, pan, zoom);

    const worldMinX = Math.min(contentBBox.minX - PADDING, viewWorldMin.x - PADDING);
    const worldMinY = Math.min(contentBBox.minY - PADDING, viewWorldMin.y - PADDING);
    const worldMaxX = Math.max(contentBBox.maxX + PADDING, viewWorldMax.x + PADDING);
    const worldMaxY = Math.max(contentBBox.maxY + PADDING, viewWorldMax.y + PADDING);

    const worldWidth = Math.max(worldMaxX - worldMinX, 1000);
    const worldHeight = Math.max(worldMaxY - worldMinY, 800);

    const scale = Math.min(MAP_WIDTH / worldWidth, MAP_HEIGHT / worldHeight);

    // Target world center
    const targetWorldX = worldMinX + clickX / scale;
    const targetWorldY = worldMinY + clickY / scale;

    setPan({
      x: viewportWidth / 2 - targetWorldX * zoom,
      y: viewportHeight / 2 - targetWorldY * zoom,
    });
  };

  return (
    <div className="absolute bottom-6 right-6 z-30 select-none">
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/80 dark:border-gray-800 p-2 overflow-hidden transition-all">
        {/* Header bar */}
        <div className="flex items-center justify-between pb-1 px-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-700 dark:text-gray-300 font-heading">
            <Compass className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-emerald-400" />
            <span>Radar Minimap</span>
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5 rounded cursor-pointer"
            title={isCollapsed ? 'Expand Minimap' : 'Collapse Minimap'}
          >
            {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Canvas Radar */}
        {!isCollapsed && (
          <canvas
            ref={canvasRef}
            width={MAP_WIDTH}
            height={MAP_HEIGHT}
            onClick={handleMinimapClick}
            className="rounded-xl border border-gray-100 dark:border-gray-800 bg-[#F8F9FA] dark:bg-gray-950 cursor-crosshair shadow-inner"
            title="Click anywhere to pan canvas"
          />
        )}
      </div>
    </div>
  );
};
