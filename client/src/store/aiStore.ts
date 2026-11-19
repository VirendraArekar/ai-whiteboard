import { create } from 'zustand';
import { api } from '../services/api';
import { CanvasElement } from '../types';

export type AiTab = 'brainstorm' | 'diagram' | 'chart' | 'outline' | 'summary' | 'edit';

interface AiState {
  isAiDrawerOpen: boolean;
  isGenerating: boolean;
  activeAiTab: AiTab;
  summaryData: any | null;
  error: string | null;

  setAiDrawerOpen: (open: boolean) => void;
  toggleAiDrawer: () => void;
  setActiveAiTab: (tab: AiTab) => void;
  clearError: () => void;

  generateBrainstorm: (boardId: string, prompt: string, count?: number) => Promise<CanvasElement[]>;
  generateOutline: (boardId: string, prompt: string) => Promise<CanvasElement[]>;
  generateDiagram: (boardId: string, prompt: string, diagramType?: string) => Promise<CanvasElement[]>;
  generateChart: (boardId: string, prompt: string, chartType?: string) => Promise<CanvasElement>;
  editElements: (boardId: string, elementIds: string[], instruction: string) => Promise<CanvasElement[]>;
  generateSummary: (boardId: string) => Promise<any>;
}

export const useAiStore = create<AiState>((set) => ({
  isAiDrawerOpen: false,
  isGenerating: false,
  activeAiTab: 'brainstorm',
  summaryData: null,
  error: null,

  setAiDrawerOpen: (open) => set({ isAiDrawerOpen: open }),
  toggleAiDrawer: () => set((state) => ({ isAiDrawerOpen: !state.isAiDrawerOpen })),
  setActiveAiTab: (tab) => set({ activeAiTab: tab }),
  clearError: () => set({ error: null }),

  generateBrainstorm: async (boardId, prompt, count = 6) => {
    set({ isGenerating: true, error: null });
    try {
      const { data } = await api.post('/ai/brainstorm', { boardId, prompt, count });
      set({ isGenerating: false });
      return data.elements;
    } catch (err: any) {
      set({ isGenerating: false, error: err.response?.data?.message || err.message });
      throw err;
    }
  },

  generateOutline: async (boardId, prompt) => {
    set({ isGenerating: true, error: null });
    try {
      const { data } = await api.post('/ai/outline', { boardId, prompt });
      set({ isGenerating: false });
      return data.elements;
    } catch (err: any) {
      set({ isGenerating: false, error: err.response?.data?.message || err.message });
      throw err;
    }
  },

  generateDiagram: async (boardId, prompt, diagramType = 'architecture') => {
    set({ isGenerating: true, error: null });
    try {
      const { data } = await api.post('/ai/diagram', { boardId, prompt, diagramType });
      set({ isGenerating: false });
      return data.elements;
    } catch (err: any) {
      set({ isGenerating: false, error: err.response?.data?.message || err.message });
      throw err;
    }
  },

  generateChart: async (boardId, prompt, chartType = 'bar') => {
    set({ isGenerating: true, error: null });
    try {
      const { data } = await api.post('/ai/chart', { boardId, prompt, chartType });
      set({ isGenerating: false });
      return data.element;
    } catch (err: any) {
      set({ isGenerating: false, error: err.response?.data?.message || err.message });
      throw err;
    }
  },

  editElements: async (boardId, elementIds, instruction) => {
    set({ isGenerating: true, error: null });
    try {
      const { data } = await api.post('/ai/edit', { boardId, elementIds, instruction });
      set({ isGenerating: false });
      return data.elements;
    } catch (err: any) {
      set({ isGenerating: false, error: err.response?.data?.message || err.message });
      throw err;
    }
  },

  generateSummary: async (boardId) => {
    set({ isGenerating: true, error: null });
    try {
      const { data } = await api.post('/ai/summary', { boardId });
      set({ isGenerating: false, summaryData: data });
      return data;
    } catch (err: any) {
      set({ isGenerating: false, error: err.response?.data?.message || err.message });
      throw err;
    }
  },
}));
