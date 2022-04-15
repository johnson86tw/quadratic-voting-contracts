const checkEnvFile = (...args: string[]) => {
  const envs = {
    COORDINATOR_PRIV_KEY: process.env.COORDINATOR_PRIV_KEY,
    COORDINATOR_PUB_KEY: process.env.COORDINATOR_PUB_KEY,

    USER_PRIV_KEY: process.env.USER_PRIV_KEY,

    MAX_USERS: process.env.MAX_USERS,
    MAX_MESSAGES: process.env.MAX_MESSAGES,
    MAX_VOTE_OPTIONS: process.env.MAX_VOTE_OPTIONS,

    STATE_TREE_DEPTH: process.env.STATE_TREE_DEPTH,
    INT_STATE_TREE_DEPTH: process.env.INT_STATE_TREE_DEPTH,
    MESSAGE_TREE_DEPTH: process.env.MESSAGE_TREE_DEPTH,
    MESSAGE_TREE_SUB_DEPTH: process.env.MESSAGE_TREE_SUB_DEPTH,
    VOTE_OPTION_TREE_DEPTH: process.env.VOTE_OPTION_TREE_DEPTH,

    VK_REGISTRY: process.env.VK_REGISTRY,
    MACI: process.env.MACI,
    POLL_ID: process.env.POLL_ID,
  };

  if (args.length > 0) {
    args.forEach((key) => {
      if (!envs[key as keyof typeof envs]) {
        throw new Error(`Invalid .env file of ${key}`);
      }
    });
  } else {
    // check all
    for (const [key, value] of Object.entries(envs)) {
      if (!value) {
        throw new Error(`Invalid .env file of ${key}`);
      }
    }
  }
};

export { checkEnvFile };
