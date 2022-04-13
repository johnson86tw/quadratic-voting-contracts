# Quadratic Voting Contracts

## Getting started

### Run tests
- Run `yarn` to install the dependencies
- Run `yarn build` to compile the contracts and generate typechain files.
- Run `yarn run test test/QuadraticVoting.ts` to run the tests.

### Run scripts
- Run `yarn hardhat node` to start localhost network.
- Run `yarn hardhat run scripts/0-deployQV --network localhost` to deploy contracts.
- Run `./test/runScripts0-8.sh` to run through the cycle of maci. (Notes that you should have [maci docker image](https://hub.docker.com/r/chnejohnson/maci-v1) and the generated zkeys and witnesses.)

## Quadratic Hackathon

The prize pool will be split amongst winners "pro-rata" to the amount of votes they received.

### Inspirations
- [Quadratic Voting and Funding at ETH Hackathon Beijing](https://ethresear.ch/t/quadratic-voting-and-funding-at-eth-hackathon-beijing/8910)
- [GitcoinDAO Hackathon 2022](https://gov.gitcoin.co/t/gitcoindao-hackathon-2022/9405)
- [ETHDenver 2022 In-Person BUIDLathon](https://dorahacks.io/blog/guides/voters-guide-ethdenver-2022-in-person-hackathon/)
- [Reflections on Quadratic Voting as a Hackathon Judging Mechanism](https://medium.com/codeless-conduct/reflections-on-quadratic-voting-as-a-hackathon-judging-mechanism-b5ed299fe56)
