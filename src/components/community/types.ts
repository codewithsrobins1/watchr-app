import type { AccentColor } from '@/types';

export interface CommunityMember {
  user_id: string;
  role: string;
  profile: {
    id: string;
    username: string;
    avatar_emoji: string;
    accent_color: AccentColor | string;
  };
}

