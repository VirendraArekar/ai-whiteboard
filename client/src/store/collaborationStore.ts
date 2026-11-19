import { create } from 'zustand';
import { connectSocket, getSocket } from '../services/socket';
import { BoardRole, CollaboratorCursor, CollaboratorPresence } from '../types';
import { useCanvasStore } from './canvasStore';

interface CollaborationState {
  isConnected: boolean;
  activeBoardId: string | null;
  activeUsers: CollaboratorPresence[];
  userCursors: Record<string, CollaboratorCursor>;
  userRole: BoardRole | null;

  connect: (boardId: string) => void;
  disconnect: () => void;
  emitCursorMove: (x: number, y: number) => void;
  emitElementCreate: (element: any) => void;
  emitElementUpdate: (element: any) => void;
  emitElementDelete: (elementId: string) => void;
  emitBulkUpdate: (elements: any[]) => void;
  emitLiveStroke: (strokeId: string, point: number[], color: string, width: number) => void;
  emitStrokeEnd: (element: any) => void;
}

let lastCursorEmit = 0;

export const useCollaborationStore = create<CollaborationState>((set, get) => ({
  isConnected: false,
  activeBoardId: null,
  activeUsers: [],
  userCursors: {},
  userRole: null,

  connect: (boardId: string) => {
    const socket = connectSocket();

    socket.on('connect', () => {
      set({ isConnected: true, activeBoardId: boardId });
      socket.emit('board:join', { boardId });
    });

    socket.on('disconnect', () => {
      set({ isConnected: false });
    });

    socket.on('board:joined', (data: { boardId: string; role: BoardRole; activeUsers: CollaboratorPresence[] }) => {
      set({
        activeBoardId: data.boardId,
        userRole: data.role,
        activeUsers: data.activeUsers,
      });
    });

    socket.on('presence:user-joined', (user: CollaboratorPresence) => {
      set((state) => ({
        activeUsers: [...state.activeUsers.filter((u) => u.userId !== user.userId), user],
      }));
    });

    socket.on('presence:user-left', (data: { userId: string }) => {
      set((state) => {
        const newCursors = { ...state.userCursors };
        delete newCursors[data.userId];
        return {
          activeUsers: state.activeUsers.filter((u) => u.userId !== data.userId),
          userCursors: newCursors,
        };
      });
    });

    socket.on('presence:cursor-moved', (cursor: CollaboratorCursor) => {
      set((state) => ({
        userCursors: {
          ...state.userCursors,
          [cursor.userId]: cursor,
        },
      }));
    });

    socket.on('element:created', (data: { element: any }) => {
      const store = useCanvasStore.getState();
      if (!store.elements.some((e) => e.id === data.element.id)) {
        store.addElement(data.element);
      }
    });

    socket.on('element:updated', (data: { element: any }) => {
      useCanvasStore.getState().updateElement(data.element.id, data.element);
    });

    socket.on('element:deleted', (data: { elementId: string }) => {
      useCanvasStore.getState().deleteElement(data.elementId);
    });

    socket.on('elements:bulk-updated', (data: { elements: any[] }) => {
      useCanvasStore.getState().updateElementsBatch(
        data.elements.map((el) => ({ id: el.id, changes: el })),
      );
    });

    socket.on('draw:stroke-ended', (data: { element: any }) => {
      const store = useCanvasStore.getState();
      if (!store.elements.some((e) => e.id === data.element.id)) {
        store.addElement(data.element);
      }
    });

    if (socket.connected) {
      set({ isConnected: true, activeBoardId: boardId });
      socket.emit('board:join', { boardId });
    }
  },

  disconnect: () => {
    const socket = getSocket();
    const { activeBoardId } = get();
    if (activeBoardId) {
      socket.emit('board:leave', { boardId: activeBoardId });
    }
    socket.off('board:joined');
    socket.off('presence:user-joined');
    socket.off('presence:user-left');
    socket.off('presence:cursor-moved');
    socket.off('element:created');
    socket.off('element:updated');
    socket.off('element:deleted');
    socket.off('elements:bulk-updated');
    socket.off('draw:stroke-ended');
    set({
      isConnected: false,
      activeBoardId: null,
      activeUsers: [],
      userCursors: {},
      userRole: null,
    });
  },

  emitCursorMove: (x: number, y: number) => {
    const now = Date.now();
    // Throttle cursor updates to ~30fps (33ms)
    if (now - lastCursorEmit < 33) return;
    lastCursorEmit = now;

    const { activeBoardId, isConnected } = get();
    if (!activeBoardId || !isConnected) return;
    const socket = getSocket();
    socket.emit('cursor:move', { boardId: activeBoardId, x, y });
  },

  emitElementCreate: (element: any) => {
    const { activeBoardId, isConnected, userRole } = get();
    if (!activeBoardId || !isConnected || userRole === 'VIEWER') return;
    getSocket().emit('element:create', { boardId: activeBoardId, element });
  },

  emitElementUpdate: (element: any) => {
    const { activeBoardId, isConnected, userRole } = get();
    if (!activeBoardId || !isConnected || userRole === 'VIEWER') return;
    getSocket().emit('element:update', { boardId: activeBoardId, element });
  },

  emitElementDelete: (elementId: string) => {
    const { activeBoardId, isConnected, userRole } = get();
    if (!activeBoardId || !isConnected || userRole === 'VIEWER') return;
    getSocket().emit('element:delete', { boardId: activeBoardId, elementId });
  },

  emitBulkUpdate: (elements: any[]) => {
    const { activeBoardId, isConnected, userRole } = get();
    if (!activeBoardId || !isConnected || userRole === 'VIEWER') return;
    getSocket().emit('elements:bulk-update', { boardId: activeBoardId, elements });
  },

  emitLiveStroke: (strokeId: string, point: number[], color: string, width: number) => {
    const { activeBoardId, isConnected, userRole } = get();
    if (!activeBoardId || !isConnected || userRole === 'VIEWER') return;
    getSocket().emit('draw:stroke-live', {
      boardId: activeBoardId,
      strokeId,
      point,
      color,
      width,
    });
  },

  emitStrokeEnd: (element: any) => {
    const { activeBoardId, isConnected, userRole } = get();
    if (!activeBoardId || !isConnected || userRole === 'VIEWER') return;
    getSocket().emit('draw:stroke-end', { boardId: activeBoardId, element });
  },
}));
