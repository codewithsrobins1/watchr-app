import type { Board, Community } from '@/types';

export type InvitationType = 'board' | 'community';

export interface Invitation {
  id: string;
  type: InvitationType;
  name: string;
  icon: string;
  inviter_username: string;
  inviter_avatar: string;
  created_at: string;
}

export type ConfirmActionType =
  | 'delete-board'
  | 'delete-community'
  | 'leave-board'
  | 'leave-community';

export interface ConfirmAction {
  type: ConfirmActionType;
  id: string;
  name: string;
}

export type IsOwnerFn = (community: Community) => boolean;

export interface BoardsByOwner {
  myBoards: Board[];
  sharedBoards: Board[];
}

