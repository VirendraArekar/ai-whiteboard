import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Whiteboard } from '../../types';
import { useWhiteboardStore } from '../../store/whiteboardStore';

export interface DeleteBoardModalProps {
  board: Whiteboard | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DeleteBoardModal: React.FC<DeleteBoardModalProps> = ({
  board,
  isOpen,
  onClose,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { deleteBoard } = useWhiteboardStore();

  const handleDelete = async () => {
    if (!board) return;
    setIsLoading(true);
    try {
      await deleteBoard(board.id);
      toast.success('Whiteboard permanently deleted');
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete whiteboard');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Whiteboard"
      description="This action cannot be undone"
    >
      <div className="space-y-4">
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-xs text-red-800 leading-relaxed">
            Are you sure you want to permanently delete{' '}
            <span className="font-bold">"{board?.title}"</span>? All canvas elements, sticky notes,
            charts, and collaborator memberships will be erased.
          </p>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} isLoading={isLoading}>
            Yes, Delete Board
          </Button>
        </div>
      </div>
    </Modal>
  );
};
