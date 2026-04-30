export type PersonInfo = {
  fullName: string;
  nic: string;
  contactNo: string;
  email: string;
};

export type Team = {
  _id: string;
  teamName: string;
  teamLogo: string;
  teamSlogan: string;
  teamMark: number;
  leader: PersonInfo;
  members: PersonInfo[];
  markLogs?: { delta: number; timestamp: string }[];
  createdAt: string;
  updatedAt: string;
};

export type TeamRegistrationInput = Omit<
  Team,
  "_id" | "teamMark" | "createdAt" | "updatedAt"
>;
