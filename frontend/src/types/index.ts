export interface Photo {
  id?: string;
  url: string;
  isPrimary: boolean;
}

export interface UserProfile {
  id: string;
  phone?: string;
  name: string | null;
  dob: string | null;
  gender: string | null;
  lookingFor: string | null;
  city: string | null;
  state: string | null;
  bio: string | null;
  jobTitle: string | null;
  company: string | null;
  education: string | null;
  height: number | null;
  religion: string | null;
  relationshipGoal: string | null;
  interests: string[];
  prompts: { question: string; answer: string }[];
  phoneVerified: boolean;
  aadhaarVerified: boolean;
  selfieVerified: boolean;
  trustScore: number;
  premiumTier: string;
  lastActiveAt: string;
  createdAt: string;
  photos: Photo[];
  isOnline?: boolean;
  isAdmin?: boolean;
}

export interface MatchSummary {
  matchId: string;
  createdAt: string;
  isNewMatchWindow: boolean;
  otherUser: { id: string; name: string | null; photos: Photo[]; trustScore: number; isOnline: boolean };
  lastMessage: { content: string; createdAt: string; senderId: string } | null;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  blocked: boolean;
  blockReason?: string | null;
  readAt: string | null;
  createdAt: string;
}
