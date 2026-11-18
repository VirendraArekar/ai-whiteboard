import { create } from 'zustand';
import { api } from '../services/api';
import { Whiteboard } from '../types';

interface WhiteboardState {
  boards: Whiteboard[];
  currentBoard: Whiteboard | null;
  isLoading: boolean;
  activeTab: 'all' | 'mine' | 'shared' | 'recent';
  searchQuery: string;
  sortBy: 'updatedAt' | 'title' | 'createdAt';
  sortOrder: 'asc' | 'desc';
  setActiveTab: (tab: 'all' | 'mine' | 'shared' | 'recent') => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sortBy: 'updatedAt' | 'title' | 'createdAt') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  fetchBoards: () => Promise<void>;
  fetchBoard: (boardId: string) => Promise<Whiteboard>;
  createBoard: (title: string, description?: string) => Promise<Whiteboard>;
  updateBoard: (boardId: string, updates: Partial<Whiteboard>) => Promise<void>;
  deleteBoard: (boardId: string) => Promise<void>;
  duplicateBoard: (boardId: string) => Promise<Whiteboard>;
}

export const useWhiteboardStore = create<WhiteboardState>((set, get) => ({
  boards: [],
  currentBoard: null,
  isLoading: false,
  activeTab: 'all',
  searchQuery: '',
  sortBy: 'updatedAt',
  sortOrder: 'desc',

  setActiveTab: (tab) => {
    set({ activeTab: tab });
    get().fetchBoards();
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  setSortBy: (sortBy) => {
    set({ sortBy });
    get().fetchBoards();
  },

  setSortOrder: (sortOrder) => {
    set({ sortOrder });
    get().fetchBoards();
  },

  fetchBoards: async () => {
    set({ isLoading: true });
    try {
      const { activeTab, searchQuery, sortBy, sortOrder } = get();
      const params: any = {
        tab: activeTab,
        sortBy,
        order: sortOrder,
      };
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      const { data } = await api.get('/whiteboards', { params });
      set({ boards: data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  fetchBoard: async (boardId: string) => {
    set({ isLoading: true });
    try {
      const { data } = await api.get(`/whiteboards/${boardId}`);
      set({ currentBoard: data, isLoading: false });
      return data;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  createBoard: async (title: string, description?: string) => {
    const { data } = await api.post('/whiteboards', { title, description });
    set((state) => ({ boards: [data, ...state.boards] }));
    return data;
  },

  updateBoard: async (boardId: string, updates: Partial<Whiteboard>) => {
    const { data } = await api.patch(`/whiteboards/${boardId}`, updates);
    set((state) => ({
      boards: state.boards.map((b) => (b.id === boardId ? { ...b, ...data } : b)),
      currentBoard:
        state.currentBoard?.id === boardId
          ? { ...state.currentBoard, ...data }
          : state.currentBoard,
    }));
  },

  deleteBoard: async (boardId: string) => {
    await api.delete(`/whiteboards/${boardId}`);
    set((state) => ({
      boards: state.boards.filter((b) => b.id !== boardId),
      currentBoard: state.currentBoard?.id === boardId ? null : state.currentBoard,
    }));
  },

  duplicateBoard: async (boardId: string) => {
    const { data } = await api.post(`/whiteboards/${boardId}/duplicate`);
    set((state) => ({ boards: [data, ...state.boards] }));
    return data;
  },
}));
