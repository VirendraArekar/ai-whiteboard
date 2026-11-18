import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Whiteboard } from '../../types';
import { useWhiteboardStore } from '../../store/whiteboardStore';

export interface RenameBoardModalProps {
  board: Whiteboard | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RenameBoardModal: React.FC<RenameBoardModalProps> = ({
  board,
  isOpen,
  onClose,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { updateBoard } = useWhiteboardStore();

  useEffect(() => {
    if (board) {
      setTitle(board.title);
      setDescription(board.description || '');
    }
  }, [board]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!board || !title.trim()) return;

    setIsLoading(true);
    try {
      await updateBoard(board.id, {
        title: title.trim(),
        description: description.trim(),
      });
      toast.success('Whiteboard renamed');
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update whiteboard');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rename Whiteboard"
      description="Update board title and description"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
        />

        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
        />

        <div className="pt-3 flex justify-end gap-2 border-t border-gray-100">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
