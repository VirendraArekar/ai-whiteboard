import React, { useState, useEffect } from 'react';
import { UserPlus, Copy, Trash2, Shield, Check, Link as LinkIcon } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Avatar } from '../common/Avatar';
import { api } from '../../services/api';
import { BoardRole, WhiteboardMember } from '../../types';
import { notify } from '../../utils/toast';

export interface ShareModalProps {
  boardId: string;
  userRole: BoardRole | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  boardId,
  userRole,
  isOpen,
  onClose,
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<BoardRole>('EDITOR');
  const [members, setMembers] = useState<WhiteboardMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const fetchMembers = async () => {
    try {
      const { data } = await api.get(`/whiteboards/${boardId}/members`);
      setMembers(data);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMembers();
    }
  }, [isOpen, boardId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    try {
      await api.post(`/whiteboards/${boardId}/members`, {
        email: email.trim(),
        role,
      });
      notify.success(`Invited ${email} with ${role} permissions`, 'Invite Sent');
      setEmail('');
      fetchMembers();
    } catch (err: any) {
      notify.error(err.response?.data?.message || 'Failed to invite user', 'Invite Error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: BoardRole) => {
    try {
      await api.patch(`/whiteboards/${boardId}/members/${memberId}`, {
        role: newRole,
      });
      notify.success('Member permissions updated successfully', 'Role Updated');
      fetchMembers();
    } catch (err: any) {
      notify.error(err.response?.data?.message || 'Failed to change role', 'Role Error');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await api.delete(`/whiteboards/${boardId}/members/${memberId}`);
      notify.info('Collaborator removed from whiteboard', 'Member Removed');
      fetchMembers();
    } catch (err: any) {
      notify.error(err.response?.data?.message || 'Failed to remove member', 'Error');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    notify.success('Whiteboard link copied to your clipboard!', 'Link Copied');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const isOwner = userRole === 'OWNER';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share Whiteboard"
      description="Invite team members and manage permissions"
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Copy Link Row */}
        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <LinkIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0" />
          <input
            type="text"
            readOnly
            value={window.location.href}
            className="flex-1 bg-transparent text-xs text-gray-600 dark:text-gray-300 outline-none truncate"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopyLink}
            leftIcon={isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          >
            {isCopied ? 'Copied' : 'Copy'}
          </Button>
        </div>

        {/* Invite Form */}
        {userRole !== 'VIEWER' && (
          <form onSubmit={handleInvite} className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as BoardRole)}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-xs font-semibold rounded-xl px-3 py-2 text-gray-700 dark:text-gray-200 outline-none focus:ring-1 focus:ring-[#2D6A4F] cursor-pointer"
            >
              <option value="EDITOR">Can Edit</option>
              <option value="VIEWER">Can View</option>
            </select>
            <Button
              type="submit"
              isLoading={isLoading}
              leftIcon={<UserPlus className="w-4 h-4" />}
            >
              Invite
            </Button>
          </form>
        )}

        {/* Collaborators List */}
        <div>
          <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
            Active Collaborators ({members.length})
          </h4>
          <div className="space-y-2.5 max-h-56 overflow-y-auto">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-2.5 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={m.user.name} avatarUrl={m.user.avatarUrl} size="sm" />
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">{m.user.name}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">{m.user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isOwner && m.role !== 'OWNER' ? (
                    <select
                      value={m.role}
                      onChange={(e) => handleRoleChange(m.id, e.target.value as BoardRole)}
                      className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-xs font-semibold rounded-lg px-2 py-1 text-gray-700 dark:text-gray-200 outline-none cursor-pointer"
                    >
                      <option value="EDITOR">Editor</option>
                      <option value="VIEWER">Viewer</option>
                    </select>
                  ) : (
                    <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md uppercase">
                      {m.role}
                    </span>
                  )}

                  {isOwner && m.role !== 'OWNER' && (
                    <button
                      onClick={() => handleRemoveMember(m.id)}
                      className="p-1 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                      title="Remove Member"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};
