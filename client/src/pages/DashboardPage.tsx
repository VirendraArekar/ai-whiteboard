import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  SlidersHorizontal,
  Layers,
  Sparkles,
  ArrowUpDown,
  Share2,
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { WhiteboardCard } from '../components/dashboard/WhiteboardCard';
import { CreateBoardModal } from '../components/dashboard/CreateBoardModal';
import { RenameBoardModal } from '../components/dashboard/RenameBoardModal';
import { DeleteBoardModal } from '../components/dashboard/DeleteBoardModal';
import { useWhiteboardStore } from '../store/whiteboardStore';
import { useAuthStore } from '../store/authStore';
import { Whiteboard } from '../types';
import { notify } from '../utils/toast';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const {
    boards,
    isLoading,
    activeTab,
    searchQuery,
    sortBy,
    sortOrder,
    setActiveTab,
    setSearchQuery,
    setSortBy,
    setSortOrder,
    fetchBoards,
    duplicateBoard,
  } = useWhiteboardStore();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [boardToRename, setBoardToRename] = useState<Whiteboard | null>(null);
  const [boardToDelete, setBoardToDelete] = useState<Whiteboard | null>(null);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  const handleDuplicate = async (board: Whiteboard) => {
    try {
      await duplicateBoard(board.id);
      notify.success(`Duplicated "${board.title}" successfully`, 'Whiteboard Duplicated');
    } catch (err: any) {
      notify.error(err.response?.data?.message || 'Failed to duplicate whiteboard', 'Error');
    }
  };

  const handleShareClick = (board: Whiteboard) => {
    // Open board and direct user to share modal
    window.location.href = `/whiteboard/${board.id}?share=true`;
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0B0F19] text-gray-900 dark:text-white flex flex-col font-sans transition-colors">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col">
        {/* Top Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white font-heading tracking-tight">
              Welcome back, {user?.name?.split(' ')[0] || 'Creator'} 👋
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Create diagrams, collaborate with your team, and generate ideas with Gemini AI.
            </p>
          </div>

          <Button
            size="md"
            onClick={() => setCreateModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
            className="shadow-md shadow-[#2D6A4F]/20 self-start md:self-auto cursor-pointer"
          >
            Create New Whiteboard
          </Button>
        </div>

        {/* Controls: Search, Tabs & Filters */}
        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-200/60 dark:bg-gray-800/80 rounded-2xl self-start">
            {(
              [
                { id: 'all', label: 'All Boards' },
                { id: 'mine', label: 'My Whiteboards' },
                { id: 'shared', label: 'Shared with Me' },
                { id: 'recent', label: 'Recent' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-700/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Sort */}
          <div className="flex items-center gap-3">
            <div className="w-full sm:w-64">
              <Input
                placeholder="Search whiteboards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchBoards()}
                leftIcon={<Search className="w-3.5 h-3.5" />}
                className="py-1.5 text-xs rounded-xl"
              />
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#2D6A4F] cursor-pointer"
              >
                <option value="updatedAt">Last Modified</option>
                <option value="createdAt">Date Created</option>
                <option value="title">Title (A-Z)</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 cursor-pointer"
                title={`Order: ${sortOrder}`}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Board Cards Grid */}
        <div className="mt-8 flex-1">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-56 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 animate-pulse p-4 flex flex-col justify-between"
                >
                  <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl w-full" />
                  <div className="space-y-2 mt-3">
                    <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-md w-3/4" />
                    <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-md w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : boards.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {boards.map((board) => (
                <WhiteboardCard
                  key={board.id}
                  board={board}
                  onRename={(b) => setBoardToRename(b)}
                  onDuplicate={handleDuplicate}
                  onDelete={(b) => setBoardToDelete(b)}
                  onShare={handleShareClick}
                />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-300 dark:border-gray-800 p-8 max-w-lg mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-[#E8F5E9] dark:bg-emerald-950/60 flex items-center justify-center text-[#2D6A4F] dark:text-emerald-400 mx-auto mb-4">
                <Layers className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white font-heading">
                {searchQuery ? 'No matching whiteboards found' : 'No whiteboards yet'}
              </h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                {searchQuery
                  ? `Try a different keyword or clear your search.`
                  : 'Start by creating your first infinite whiteboard to brainstorm and draw with AI.'}
              </p>
              <div className="mt-6">
                <Button
                  size="md"
                  onClick={() => setCreateModalOpen(true)}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Create Whiteboard
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <CreateBoardModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />

      <RenameBoardModal
        board={boardToRename}
        isOpen={!!boardToRename}
        onClose={() => setBoardToRename(null)}
      />

      <DeleteBoardModal
        board={boardToDelete}
        isOpen={!!boardToDelete}
        onClose={() => setBoardToDelete(null)}
      />
    </div>
  );
};
