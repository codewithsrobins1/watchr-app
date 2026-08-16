export type InvitationType = 'board' | 'community';

export interface Invitation {
  id: string;
  type: InvitationType;
  target_id: string;
  name: string;
  icon: string;
  inviter_username: string;
  inviter_avatar: string;
  created_at: string;
}
