import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Lightbulb,
  Workflow,
  BarChart2,
  ListOrdered,
  FileText,
  Wand2,
  Loader2,
  CheckCircle2,
  Copy,
} from 'lucide-react';
import { useAiStore, AiTab } from '../../store/aiStore';
import { useCanvasStore } from '../../store/canvasStore';
import { useCollaborationStore } from '../../store/collaborationStore';
import { Button } from '../common/Button';
import { notify } from '../../utils/toast';

export interface AiAssistantDrawerProps {
  boardId: string;
}

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({ boardId }) => {
  const {
    isAiDrawerOpen,
    setAiDrawerOpen,
    activeAiTab,
    setActiveAiTab,
    isGenerating,
    summaryData,
    generateBrainstorm,
    generateOutline,
    generateDiagram,
    generateChart,
    editElements,
    generateSummary,
  } = useAiStore();

  const { addElement, setElements, elements, selectedIds } = useCanvasStore();
  const { emitElementCreate, emitBulkUpdate } = useCollaborationStore();

  const [prompt, setPrompt] = useState('');
  const [brainstormCount, setBrainstormCount] = useState(6);
  const [diagramType, setDiagramType] = useState('architecture');
  const [chartType, setChartType] = useState('bar');
  const [editInstruction, setEditInstruction] = useState('Summarize into clear bullet points');

  if (!isAiDrawerOpen) return null;

  const handleBrainstorm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    try {
      const created = await generateBrainstorm(boardId, prompt.trim(), brainstormCount);
      created.forEach((el) => {
        addElement(el);
        emitElementCreate(el);
      });
      notify.ai(`Generated ${created.length} brainstorm sticky notes on your canvas!`, 'Brainstorm Ready');
      setPrompt('');
    } catch {
      notify.error('AI generation failed. Please try again.', 'Generation Error');
    }
  };

  const handleOutline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    try {
      const created = await generateOutline(boardId, prompt.trim());
      created.forEach((el) => {
        addElement(el);
        emitElementCreate(el);
      });
      notify.ai('Project roadmap generated on your canvas!', 'Roadmap Ready');
      setPrompt('');
    } catch {
      notify.error('Failed to generate roadmap outline.', 'Roadmap Error');
    }
  };

  const handleDiagram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    try {
      const created = await generateDiagram(boardId, prompt.trim(), diagramType);
      created.forEach((el) => {
        addElement(el);
        emitElementCreate(el);
      });
      notify.ai('Architecture diagram generated with connectors!', 'Diagram Ready');
      setPrompt('');
    } catch {
      notify.error('Failed to generate diagram.', 'Diagram Error');
    }
  };

  const handleChart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    try {
      const created = await generateChart(boardId, prompt.trim(), chartType);
      addElement(created);
      emitElementCreate(created);
      notify.ai('Structured chart generated on canvas! Double-click to edit data.', 'Chart Created');
      setPrompt('');
    } catch {
      notify.error('Failed to generate chart.', 'Chart Error');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) {
      notify.error('Please select at least one element on the canvas first', 'Selection Required');
      return;
    }
    if (!editInstruction.trim()) return;

    try {
      const updated = await editElements(boardId, selectedIds, editInstruction.trim());
      const updatedMap = new Map(updated.map((u) => [u.id, u]));
      const newElements = elements.map((el) => updatedMap.get(el.id) || el);
      setElements(newElements);
      emitBulkUpdate(updated);
      notify.ai('Selected elements updated with Gemini AI!', 'AI Edit Applied');
    } catch {
      notify.error('AI edit failed.', 'Edit Error');
    }
  };

  const handleSummary = async () => {
    try {
      await generateSummary(boardId);
      notify.ai('Whiteboard synthesized into an executive summary!', 'Summary Complete');
    } catch {
      notify.error('Failed to summarize whiteboard.', 'Summary Error');
    }
  };

  const tabs: { id: AiTab; label: string; icon: any }[] = [
    { id: 'brainstorm', label: 'Brainstorm', icon: Lightbulb },
    { id: 'diagram', label: 'Diagram', icon: Workflow },
    { id: 'outline', label: 'Roadmap', icon: ListOrdered },
    { id: 'chart', label: 'Chart', icon: BarChart2 },
    { id: 'edit', label: 'Edit', icon: Wand2 },
    { id: 'summary', label: 'Summary', icon: FileText },
  ];

  return (
    <div className="absolute top-0 right-0 h-full w-96 bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-200 dark:border-gray-800 z-50 flex flex-col select-none animate-in slide-in-from-right duration-200 transition-colors">
      {/* Top Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-emerald-50/50 dark:from-emerald-950/20 to-white dark:to-gray-900">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#1B4332] to-[#40916C] flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4 text-emerald-200" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm text-gray-900 dark:text-white">
              Gemini AI Assistant
            </h3>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Multimodal Generative Canvas</p>
          </div>
        </div>

        <button
          onClick={() => setAiDrawerOpen(false)}
          className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-100 dark:border-gray-800 overflow-x-auto bg-gray-50/60 dark:bg-gray-950/40">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeAiTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveAiTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer ${
                isActive
                  ? 'bg-white dark:bg-gray-800 text-[#1B4332] dark:text-emerald-300 shadow-xs border border-gray-200 dark:border-gray-700'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800/50'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#2D6A4F] dark:text-emerald-400' : ''}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 p-5 overflow-y-auto text-gray-900 dark:text-gray-100">
        {activeAiTab === 'brainstorm' && (
          <form onSubmit={handleBrainstorm} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Brainstorming Topic or Challenge
              </label>

              {/* Preset Chips */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {[
                  'Launching an AI-native SaaS application',
                  'Team Retrospective: What went well & Next steps',
                  'Growth experiments for B2B user onboarding',
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setPrompt(chip)}
                    className="text-[10px] px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[#2D6A4F] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 transition-colors text-left cursor-pointer"
                  >
                    + {chip}
                  </button>
                ))}
              </div>

              <textarea
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Ideas for improving user onboarding retention in our mobile app..."
                className="w-full text-xs p-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] outline-none"
                required
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-gray-700 dark:text-gray-300 mb-1">
                <span className="font-semibold">Number of Notes:</span>
                <span className="font-bold text-[#2D6A4F] dark:text-emerald-400">{brainstormCount}</span>
              </div>
              <input
                type="range"
                min={2}
                max={12}
                value={brainstormCount}
                onChange={(e) => setBrainstormCount(parseInt(e.target.value))}
                className="w-full accent-[#2D6A4F]"
              />
            </div>

            <Button
              type="submit"
              size="md"
              className="w-full shadow-md shadow-[#2D6A4F]/20"
              isLoading={isGenerating}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Generate Sticky Notes
            </Button>
          </form>
        )}

        {activeAiTab === 'diagram' && (
          <form onSubmit={handleDiagram} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                System or Flowchart Description
              </label>

              {/* Preset Chips */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {[
                  'Microservices architecture with API Gateway & Redis Cache',
                  'OAuth2 User Login & Token Verification Sequence',
                  'Event-driven Kafka payment pipeline with PostgreSQL',
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setPrompt(chip)}
                    className="text-[10px] px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[#2D6A4F] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 transition-colors text-left cursor-pointer"
                  >
                    + {chip}
                  </button>
                ))}
              </div>

              <textarea
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Microservices system with API Gateway, User Service, Payment Gateway, and Redis cache..."
                className="w-full text-xs p-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Diagram Style
              </label>
              <div className="grid grid-cols-2 gap-2">
                {['architecture', 'flowchart', 'sequence', 'er'].map((dt) => (
                  <button
                    key={dt}
                    type="button"
                    onClick={() => setDiagramType(dt)}
                    className={`py-2 text-xs font-semibold rounded-xl border capitalize cursor-pointer ${
                      diagramType === dt
                        ? 'border-[#2D6A4F] dark:border-emerald-500 bg-[#E8F5E9] dark:bg-emerald-950/60 text-[#1B4332] dark:text-emerald-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {dt}
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              size="md"
              className="w-full shadow-md shadow-[#2D6A4F]/20"
              isLoading={isGenerating}
              leftIcon={<Workflow className="w-4 h-4" />}
            >
              Generate Diagram
            </Button>
          </form>
        )}

        {activeAiTab === 'outline' && (
          <form onSubmit={handleOutline} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Roadmap Goal or Project Scope
              </label>

              {/* Preset Chips */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {[
                  'Engineering roadmap for launching AI agents Q1-Q4',
                  'SaaS MVP development and go-to-market milestones',
                  'Mobile app overhaul & accessibility WCAG compliance',
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setPrompt(chip)}
                    className="text-[10px] px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[#2D6A4F] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 transition-colors text-left cursor-pointer"
                  >
                    + {chip}
                  </button>
                ))}
              </div>

              <textarea
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Q1 to Q4 Engineering milestones for launching autonomous AI agents..."
                className="w-full text-xs p-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] outline-none"
                required
              />
            </div>

            <Button
              type="submit"
              size="md"
              className="w-full shadow-md shadow-[#2D6A4F]/20"
              isLoading={isGenerating}
              leftIcon={<ListOrdered className="w-4 h-4" />}
            >
              Generate Roadmap Sections
            </Button>
          </form>
        )}

        {activeAiTab === 'chart' && (
          <form onSubmit={handleChart} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Data Query or Prompt
              </label>

              {/* Preset Chips */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {[
                  'Sprint velocity vs committed story points across sprints',
                  'Monthly recurring revenue (MRR) growth in 2026',
                  'User acquisition by marketing channel (Organic, Ads, Social)',
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setPrompt(chip)}
                    className="text-[10px] px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[#2D6A4F] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 transition-colors text-left cursor-pointer"
                  >
                    + {chip}
                  </button>
                ))}
              </div>

              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Quarterly revenue comparison for 2026 across North America and Europe..."
                className="w-full text-xs p-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Chart Type
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {['bar', 'line', 'pie', 'donut'].map((ct) => (
                  <button
                    key={ct}
                    type="button"
                    onClick={() => setChartType(ct)}
                    className={`py-1.5 text-xs font-semibold rounded-xl border capitalize cursor-pointer ${
                      chartType === ct
                        ? 'border-[#2D6A4F] dark:border-emerald-500 bg-[#E8F5E9] dark:bg-emerald-950/60 text-[#1B4332] dark:text-emerald-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {ct}
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              size="md"
              className="w-full shadow-md shadow-[#2D6A4F]/20"
              isLoading={isGenerating}
              leftIcon={<BarChart2 className="w-4 h-4" />}
            >
              Generate Editable Chart
            </Button>
          </form>
        )}

        {activeAiTab === 'edit' && (
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-600 dark:text-gray-300">
              <span className="font-bold text-gray-800 dark:text-white">Selected: </span>
              {selectedIds.length > 0
                ? `${selectedIds.length} element(s) selected on canvas`
                : 'Click an element or select multiple elements first'}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                AI Modification Instruction
              </label>
              <div className="space-y-1.5 mb-2">
                {[
                  'Convert into action-oriented bullet points',
                  'Summarize content concisely',
                  'Rewrite with professional, engaging tone',
                  'Brainstorm 3 related follow-up items',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setEditInstruction(preset)}
                    className="w-full text-left p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-[11px] text-gray-700 dark:text-gray-300 hover:bg-[#E8F5E9] dark:hover:bg-emerald-950/40 hover:border-[#2D6A4F] transition-colors cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <textarea
                rows={3}
                value={editInstruction}
                onChange={(e) => setEditInstruction(e.target.value)}
                placeholder="Custom instruction..."
                className="w-full text-xs p-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-[#2D6A4F] focus:ring-1 focus:ring-[#2D6A4F] outline-none"
                required
              />
            </div>

            <Button
              type="submit"
              size="md"
              className="w-full shadow-md shadow-[#2D6A4F]/20"
              disabled={selectedIds.length === 0}
              isLoading={isGenerating}
              leftIcon={<Wand2 className="w-4 h-4" />}
            >
              Apply AI Edit
            </Button>
          </form>
        )}

        {activeAiTab === 'summary' && (
          <div className="space-y-4">
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Gemini AI will read all elements on this board (notes, diagrams, charts, text) and
              synthesize an executive summary with key decisions and next steps.
            </p>

            <Button
              size="md"
              onClick={handleSummary}
              className="w-full shadow-md shadow-[#2D6A4F]/20"
              isLoading={isGenerating}
              leftIcon={<FileText className="w-4 h-4" />}
            >
              Summarize Entire Board
            </Button>

            {summaryData && (
              <div className="mt-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-xs space-y-3">
                <h4 className="font-heading font-bold text-sm text-gray-900 dark:text-white">
                  {summaryData.title}
                </h4>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{summaryData.overview}</p>

                {summaryData.keyTopics && (
                  <div>
                    <span className="font-bold text-gray-900 dark:text-white block mb-1">Key Topics:</span>
                    <ul className="list-disc pl-4 space-y-0.5 text-gray-600 dark:text-gray-300">
                      {summaryData.keyTopics.map((t: string, i: number) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {summaryData.actionItems && (
                  <div>
                    <span className="font-bold text-gray-900 dark:text-white block mb-1">Action Items:</span>
                    <ul className="list-disc pl-4 space-y-0.5 text-gray-600 dark:text-gray-300">
                      {summaryData.actionItems.map((a: string, i: number) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
