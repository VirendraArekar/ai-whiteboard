import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  Undo2,
  Redo2,
} from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';
import { useCollaborationStore } from '../../store/collaborationStore';
import { syncHistoryChange } from '../utils/historySync';

export const ZoomControls: React.FC = () => {
  const {
    zoom,
    setZoom,
    setPan,
    gridMode,
    setGridMode,
    undo,
    redo,
    past,
    future,
    elements,
  } = useCanvasStore();

  const collabEmitter = useCollaborationStore();

  const handleUndo = () => {
    const before = [...elements];
    const after = undo();
    if (after) {
      syncHistoryChange(before, after, collabEmitter);
    }
  };

  const handleRedo = () => {
    const before = [...elements];
    const after = redo();
    if (after) {
      syncHistoryChange(before, after, collabEmitter);
    }
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.15, 5));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.15, 0.1));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const gridModes = [
    { id: 'dots', label: 'Dots' },
    { id: 'grid', label: 'Grid' },
    { id: 'plain', label: 'Plain' },
    { id: 'dark', label: 'Dark' },
  ] as const;

  return (
    <div className="absolute bottom-6 left-6 z-40 flex items-center gap-2 select-none transition-colors">
      {/* Undo & Redo */}
      <div className="flex items-center p-1 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800">
        <button
          onClick={handleUndo}
          disabled={past.length === 0}
          className="p-2 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={handleRedo}
          disabled={future.length === 0}
          className="p-2 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center gap-1 p-1 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800">
        <button
          onClick={handleZoomOut}
          className="p-2 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          title="Zoom Out (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          onClick={handleReset}
          className="px-2 py-1 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg min-w-[50px] text-center cursor-pointer"
          title="Reset to 100%"
        >
          {Math.round(zoom * 100)}%
        </button>

        <button
          onClick={handleZoomIn}
          className="p-2 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          title="Zoom In (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
      </div>

      {/* Grid Mode Selector */}
      <div className="flex items-center p-1 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800">
        {gridModes.map((m) => (
          <button
            key={m.id}
            onClick={() => setGridMode(m.id)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
              gridMode === m.id
                ? 'bg-[#E8F5E9] dark:bg-emerald-950/80 text-[#1B4332] dark:text-emerald-300 shadow-xs'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
};
