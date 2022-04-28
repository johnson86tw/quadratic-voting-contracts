# How to test voting results according to how you vote?

## Prerequisites
- Run `yarn` to install the dependencies
- Run `yarn build` to compile the contracts and generate typechain files.
- Run `yarn start` to start localhost network.
- Run `./test/e2e/runScripts0-3.sh` to deploy the contracts and deploy a poll.

## Vote and Tally
- Run `yarn hardhat run scripts/maci/publishMessages.ts --network localhost` to publish messages.
- Run `yarn hardhat run scripts/maci/reallocate.ts --network localhost` to reallocate votes.
- Run `yarn hardhat run scripts/maci/changeKey.ts --network localhost` to change key.
- Run `yarn hardhat run scripts/maci/tallyVotesDuringVotingPeriod.ts --network localhost` to tally votes.

## Demo

1. Publish 3 messages:
```bash
yarn hardhat run scripts/maci/publishMessages.ts --network localhost
```

Output:
```bash
Publishing message...
Transaction hash: 0x7394984dfd9fadb28367be9b79d58dc744bedab6e622bf4b68edd8e42d1c08d5
Publishing message...
Transaction hash: 0xcaea3a765db8a3bd75577bd775ce347da066c569eb17166cf5c43766153405b3
Publishing message...
Transaction hash: 0xdc1a81f3a7556b296c5d58ea09e6f25e3b3a18abac25ed778c4b0fffff35bb1c
```

2. Tally votes:
```bash
yarn hardhat run scripts/maci/tallyVotesDuringVotingPeriod.ts --network localhost
```

Output:
```bash
fromBlock = 0
message processing...
vote tallying...
{
  network: 'localhost',
  maci: '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6',
  pollId: 0,
  newTallyCommitment: '0x27918fcd5e2adc310566f63d723e49ab72580a5764867feacfddb52e27923001',
  results: {
    tally: [
      '4', '1', '0', '3', '0', '0',
      '0', '0', '0', '0', '0', '0',
      '0', '0', '0', '0', '0', '0',
      '0', '0', '0', '0', '0', '0',
      '0'
    ],
    salt: '0x278fe61fda9cf2eefce179cee3a4ab8ddaf1d90521d999db225f5f47db844261'
  },
  totalSpentVoiceCredits: {
    spent: '26',
    salt: '0x20a22d0d0a3f531e0db1d22784273ff4c683152acad7b9cc7c2f1b8252c7ec00'
  },
  perVOSpentVoiceCredits: {
    tally: [
      '16', '1', '0', '9', '0', '0',
      '0',  '0', '0', '0', '0', '0',
      '0',  '0', '0', '0', '0', '0',
      '0',  '0', '0', '0', '0', '0',
      '0'
    ],
    salt: '0x175722990841bb256ddce1b69dbcb548a19af6e86561bf9bae103dffa7e4f1a4'
  }
}
```