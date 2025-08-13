
import type { ReactNode } from "react";

export interface Competition {
  id: string;
  name: string;
  description: string;
  deadline: Date;
  icon: ReactNode;
  prize?: string;
}

export type Submission = {
  id: string;
  competitionId: string;
  competitionName: string;
  submittedAt: Date;
  isWinner?: boolean;
  rank?: 1 | 2 | 3;
  
  // Fields for general submission
  name?: string;
  email?: string;
  phone?: string;
  university?: string;
  fileName?: string;
  fileUrl?: string;

  // Fields for "Follow & Win"
  registrationId?: string;
  instagramHandle?: string;
  school?: string;
  schoolLink?: string;

  // Fields for "Reel It. Feel It." and "My First Day"
  postLink?: string;
  redditPostLink?: string;

  // Field for referral tracking
  refSource?: string;
};

export interface CompetitionMeta {
  resultAnnouncementDate: Date;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  link?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface CuratedWinner {
  DATE: string | Date;
  'REG NO': string | number;
  SCHOOL: string;
}
