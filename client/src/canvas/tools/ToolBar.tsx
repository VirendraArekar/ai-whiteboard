import React, { useState } from 'react';
import {
  MousePointer2,
  Hand,
  Pen,
  Pencil,
  Highlighter,
  Eraser,
  Type,
  StickyNote,
  Square,
  Circle,
  Triangle,
  Diamond,
  Star,
  Database,
  Minus,
  ArrowRight,
  BarChart2,
  Image as ImageIcon,
  Sparkles,
  ChevronDown,
  Palette,
} from 'lucide-react';
import { CanvasTool } from '../../types';
import { useCanvasStore } from '../../store/canvasStore';
import { useCollaborationStore } from '../../store/collaborationStore';
import { useAiStore } from '../../store/aiStore';

const TOOLBAR_COLORS = [
  '#2D6A4F', // Forest green
  '#1B4332', // Dark forest
  '#E63946', // Coral red
  '#457B9D', // Steel blue
  '#E76F51', // Burnt orange
  '#9B5DE5', // Purple
  '#1F2937', // Dark slate
  '#FEF08A', // Yellow pastel
  '#BAF7D0', // Green pastel
  '#BFDBFE', // Blue pastel
  '#FBCFE8', // Pink pastel
  '#FFFFFF', // White
  'transparent',
];

const QUICK_DRAW_COLORS = [
  '#1E1E1E', // Black / Dark slate
  '#E63946', // Red
  '#2D6A4F', // Forest green
  '#1D4ED8', // Royal blue
  '#D97706', // Orange
  '#9B5DE5', // Purple
];

const STROKE_WIDTH_OPTIONS = [
  { label: 'S', width: 2, title: 'Thin (2px)' },
  { label: 'M', width: 4, title: 'Medium (4px)' },
  { label: 'L', width: 8, title: 'Thick (8px)' },
];

export interface ToolBarProps {
  onImageUploadClick: () => void;
  onAddChartClick: () => void;
}

export const ToolBar: React.FC<ToolBarProps> = ({
  onImageUploadClick,
  onAddChartClick,
}) => {
  const {
    currentTool,
    setCurrentTool,
    clearSelection,
    strokeColor,
    fillColor,
    strokeWidth,
    setStrokeColor,
    setFillColor,
    setStrokeWidth,
    selectedIds,
    elements,
    updateElement,
    eraserMode,
    eraserRadius,
    setEraserMode,
    setEraserRadius,
  } = useCanvasStore();
  const { emitElementUpdate } = useCollaborationStore();
  const { toggleAiDrawer, isAiDrawerOpen } = useAiStore();
  const [shapesDropdownOpen, setShapesDropdownOpen] = useState(false);
  const [strokePickerOpen, setStrokePickerOpen] = useState(false);
  const [fillPickerOpen, setFillPickerOpen] = useState(false);

  const selectTool = (tool: CanvasTool) => {
    setCurrentTool(tool);
    if (tool !== 'select') {
      clearSelection();
    }
  };

  const handlePickStroke = (color: string) => {
    setStrokeColor(color);
    if (selectedIds.length > 0) {
      elements
        .filter((el) => selectedIds.includes(el.id))
        .forEach((el) => {
          const updated = {
            ...el,
            data: { ...el.data, stroke: color, color },
          };
          updateElement(el.id, updated);
          emitElementUpdate(updated);
        });
    }
    setStrokePickerOpen(false);
  };

  const handlePickFill = (color: string) => {
    setFillColor(color);
    if (selectedIds.length > 0) {
      elements
        .filter((el) => selectedIds.includes(el.id))
        .forEach((el) => {
          const isSticky = el.type === 'sticky_note';
          const updated = {
            ...el,
            data: {
              ...el.data,
              [isSticky ? 'color' : 'fill']: color,
            },
          };
          updateElement(el.id, updated);
          emitElementUpdate(updated);
        });
    }
    setFillPickerOpen(false);
  };

  const isShapeTool = [
    'rectangle',
    'rounded_rect',
    'circle',
    'triangle',
    'diamond',
    'star',
    'cylinder',
    'line',
    'arrow',
  ].includes(currentTool);

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 p-1.5 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/80 dark:border-gray-800 select-none transition-colors">
      {/* Select Tool */}
      <button
        onClick={() => selectTool('select')}
        className={`p-2 rounded-xl transition-all cursor-pointer ${
          currentTool === 'select'
            ? 'bg-[#E8F5E9] dark:bg-emerald-950/60 text-[#1B4332] dark:text-emerald-300 shadow-xs'
            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
        title="Select & Move (V)"
      >
        <MousePointer2 className="w-4 h-4" />
      </button>

      {/* Hand Tool */}
      <button
        onClick={() => selectTool('hand')}
        className={`p-2 rounded-xl transition-all cursor-pointer ${
          currentTool === 'hand'
            ? 'bg-[#E8F5E9] dark:bg-emerald-950/60 text-[#1B4332] dark:text-emerald-300 shadow-xs'
            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
        title="Pan Canvas (H or Spacebar)"
      >
        <Hand className="w-4 h-4" />
      </button>

      <div className="w-[1px] h-6 bg-gray-200 dark:bg-gray-800 mx-0.5" />

      {/* Freehand Pen */}
      <button
        onClick={() => selectTool('pen')}
        className={`p-2 rounded-xl transition-all cursor-pointer ${
          currentTool === 'pen'
            ? 'bg-[#E8F5E9] dark:bg-emerald-950/60 text-[#1B4332] dark:text-emerald-300 shadow-xs'
            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
        title="Pen Tool (P)"
      >
        <Pen className="w-4 h-4" />
      </button>

      {/* Pencil Tool */}
      <button
        onClick={() => selectTool('pencil')}
        className={`p-2 rounded-xl transition-all cursor-pointer ${
          currentTool === 'pencil'
            ? 'bg-[#E8F5E9] dark:bg-emerald-950/60 text-[#1B4332] dark:text-emerald-300 shadow-xs'
            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
        title="Pencil Tool (B)"
      >
        <Pencil className="w-4 h-4" />
      </button>

      {/* Highlighter */}
      <button
        onClick={() => selectTool('highlighter')}
        className={`p-2 rounded-xl transition-all cursor-pointer ${
          currentTool === 'highlighter'
            ? 'bg-[#E8F5E9] dark:bg-emerald-950/60 text-[#1B4332] dark:text-emerald-300 shadow-xs'
            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
        title="Highlighter Tool"
      >
        <Highlighter className="w-4 h-4" />
      </button>

      {/* Eraser */}
      <button
        onClick={() => selectTool('eraser')}
        className={`p-2 rounded-xl transition-all cursor-pointer ${
          currentTool === 'eraser'
            ? 'bg-[#E8F5E9] dark:bg-emerald-950/60 text-[#1B4332] dark:text-emerald-300 shadow-xs'
            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
        title="Eraser Tool (E) - Click or Drag to erase"
      >
        <Eraser className="w-4 h-4" />
      </button>

      <div className="w-[1px] h-6 bg-gray-200 dark:bg-gray-800 mx-0.5" />

      {/* Sticky Note */}
      <button
        onClick={() => selectTool('sticky_note')}
        className={`p-2 rounded-xl transition-all cursor-pointer ${
          currentTool === 'sticky_note'
            ? 'bg-[#E8F5E9] dark:bg-emerald-950/60 text-[#1B4332] dark:text-emerald-300 shadow-xs'
            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
        title="Sticky Note (S)"
      >
        <StickyNote className="w-4 h-4" />
      </button>

      {/* Text Tool */}
      <button
        onClick={() => selectTool('text')}
        className={`p-2 rounded-xl transition-all cursor-pointer ${
          currentTool === 'text'
            ? 'bg-[#E8F5E9] dark:bg-emerald-950/60 text-[#1B4332] dark:text-emerald-300 shadow-xs'
            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
        title="Text (T)"
      >
        <Type className="w-4 h-4" />
      </button>

      {/* Shapes Dropdown */}
      <div className="relative">
        <button
          onClick={() => setShapesDropdownOpen(!shapesDropdownOpen)}
          className={`flex items-center gap-1 p-2 rounded-xl transition-all cursor-pointer ${
            isShapeTool
              ? 'bg-[#E8F5E9] dark:bg-emerald-950/60 text-[#1B4332] dark:text-emerald-300 shadow-xs'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
          title="Geometric Shapes (R)"
        >
          <Square className="w-4 h-4" />
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </button>

        {shapesDropdownOpen && (
          <div
            className="absolute top-full left-0 mt-2 p-2 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 grid grid-cols-3 gap-1 z-50 w-44"
            onMouseLeave={() => setShapesDropdownOpen(false)}
          >
            {(
              [
                { tool: 'rectangle', label: 'Rectangle', icon: Square },
                { tool: 'circle', label: 'Circle', icon: Circle },
                { tool: 'triangle', label: 'Triangle', icon: Triangle },
                { tool: 'diamond', label: 'Diamond', icon: Diamond },
                { tool: 'star', label: 'Star', icon: Star },
                { tool: 'cylinder', label: 'Database', icon: Database },
                { tool: 'line', label: 'Line', icon: Minus },
                { tool: 'arrow', label: 'Arrow', icon: ArrowRight },
              ] as const
            ).map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.tool}
                  onClick={() => {
                    selectTool(s.tool as any);
                    setShapesDropdownOpen(false);
                  }}
                  className={`p-2.5 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 transition-colors cursor-pointer ${
                    currentTool === s.tool ? 'bg-[#E8F5E9] dark:bg-emerald-950/60 text-[#2D6A4F] dark:text-emerald-400' : ''
                  }`}
                  title={s.label}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Line Tool */}
      <button
        onClick={() => selectTool('line')}
        className={`p-2 rounded-xl transition-all cursor-pointer ${
          currentTool === 'line'
            ? 'bg-[#E8F5E9] dark:bg-emerald-950/60 text-[#1B4332] dark:text-emerald-300 shadow-xs'
            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
        title="Line Tool (L)"
      >
        <Minus className="w-4 h-4" />
      </button>

      {/* Arrow / Connector */}
      <button
        onClick={() => selectTool('arrow')}
        className={`p-2 rounded-xl transition-all cursor-pointer ${
          currentTool === 'arrow'
            ? 'bg-[#E8F5E9] dark:bg-emerald-950/60 text-[#1B4332] dark:text-emerald-300 shadow-xs'
            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
        title="Arrow Tool (A)"
      >
        <ArrowRight className="w-4 h-4" />
      </button>

      {/* Chart Tool */}
      <button
        onClick={onAddChartClick}
        className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer"
        title="Insert Editable Chart"
      >
        <BarChart2 className="w-4 h-4" />
      </button>

      {/* Image Upload */}
      <button
        onClick={onImageUploadClick}
        className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer"
        title="Upload Image"
      >
        <ImageIcon className="w-4 h-4" />
      </button>

      <div className="w-[1px] h-6 bg-gray-200 dark:bg-gray-800 mx-0.5" />

      {/* Quick Draw Swatches */}
      <div className="flex items-center gap-1 px-1">
        {QUICK_DRAW_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => handlePickStroke(c)}
            className={`w-4 h-4 rounded-full transition-transform cursor-pointer border ${
              strokeColor === c
                ? 'ring-2 ring-emerald-500 scale-125 border-white dark:border-gray-900 shadow-xs'
                : 'border-black/15 dark:border-white/20 hover:scale-115'
            }`}
            style={{ backgroundColor: c }}
            title={`Draw Color ${c}`}
          />
        ))}
      </div>

      {/* Stroke Width Selector (active when drawing with pen, pencil, or highlighter) */}
      {['pen', 'pencil', 'highlighter'].includes(currentTool) && (
        <div className="flex items-center gap-0.5 px-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
          {STROKE_WIDTH_OPTIONS.map((sw) => (
            <button
              key={sw.width}
              onClick={() => setStrokeWidth(sw.width)}
              className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md transition-colors cursor-pointer ${
                strokeWidth === sw.width
                  ? 'bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
              title={sw.title}
            >
              {sw.label}
            </button>
          ))}
        </div>
      )}

      {/* Eraser Controls (active when eraser tool is selected) */}
      {currentTool === 'eraser' && (
        <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl">
          {/* Mode Switch: Area Brush (Partial) vs Whole Object */}
          <div className="flex items-center gap-0.5 bg-white dark:bg-gray-800 rounded-lg p-0.5 shadow-2xs">
            <button
              onClick={() => setEraserMode('area')}
              className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-colors cursor-pointer ${
                eraserMode === 'area'
                  ? 'bg-red-500 text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Area Eraser: Erases only the specific brushed area on drawings"
            >
              Area Brush
            </button>
            <button
              onClick={() => setEraserMode('object')}
              className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition-colors cursor-pointer ${
                eraserMode === 'object'
                  ? 'bg-red-500 text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Object Eraser: Deletes the whole element"
            >
              Whole Object
            </button>
          </div>

          {/* Size Pills: S (10px), M (16px), L (28px) */}
          <div className="flex items-center gap-0.5">
            {[
              { label: 'S', r: 10, title: 'Small Brush (10px)' },
              { label: 'M', r: 16, title: 'Medium Brush (16px)' },
              { label: 'L', r: 28, title: 'Large Brush (28px)' },
            ].map((size) => (
              <button
                key={size.r}
                onClick={() => setEraserRadius(size.r)}
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md transition-colors cursor-pointer ${
                  eraserRadius === size.r
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50'
                }`}
                title={size.title}
              >
                {size.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Full Stroke Palette Popover */}
      <div className="relative">
        <button
          onClick={() => {
            setStrokePickerOpen(!strokePickerOpen);
            setFillPickerOpen(false);
          }}
          className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-1 cursor-pointer"
          title="More Stroke Colors"
        >
          <div
            className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600 shadow-xs"
            style={{ backgroundColor: strokeColor || '#2D6A4F' }}
          />
        </button>

        {strokePickerOpen && (
          <div
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 p-2 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 grid grid-cols-4 gap-1.5 z-50 w-36"
            onMouseLeave={() => setStrokePickerOpen(false)}
          >
            {TOOLBAR_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => handlePickStroke(c)}
                className="w-6 h-6 rounded-full border border-gray-200 dark:border-gray-700 hover:scale-115 transition-transform cursor-pointer"
                style={{ backgroundColor: c === 'transparent' ? '#ffffff' : c }}
                title={c}
              />
            ))}
          </div>
        )}
      </div>

      <div className="relative">
        <button
          onClick={() => {
            setFillPickerOpen(!fillPickerOpen);
            setStrokePickerOpen(false);
          }}
          className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-1 cursor-pointer"
          title="Shape Fill Color"
        >
          <Palette className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
          <div
            className="w-3.5 h-3.5 rounded-full border border-gray-300 dark:border-gray-600 shadow-xs"
            style={{ backgroundColor: fillColor === 'transparent' ? '#ffffff' : fillColor }}
          />
        </button>

        {fillPickerOpen && (
          <div
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 p-2 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 grid grid-cols-4 gap-1.5 z-50 w-36"
            onMouseLeave={() => setFillPickerOpen(false)}
          >
            {TOOLBAR_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => handlePickFill(c)}
                className="w-6 h-6 rounded-full border border-gray-200 dark:border-gray-700 hover:scale-115 transition-transform cursor-pointer"
                style={{ backgroundColor: c === 'transparent' ? '#ffffff' : c }}
                title={c}
              />
            ))}
          </div>
        )}
      </div>

      <div className="w-[1px] h-6 bg-gray-200 dark:bg-gray-800 mx-0.5" />

      {/* AI Assistant Button */}
      <button
        onClick={toggleAiDrawer}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer ${
          isAiDrawerOpen
            ? 'bg-[#1B4332] dark:bg-emerald-800 text-white'
            : 'bg-gradient-to-r from-[#2D6A4F] to-[#40916C] text-white hover:shadow-md hover:scale-102'
        }`}
        title="Open Gemini AI Assistant"
      >
        <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
        <span>Gemini AI</span>
      </button>
    </div>
  );
};
