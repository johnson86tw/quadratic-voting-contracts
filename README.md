# Quadratic Voting Contracts

This project is about Ethereum smart contracts for running quadratic voting (QV). It can also be used as a starter to build more complicated QV applications on the [minimal anti-collusion infrastructure (MACI)](https://appliedzkp.github.io/maci/). 

## Getting started

### Run tests
- Run `yarn` to install the dependencies
- Run `yarn build` to compile the contracts and generate typechain files.
- Run `yarn run test test/QuadraticVoting.ts` to run the tests.

### Run scripts
- Run `yarn start` to start localhost network.
- Run `yarn hardhat run scripts/maci/0-deploy.ts --network localhost` to deploy contracts.
- Run `yarn hardhat run scripts/maci/6-genProofs.ts --network localhost` to generate proofs with docker-compose. (Note that you should have this [maci docker image](https://hub.docker.com/r/chnejohnson/maci-v1) and the generated zkeys and witnesses.)
- Run `./test/runScripts0-8.sh` to run through the cycle of maci. 

## How to design a QV application?

Quadratic voting is a way of making collective decisions, a tool to elicit individual preferences over a given set of options, and also the demand-revealing process for public goods. See ["Efficient collective decision-making, marginal cost pricing, and quadratic voting"](https://www.researchgate.net/publication/310410595_Efficient_collective_decision-making_marginal_cost_pricing_and_quadratic_voting) for more details.

The idea is to associate a cost with a vote. Voters buy as many votes as they wish by paying the square of the number of votes they want to cast using some currency which is called “voice credit”. Each voter pays some voice credits for her votes, and a vote pricing rule is a quadratic function:

Cost to the voter = (Number of votes)^2

The cost to the voter, which is the the payment for votes, may be through either an artificial currency or real money. So our degree of freedom is the design of the voice credit and the way of applying the voting results. 

There are two main considerations in designing a QV app:

1. What's a unit of voice credit, how to distribute voice credits to the voters, and whether voters can retain voice credits for future votes?
2. What functions do you want to execute according to the voting results?

### Application: Quadratic Hackathon [WIP]

The prize pool will be split among winners pro-rata to the number of votes they received.

#### Inspirations
- [Quadratic Voting and Funding at ETH Hackathon Beijing](https://ethresear.ch/t/quadratic-voting-and-funding-at-eth-hackathon-beijing/8910)
- [GitcoinDAO Hackathon 2022](https://gov.gitcoin.co/t/gitcoindao-hackathon-2022/9405)
- [ETHDenver 2022 In-Person BUIDLathon](https://dorahacks.io/blog/guides/voters-guide-ethdenver-2022-in-person-hackathon/)
- [Reflections on Quadratic Voting as a Hackathon Judging Mechanism](https://medium.com/codeless-conduct/reflections-on-quadratic-voting-as-a-hackathon-judging-mechanism-b5ed299fe56)
