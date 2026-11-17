export type BoardRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  createdAt?: string;
}

export interface WhiteboardMember {
  id: string;
  userId: string;
  role: BoardRole;
  createdAt: string;
  user: User;
}

export interface Whiteboard {
  id: string;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  role: BoardRole;
  owner: User;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
  elementCount?: number;
  members?: WhiteboardMember[];
  elements?: CanvasElement[];
}

export type CanvasTool =
  | 'select'
  | 'hand'
  | 'pen'
  | 'pencil'
  | 'highlighter'
  | 'eraser'
  | 'text'
  | 'sticky_note'
  | 'rectangle'
  | 'rounded_rect'
  | 'circle'
  | 'ellipse'
  | 'triangle'
  | 'diamond'
  | 'star'
  | 'line'
  | 'arrow'
  | 'connector'
  | 'chart'
  | 'image';

export type ShapeType =
  | 'rectangle'
  | 'rounded_rect'
  | 'circle'
  | 'ellipse'
  | 'triangle'
  | 'diamond'
  | 'star'
  | 'line'
  | 'arrow'
  | 'cylinder';

export interface CanvasElement {
  id: string;
  whiteboardId: string;
  type: string;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  data: Record<string, any>;
  createdById?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CollaboratorCursor {
  userId: string;
  socketId: string;
  name: string;
  color: string;
  x: number;
  y: number;
}

export interface CollaboratorPresence {
  socketId: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: BoardRole;
  color: string;
}
