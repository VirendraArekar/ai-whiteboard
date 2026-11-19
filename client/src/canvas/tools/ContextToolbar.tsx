import React, { useState } from 'react';
import {
  Palette,
  Minus,
  Lock,
  Unlock,
  Copy,
  Trash2,
  ChevronUp,
  ChevronDown,
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Sun,
} from 'lucide-react';
import { useCanvasStore } from '../../store/canvasStore';
import { useCollaborationStore } from '../../store/collaborationStore';
import { useAiStore } from '../../store/aiStore';
import { notify } from '../../utils/toast';

const COLOR_PALETTE = [
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

export const ContextToolbar: React.FC = () => {
  const {
    elements,
    selectedIds,
    currentTool,
    updateElement,
    updateElementsBatch,
    duplicateSelected,
    deleteSelected,
    bringForward,
    sendBackward,
    toggleLockSelected,
  } = useCanvasStore();

  const {
    emitElementCreate,
    emitElementUpdate,
    emitElementDelete,
    emitBulkUpdate,
  } = useCollaborationStore();

  const { setAiDrawerOpen, setActiveAiTab } = useAiStore();

  const [strokePickerOpen, setStrokePickerOpen] = useState(false);
  const [fillPickerOpen, setFillPickerOpen] = useState(false);
  const [opacityPickerOpen, setOpacityPickerOpen] = useState(false);

  if (selectedIds.length === 0 || currentTool !== 'select') return null;

  const selectedElements = elements.filter((el) => selectedIds.includes(el.id));
  const isLocked = selectedElements.some((el) => el.data?.isLocked);
  const isMulti = selectedElements.length > 1;
  const first = selectedElements[0];
  const hasTextCapability =
    first?.type === 'text' ||
    first?.type === 'sticky_note' ||
    first?.type === 'shape';

  const handleTextStyleChange = (
    key: 'fontSize' | 'fontFamily' | 'fontWeight' | 'fontStyle' | 'textAlign',
    val: any,
  ) => {
    for (const el of selectedElements) {
      const updated = {
        ...el,
        data: {
          ...el.data,
          [key]: val,
        },
      };
      updateElement(el.id, updated);
      emitElementUpdate(updated);
    }
  };

  const handleOpacityChange = (opacity: number) => {
    for (const el of selectedElements) {
      const updated = {
        ...el,
        data: {
          ...el.data,
          opacity,
        },
      };
      updateElement(el.id, updated);
      emitElementUpdate(updated);
    }
  };

  const handleColorChange = (key: 'stroke' | 'fill' | 'color', color: string) => {
    for (const el of selectedElements) {
      const isStrokeOnly =
        el.type === 'freehand' ||
        el.type === 'line' ||
        el.type === 'arrow' ||
        el.type === 'connector';

      const targetKey = isStrokeOnly
        ? 'stroke'
        : el.type === 'sticky_note'
        ? 'color'
        : key;

      const updated = {
        ...el,
        data: {
          ...el.data,
          [targetKey]: color,
          ...(isStrokeOnly ? { stroke: color } : {}),
          ...(el.type === 'image' && key === 'stroke'
            ? { strokeWidth: el.data?.strokeWidth || 2 }
            : {}),
        },
      };
      updateElement(el.id, updated);
      emitElementUpdate(updated);
    }
  };

  const handleStrokeWidth = (width: number) => {
    for (const el of selectedElements) {
      const updated = {
        ...el,
        data: {
          ...el.data,
          strokeWidth: width,
        },
      };
      updateElement(el.id, updated);
      emitElementUpdate(updated);
    }
  };

  // Alignment functions
  const alignLeft = () => {
    const minX = Math.min(...selectedElements.map((e) => e.positionX));
    const batch = selectedElements.map((e) => ({ id: e.id, changes: { positionX: minX } }));
    updateElementsBatch(batch);
    emitBulkUpdate(selectedElements.map((e) => ({ ...e, positionX: minX })));
    notify.info('Aligned elements to left', 'Alignment');
  };

  const alignCenter = () => {
    const minX = Math.min(...selectedElements.map((e) => e.positionX));
    const maxX = Math.max(...selectedElements.map((e) => e.positionX + e.width));
    const center = (minX + maxX) / 2;
    const batch = selectedElements.map((e) => ({
      id: e.id,
      changes: { positionX: Math.round(center - e.width / 2) },
    }));
    updateElementsBatch(batch);
    emitBulkUpdate(selectedElements.map((e) => ({ ...e, positionX: Math.round(center - e.width / 2) })));
    notify.info('Centered elements horizontally', 'Alignment');
  };

  const alignRight = () => {
    const maxX = Math.max(...selectedElements.map((e) => e.positionX + e.width));
    const batch = selectedElements.map((e) => ({
      id: e.id,
      changes: { positionX: maxX - e.width },
    }));
    updateElementsBatch(batch);
    emitBulkUpdate(selectedElements.map((e) => ({ ...e, positionX: maxX - e.width })));
    notify.info('Aligned elements to right', 'Alignment');
  };

  const alignTop = () => {
    const minY = Math.min(...selectedElements.map((e) => e.positionY));
    const batch = selectedElements.map((e) => ({ id: e.id, changes: { positionY: minY } }));
    updateElementsBatch(batch);
    emitBulkUpdate(selectedElements.map((e) => ({ ...e, positionY: minY })));
    notify.info('Aligned elements to top', 'Alignment');
  };

  return (
    <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 p-1 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 select-none animate-in fade-in zoom-in-95 duration-100 transition-colors">
      {/* Stroke Color Button */}
      <div className="relative">
        <button
          onClick={() => {
            setStrokePickerOpen(!strokePickerOpen);
            setFillPickerOpen(false);
          }}
          className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-1 text-gray-700 dark:text-gray-200 cursor-pointer"
          title="Stroke / Border Color"
        >
          <div
            className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600 shadow-xs"
            style={{ backgroundColor: first?.data?.stroke || '#2D6A4F' }}
          />
        </button>

        {strokePickerOpen && (
          <div
            className="absolute top-full left-0 mt-2 p-2 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 grid grid-cols-4 gap-1.5 z-50 w-36"
            onMouseLeave={() => setStrokePickerOpen(false)}
          >
            {COLOR_PALETTE.map((c) => (
              <button
                key={c}
                onClick={() => {
                  handleColorChange('stroke', c);
                  setStrokePickerOpen(false);
                }}
                className="w-6 h-6 rounded-full border border-gray-200 dark:border-gray-700 hover:scale-115 transition-transform cursor-pointer"
                style={{ backgroundColor: c === 'transparent' ? '#ffffff' : c }}
                title={c}
              />
            ))}
          </div>
        )}
      </div>

      {/* Fill Color Button (for shapes, sticky notes, images) */}
      {first?.type !== 'freehand' &&
        first?.type !== 'line' &&
        first?.type !== 'arrow' &&
        first?.type !== 'connector' && (
          <div className="relative">
            <button
              onClick={() => {
                setFillPickerOpen(!fillPickerOpen);
                setStrokePickerOpen(false);
              }}
              className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-1 text-gray-700 dark:text-gray-200 cursor-pointer"
              title="Fill Color"
            >
              <Palette className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              <div
                className="w-3.5 h-3.5 rounded-full border border-gray-300 dark:border-gray-600 shadow-xs"
                style={{
                  backgroundColor:
                    first?.type === 'sticky_note'
                      ? first.data?.color
                      : first?.data?.fill || 'transparent',
                }}
              />
            </button>

            {fillPickerOpen && (
              <div
                className="absolute top-full left-0 mt-2 p-2 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 grid grid-cols-4 gap-1.5 z-50 w-36"
                onMouseLeave={() => setFillPickerOpen(false)}
              >
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      handleColorChange(
                        first?.type === 'sticky_note' ? 'color' : 'fill',
                        c,
                      );
                      setFillPickerOpen(false);
                    }}
                    className="w-6 h-6 rounded-full border border-gray-200 dark:border-gray-700 hover:scale-115 transition-transform cursor-pointer"
                    style={{ backgroundColor: c === 'transparent' ? '#ffffff' : c }}
                    title={c}
                  />
                ))}
              </div>
            )}
          </div>
        )}

      {/* Stroke Width Selector */}
      <div className="flex items-center gap-0.5 px-1">
        {[1, 2, 4].map((sw) => (
          <button
            key={sw}
            onClick={() => handleStrokeWidth(sw)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer"
            title={`${sw}px border`}
          >
            <div
              className="bg-gray-700 dark:bg-gray-300 rounded-full w-4"
              style={{ height: `${sw * 1.5}px` }}
            />
          </button>
        ))}
      </div>

      {/* Opacity Selector */}
      <div className="relative">
        <button
          onClick={() => setOpacityPickerOpen(!opacityPickerOpen)}
          className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center gap-1 text-xs font-semibold cursor-pointer"
          title="Opacity"
        >
          <Sun className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-[11px]">{Math.round((first?.data?.opacity ?? 1) * 100)}%</span>
        </button>

        {opacityPickerOpen && (
          <div
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 p-1.5 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 flex flex-col gap-1 z-50 w-24"
            onMouseLeave={() => setOpacityPickerOpen(false)}
          >
            {[1, 0.75, 0.5, 0.25].map((op) => (
              <button
                key={op}
                onClick={() => {
                  handleOpacityChange(op);
                  setOpacityPickerOpen(false);
                }}
                className="px-2 py-1 text-xs rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-left font-medium text-gray-700 dark:text-gray-200 cursor-pointer"
              >
                {Math.round(op * 100)}%
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Text Formatting Controls (for Text, Sticky Notes, Shapes) */}
      {hasTextCapability && (
        <>
          <div className="w-[1px] h-5 bg-gray-200 dark:bg-gray-800 mx-0.5" />

          {/* Font Sizes */}
          <div className="flex items-center gap-0.5 px-0.5">
            {[14, 18, 24, 32].map((fs) => (
              <button
                key={fs}
                onClick={() => handleTextStyleChange('fontSize', fs)}
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold cursor-pointer transition-colors ${
                  (first?.data?.fontSize || 16) === fs
                    ? 'bg-[#E8F5E9] dark:bg-emerald-950/60 text-[#2D6A4F] dark:text-emerald-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title={`Font Size ${fs}px`}
              >
                {fs}
              </button>
            ))}
          </div>

          {/* Bold */}
          <button
            onClick={() =>
              handleTextStyleChange(
                'fontWeight',
                first?.data?.fontWeight === 'bold' ? 'normal' : 'bold',
              )
            }
            className={`p-1.5 rounded-xl cursor-pointer transition-colors ${
              first?.data?.fontWeight === 'bold'
                ? 'bg-[#E8F5E9] dark:bg-emerald-950/60 text-[#2D6A4F] dark:text-emerald-300'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            title="Toggle Bold"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>

          {/* Italic */}
          <button
            onClick={() =>
              handleTextStyleChange(
                'fontStyle',
                first?.data?.fontStyle === 'italic' ? 'normal' : 'italic',
              )
            }
            className={`p-1.5 rounded-xl cursor-pointer transition-colors ${
              first?.data?.fontStyle === 'italic'
                ? 'bg-[#E8F5E9] dark:bg-emerald-950/60 text-[#2D6A4F] dark:text-emerald-300'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            title="Toggle Italic"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          {/* Text Alignment */}
          {!isMulti && (
            <>
              <button
                onClick={() => handleTextStyleChange('textAlign', 'left')}
                className={`p-1.5 rounded-xl cursor-pointer transition-colors ${
                  (first?.data?.textAlign || 'left') === 'left'
                    ? 'bg-[#E8F5E9] dark:bg-emerald-950/60 text-[#2D6A4F] dark:text-emerald-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="Align Text Left"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleTextStyleChange('textAlign', 'center')}
                className={`p-1.5 rounded-xl cursor-pointer transition-colors ${
                  first?.data?.textAlign === 'center'
                    ? 'bg-[#E8F5E9] dark:bg-emerald-950/60 text-[#2D6A4F] dark:text-emerald-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="Align Text Center"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleTextStyleChange('textAlign', 'right')}
                className={`p-1.5 rounded-xl cursor-pointer transition-colors ${
                  first?.data?.textAlign === 'right'
                    ? 'bg-[#E8F5E9] dark:bg-emerald-950/60 text-[#2D6A4F] dark:text-emerald-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title="Align Text Right"
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </>
      )}

      <div className="w-[1px] h-5 bg-gray-200 dark:bg-gray-800 mx-0.5" />

      {/* Alignment Controls for Multiple Selected Elements */}
      {isMulti && (
        <>
          <button
            onClick={alignLeft}
            className="p-1.5 rounded-xl text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            onClick={alignCenter}
            className="p-1.5 rounded-xl text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            title="Align Horizontal Center"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            onClick={alignRight}
            className="p-1.5 rounded-xl text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-5 bg-gray-200 dark:bg-gray-800 mx-0.5" />
        </>
      )}

      {/* Layer Controls */}
      <button
        onClick={() => {
          bringForward();
          const updated = useCanvasStore
            .getState()
            .elements.filter((el) => selectedIds.includes(el.id));
          emitBulkUpdate(updated);
        }}
        className="p-1.5 rounded-xl text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
        title="Bring Forward"
      >
        <ChevronUp className="w-4 h-4" />
      </button>
      <button
        onClick={() => {
          sendBackward();
          const updated = useCanvasStore
            .getState()
            .elements.filter((el) => selectedIds.includes(el.id));
          emitBulkUpdate(updated);
        }}
        className="p-1.5 rounded-xl text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
        title="Send Backward"
      >
        <ChevronDown className="w-4 h-4" />
      </button>

      {/* Lock / Unlock */}
      <button
        onClick={() => {
          toggleLockSelected();
          const updated = useCanvasStore
            .getState()
            .elements.filter((el) => selectedIds.includes(el.id));
          emitBulkUpdate(updated);
          notify.info(isLocked ? 'Unlocked element' : 'Locked element', 'Element State');
        }}
        className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
          isLocked
            ? 'bg-gray-900 dark:bg-emerald-950 text-white dark:text-emerald-300'
            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
        title={isLocked ? 'Unlock Elements' : 'Lock Elements'}
      >
        {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
      </button>

      {/* Duplicate */}
      <button
        onClick={() => {
          const duplicated = duplicateSelected();
          duplicated.forEach((d) => emitElementCreate(d));
          notify.success('Duplicated selected elements', 'Duplicate');
        }}
        className="p-1.5 rounded-xl text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
        title="Duplicate (Ctrl+D)"
      >
        <Copy className="w-4 h-4" />
      </button>

      {/* Delete */}
      <button
        onClick={() => {
          const deletedIds = deleteSelected();
          deletedIds.forEach((id) => emitElementDelete(id));
          notify.info('Deleted selected elements', 'Delete');
        }}
        className="p-1.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
        title="Delete Selected (Backspace)"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {/* AI Edit Shortcut */}
      <div className="w-[1px] h-5 bg-gray-200 dark:bg-gray-800 mx-0.5" />
      <button
        onClick={() => {
          setActiveAiTab('edit');
          setAiDrawerOpen(true);
        }}
        className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#1B4332] dark:text-emerald-300 bg-[#E8F5E9] dark:bg-emerald-950/60 hover:bg-[#d8edd9] dark:hover:bg-emerald-900/60 rounded-xl transition-colors cursor-pointer"
        title="Edit with Gemini AI"
      >
        <Sparkles className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-emerald-400" />
        <span>AI Edit</span>
      </button>
    </div>
  );
};
