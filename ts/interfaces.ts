interface Addresses {
  poseidonT5: string;
  poseidonT3: string;
  poseidonT6: string;
  poseidonT4: string;
  vkRegistry: string;
  pollFactory: string;
  messageAqFactory: string;
  stateAq: string;
  maci: string;
  ppt: string;
  qv?: string;
}

interface TallyResult {
  provider: string;
  maci: string;
  pollId: number;
  newTallyCommitment: string;
  results: {
    tally: string[];
    salt: string;
  };
  totalSpentVoiceCredits: {
    spent: string;
    salt: string;
  };
  perVOSpentVoiceCredits: {
    tally: string[];
    salt: string;
  };
}

export { Addresses, TallyResult };
