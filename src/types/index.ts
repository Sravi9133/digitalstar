import type { ReactNode } from "react";

export interface Competition {
  id: string;
  name: string;
  description: string;
  deadline: Date;
  icon: ReactNode;
}

export interface Submission {
  id: string;
  name: string;
  email: string;
  phone: string;
  university: string;
  competitionId: string;
  competitionName: string;
  fileName: string;
  submittedAt: Date;
}
