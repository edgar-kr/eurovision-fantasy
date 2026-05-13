export interface Participant {
  id: string;
  name: string;
  claimedBy: string | null;
}

export interface SessionData {
  id: string;
  countries: string[];
  participants: Participant[];
  votes: {
    [participantId: string]: {
      [countryName: string]: number;
    };
  };
  createdAt: string;
}
