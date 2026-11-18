import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MoreVertical,
  ExternalLink,
  Edit2,
  Copy,
  Trash2,
  Users,
  Clock,
  Layers,
} from 'lucide-react';
import { Whiteboard } from '../../types';
import { Avatar } from '../common/Avatar';

export interface WhiteboardCardProps {
  board: Whiteboard;
  onRename: (board: Whiteboard) => void;
  onDuplicate: (board: Whiteboard) => void;
  onDelete: (board: Whiteboard) => void;
  onShare: (board: Whiteboard) => void;
}

export const WhiteboardCard: React.FC<WhiteboardCardProps> = ({
  board,
  onRename,
  onDuplicate,
  onDelete,
  onShare,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const roleStyles = {
    OWNER: 'bg-[#E8F5E9] dark:bg-emerald-950/60 text-[#1B4332] dark:text-emerald-300 border-[#2D6A4F]/30 dark:border-emerald-800',
    EDITOR: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    VIEWER: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700',
  };

  return (
    <div
      onClick={() => navigate(`/whiteboard/${board.id}`)}
      className="group relative bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 hover:border-[#2D6A4F]/50 dark:hover:border-emerald-500/50 shadow-xs hover:shadow-xl transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer"
    >
      {/* Top Preview Canvas Area */}
      <div className="h-36 w-full bg-[#F4F6F4] dark:bg-gray-950/80 relative border-b border-gray-100 dark:border-gray-800 p-4 flex flex-col justify-between overflow-hidden">
        {/* Subtle dot pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#d1d5db_1px,transparent_1px)] dark:bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:12px_12px] opacity-70" />

        <div className="relative z-10 flex items-center justify-between">
          <span
            className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
              roleStyles[board.role] || roleStyles.VIEWER
            }`}
          >
            {board.role}
          </span>

          {/* Menu Button */}
          <div
            className="relative"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/80 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 mt-1 w-44 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 py-1.5 z-20"
                onMouseLeave={() => setMenuOpen(false)}
              >
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate(`/whiteboard/${board.id}`);
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left font-medium cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                  Open Canvas
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onShare(board);
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left font-medium cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-gray-400" />
                  Collaborators
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onRename(board);
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left font-medium cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-gray-400" />
                  Rename Board
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDuplicate(board);
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left font-medium cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-gray-400" />
                  Duplicate
                </button>

                {board.role === 'OWNER' && (
                  <>
                    <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(board);
                      }}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors text-left font-medium cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      Delete Board
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Thumbnail Preview / Graphic */}
        <div className="relative z-10 flex items-center justify-center opacity-40 group-hover:opacity-75 transition-opacity">
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#2D6A4F]/30 dark:bg-emerald-500/30" />
            <div className="w-12 h-8 rounded-lg bg-yellow-400/40" />
            <div className="w-6 h-8 rounded-lg bg-sky-400/30" />
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500 font-medium">
          <span className="flex items-center gap-1">
            <Layers className="w-3 h-3" />
            {board.elementCount || 0} elements
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {board.memberCount || 1}
          </span>
        </div>
      </div>

      {/* Bottom Info Area */}
      <div className="p-4 bg-white dark:bg-gray-900 flex flex-col justify-between flex-1 transition-colors">
        <div>
          <h3 className="font-heading font-bold text-sm text-gray-900 dark:text-white group-hover:text-[#2D6A4F] dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
            {board.title}
          </h3>
          {board.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">{board.description}</p>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar name={board.owner.name} avatarUrl={board.owner.avatarUrl} size="xs" />
            <span className="text-[11px] text-gray-600 dark:text-gray-300 truncate max-w-[100px]">
              {board.owner.name}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{formatDate(board.updatedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
