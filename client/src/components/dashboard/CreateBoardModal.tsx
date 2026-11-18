import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Sparkles, Workflow, Kanban } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useWhiteboardStore } from '../../store/whiteboardStore';

export interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TEMPLATES = [
  {
    id: 'blank',
    title: 'Blank Canvas',
    description: 'Start from scratch with infinite space',
    icon: Layout,
  },
  {
    id: 'architecture',
    title: 'System Architecture',
    description: 'Services, DBs, and API gateway blueprint',
    icon: Workflow,
  },
  {
    id: 'sprint',
    title: 'Agile Sprint Board',
    description: 'Backlog, In Progress, and Done lanes',
    icon: Kanban,
  },
  {
    id: 'brainstorm',
    title: 'AI Brainstorming',
    description: 'Pre-populated with Gemini AI prompt ideas',
    icon: Sparkles,
  },
];

export const CreateBoardModal: React.FC<CreateBoardModalProps> = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('blank');
  const [isLoading, setIsLoading] = useState(false);

  const { createBoard } = useWhiteboardStore();
  const navigate = useNavigate();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a board title');
      return;
    }

    setIsLoading(true);
    try {
      const board = await createBoard(title.trim(), description.trim());
      toast.success('Whiteboard created!');
      onClose();
      navigate(`/whiteboard/${board.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create board');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Whiteboard"
      description="Choose a title and optional starter template"
      maxWidth="lg"
    >
      <form onSubmit={handleCreate} className="space-y-5">
        <Input
          label="Whiteboard Title"
          placeholder="e.g. Q4 Engineering Architecture"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
        />

        <Input
          label="Description (Optional)"
          placeholder="Brief notes or purpose of this whiteboard..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-2">
            Starter Template
          </label>
          <div className="grid grid-cols-2 gap-3">
            {TEMPLATES.map((tpl) => {
              const Icon = tpl.icon;
              const isSelected = selectedTemplate === tpl.id;
              return (
                <div
                  key={tpl.id}
                  onClick={() => setSelectedTemplate(tpl.id)}
                  className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#2D6A4F] bg-[#E8F5E9]/50 ring-1 ring-[#2D6A4F]'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 mb-1.5 ${
                      isSelected ? 'text-[#2D6A4F]' : 'text-gray-500'
                    }`}
                  />
                  <p className="text-xs font-bold text-gray-900">{tpl.title}</p>
                  <p className="text-[10px] text-gray-500 line-clamp-1">{tpl.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Create Whiteboard
          </Button>
        </div>
      </form>
    </Modal>
  );
};
