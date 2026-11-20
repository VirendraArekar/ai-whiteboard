import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Share2,
  Download,
  Users,
  Sparkles,
  Eye,
  Loader2,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useWhiteboardStore } from '../store/whiteboardStore';
import { useCanvasStore } from '../store/canvasStore';
import { useCollaborationStore } from '../store/collaborationStore';
import { useAiStore } from '../store/aiStore';
import { Canvas } from '../canvas/Canvas';
import { ToolBar } from '../canvas/tools/ToolBar';
import { ContextToolbar } from '../canvas/tools/ContextToolbar';
import { ZoomControls } from '../canvas/tools/ZoomControls';
import { ExportModal } from '../canvas/tools/ExportModal';
import { ChartEditorModal } from '../canvas/tools/ChartEditorModal';
import { Minimap } from '../canvas/tools/Minimap';
import { ShareModal } from '../components/whiteboard/ShareModal';
import { AiAssistantDrawer } from '../components/ai/AiAssistantDrawer';
import { Avatar } from '../components/common/Avatar';
import { Button } from '../components/common/Button';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { CanvasElement } from '../types';
import { api } from '../services/api';
import { notify } from '../utils/toast';

export const WhiteboardPage: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { currentBoard, fetchBoard, updateBoard } = useWhiteboardStore();
  const { elements, setElements, updateElement, addElement, selectedIds } = useCanvasStore();
  const {
    connect: connectCollab,
    disconnect: disconnectCollab,
    isConnected,
    activeUsers,
    userRole,
    emitElementCreate,
    emitElementUpdate,
  } = useCollaborationStore();
  const { setAiDrawerOpen } = useAiStore();

  const [isLoading, setIsLoading] = useState(true);
  const [boardTitle, setBoardTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isPresentationMode, setIsPresentationMode] = useState(false);

  // Modals state
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(searchParams.get('share') === 'true');
  const [chartToEdit, setChartToEdit] = useState<CanvasElement | null>(null);

  // Load board and elements
  useEffect(() => {
    if (!boardId) return;

    let mounted = true;
    const initBoard = async () => {
      try {
        const board = await fetchBoard(boardId);
        if (mounted) {
          setBoardTitle(board.title);
          if (board.elements) {
            setElements(board.elements, true);
          }
          setIsLoading(false);
        }
      } catch (err: any) {
        notify.error('Could not load whiteboard', 'Error');
        navigate('/dashboard');
      }
    };

    initBoard();
    connectCollab(boardId);

    return () => {
      mounted = false;
      disconnectCollab();
    };
  }, [boardId, fetchBoard, setElements, connectCollab, disconnectCollab, navigate]);

  // Keyboard shortcut for Esc to exit presentation mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPresentationMode) {
        setIsPresentationMode(false);
        notify.info('Exited presentation mode', 'Presentation');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPresentationMode]);

  const handleTitleBlur = async () => {
    setIsEditingTitle(false);
    if (boardId && boardTitle.trim() && boardTitle !== currentBoard?.title) {
      try {
        await updateBoard(boardId, { title: boardTitle.trim() });
        notify.success('Whiteboard title updated', 'Saved');
      } catch {
        // Ignore
      }
    }
  };

  // Reusable Image Upload & Placement handler
  const uploadAndPlaceImage = async (file: File, position?: { x: number; y: number }) => {
    if (!boardId) return;

    if (!file.type.startsWith('image/')) {
      notify.error('Please select a valid image file (PNG, JPG, WebP, SVG, GIF)', 'Invalid File');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      notify.error('Image size exceeds 5MB limit', 'File Too Large');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('whiteboardId', boardId);

    notify.info('Uploading image asset...', 'Upload');
    try {
      // Do not manually override Content-Type header so browser appends boundary parameter
      const { data } = await api.post('/uploads', formData);

      // Pre-calculate natural image dimensions to avoid aspect ratio distortion
      let imgWidth = 360;
      let imgHeight = 240;
      try {
        const objectUrl = URL.createObjectURL(file);
        const img = new Image();
        img.src = objectUrl;
        await new Promise((resolve) => {
          img.onload = () => {
            const maxDim = 400;
            if (img.naturalWidth && img.naturalHeight) {
              if (img.naturalWidth >= img.naturalHeight) {
                imgWidth = maxDim;
                imgHeight = Math.round((img.naturalHeight / img.naturalWidth) * maxDim);
              } else {
                imgHeight = maxDim;
                imgWidth = Math.round((img.naturalWidth / img.naturalHeight) * maxDim);
              }
            }
            URL.revokeObjectURL(objectUrl);
            resolve(true);
          };
          img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(false);
          };
        });
      } catch {
        // Fallback to default dimensions
      }

      const posX = position ? Math.round(position.x - imgWidth / 2) : 220;
      const posY = position ? Math.round(position.y - imgHeight / 2) : 180;

      const newImageElement: CanvasElement = {
        id: crypto.randomUUID(),
        whiteboardId: boardId,
        type: 'image',
        positionX: Math.max(40, posX),
        positionY: Math.max(40, posY),
        width: imgWidth,
        height: imgHeight,
        rotation: 0,
        zIndex: elements.length + 1,
        data: {
          url: data.proxyUrl || data.url,
          proxyUrl: data.proxyUrl,
          originalFilename: data.originalFilename,
        },
      };

      addElement(newImageElement);
      emitElementCreate(newImageElement);
      notify.success('Image placed onto canvas', 'Upload Complete');
    } catch (err: any) {
      notify.error(err.response?.data?.message || 'Failed to upload image', 'Upload Failed');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadAndPlaceImage(file);
    }
  };

  // Support clipboard paste of images
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            uploadAndPlaceImage(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [boardId, elements.length]);

  // Insert Chart handler
  const handleInsertChart = () => {
    if (!boardId) return;
    const newChart: CanvasElement = {
      id: crypto.randomUUID(),
      whiteboardId: boardId,
      type: 'chart',
      positionX: 250,
      positionY: 180,
      width: 440,
      height: 300,
      rotation: 0,
      zIndex: elements.length + 1,
      data: {
        chartType: 'bar',
        title: 'Project Performance Metrics',
        labels: ['Sprint 1', 'Sprint 2', 'Sprint 3', 'Sprint 4'],
        datasets: [
          {
            label: 'Velocity',
            data: [28, 45, 52, 70],
            backgroundColor: ['#2D6A4F', '#40916C', '#52B788', '#74C69D'],
          },
        ],
      },
    };
    addElement(newChart);
    emitElementCreate(newChart);
    notify.success('Chart inserted. Double-click to customize!', 'Chart Added');
  };

  const togglePresentation = () => {
    const next = !isPresentationMode;
    setIsPresentationMode(next);
    if (next) {
      notify.info('Entered presentation mode. Press Esc to exit.', 'Presentation Mode');
    } else {
      notify.info('Exited presentation mode', 'Editing Mode');
    }
  };

  if (isLoading || !boardId) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#F8F9FA] dark:bg-[#0B0F19] gap-3">
        <Loader2 className="w-8 h-8 text-[#2D6A4F] animate-spin" />
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 font-heading">
          Connecting to infinite canvas...
        </p>
      </div>
    );
  }

  const effectiveRole = userRole || currentBoard?.role || 'VIEWER';
  const isViewer = effectiveRole === 'VIEWER';

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#F8F9FA] dark:bg-[#0B0F19] relative transition-colors">
      {/* Top Navbar (Hidden in presentation mode) */}
      {!isPresentationMode && (
        <header className="h-14 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 flex items-center justify-between z-30 select-none transition-colors">
          {/* Left: Back & Board Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors cursor-pointer"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {isEditingTitle && !isViewer ? (
              <input
                type="text"
                value={boardTitle}
                onChange={(e) => setBoardTitle(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleBlur()}
                autoFocus
                className="text-sm font-bold text-gray-900 dark:text-white border-b border-[#2D6A4F] outline-none px-1 py-0.5 bg-transparent font-heading"
              />
            ) : (
              <h2
                onDoubleClick={() => !isViewer && setIsEditingTitle(true)}
                className="text-sm font-bold text-gray-900 dark:text-white font-heading cursor-pointer hover:text-[#2D6A4F] dark:hover:text-emerald-400 transition-colors truncate max-w-xs"
                title="Double click to rename"
              >
                {boardTitle || 'Untitled Whiteboard'}
              </h2>
            )}

            {isViewer && (
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                <Eye className="w-3 h-3" />
                View Only
              </span>
            )}
          </div>

          {/* Right: Presence, Presentation, Theme, Share & Export */}
          <div className="flex items-center gap-2.5">
            {/* Active Collaborators */}
            <div className="flex items-center -space-x-1.5 mr-1">
              {activeUsers.slice(0, 4).map((u) => (
                <Avatar
                  key={u.socketId}
                  name={u.name}
                  avatarUrl={u.avatarUrl}
                  color={u.color}
                  size="xs"
                />
              ))}
              {activeUsers.length > 4 && (
                <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-800 border-2 border-white dark:border-gray-900 flex items-center justify-center text-[9px] font-bold text-gray-700 dark:text-gray-300">
                  +{activeUsers.length - 4}
                </div>
              )}
            </div>

            {/* Connection Status Pill */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                isConnected
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span>{isConnected ? 'Real-Time Sync' : 'Reconnecting...'}</span>
            </div>

            {/* Theme Toggle */}
            <ThemeToggle size="sm" />

            {/* Presentation Mode Button */}
            <button
              onClick={togglePresentation}
              className="p-1.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
              title="Presentation Mode"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* Export Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setExportModalOpen(true)}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export
            </Button>

            {/* Share Button */}
            <Button
              size="sm"
              onClick={() => setShareModalOpen(true)}
              leftIcon={<Share2 className="w-3.5 h-3.5" />}
            >
              Share
            </Button>
          </div>
        </header>
      )}

      {/* Floating Exit Presentation Mode button */}
      {isPresentationMode && (
        <button
          onClick={togglePresentation}
          className="absolute top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 bg-gray-900/90 dark:bg-white/90 text-white dark:text-gray-900 rounded-xl shadow-2xl backdrop-blur-md text-xs font-bold hover:scale-105 transition-all cursor-pointer"
        >
          <Minimize2 className="w-3.5 h-3.5" />
          <span>Exit Presentation (Esc)</span>
        </button>
      )}

      {/* Main Canvas Workspace with drag-and-drop support */}
      <div
        className="flex-1 relative overflow-hidden"
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes('Files')) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
          }
        }}
        onDrop={(e) => {
          const files = e.dataTransfer.files;
          if (files && files.length > 0) {
            for (let i = 0; i < files.length; i++) {
              if (files[i].type.startsWith('image/')) {
                e.preventDefault();
                const rect = e.currentTarget.getBoundingClientRect();
                uploadAndPlaceImage(files[i], {
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top,
                });
                break;
              }
            }
          }
        }}
      >
        {/* Drawing Toolbar (Hidden in presentation mode) */}
        {!isViewer && !isPresentationMode && (
          <ToolBar
            onImageUploadClick={() => fileInputRef.current?.click()}
            onAddChartClick={handleInsertChart}
          />
        )}

        {/* Contextual Properties Toolbar */}
        {!isViewer && !isPresentationMode && <ContextToolbar />}

        {/* Zoom & Grid Controls */}
        {!isPresentationMode && <ZoomControls />}

        {/* Radar Minimap */}
        {!isPresentationMode && <Minimap />}

        {/* Canvas Engine */}
        <Canvas
          boardId={boardId}
          onEditChart={(chartEl) => setChartToEdit(chartEl)}
          onElementChange={(el) => emitElementUpdate(el)}
        />

        {/* AI Assistant Side Drawer */}
        <AiAssistantDrawer boardId={boardId} />

        {/* Hidden File Input for Image Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
          className="hidden"
          onChange={handleImageFileChange}
        />
      </div>

      {/* Modals */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        elements={elements}
        selectedIds={selectedIds}
        boardTitle={boardTitle}
      />

      <ShareModal
        boardId={boardId}
        userRole={effectiveRole}
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />

      <ChartEditorModal
        element={chartToEdit}
        isOpen={!!chartToEdit}
        onClose={() => setChartToEdit(null)}
        onSave={(id, data) => {
          updateElement(id, { data });
          const chart = elements.find((e) => e.id === id);
          if (chart) {
            emitElementUpdate({ ...chart, data });
          }
        }}
      />
    </div>
  );
};
