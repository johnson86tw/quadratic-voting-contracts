# Quadratic Voting Contracts

This project is about Ethereum smart contracts for running quadratic voting (QV). It can also be used as a starter to build more complicated QV applications on the [minimal anti-collusion infrastructure (MACI)](https://privacy-scaling-explorations.github.io/maci/). 

## Getting started

### Run tests
- Run `yarn` to install the dependencies
- Run `yarn build` to compile the contracts and generate typechain files.
- Run `yarn run test test/QuadraticVoting.ts` to run the tests.

### Run scripts
- Run `yarn start` to start localhost network.
- Run `yarn hardhat run scripts/maci/0-deploy.ts --network localhost` to deploy contracts.
- Run `yarn hardhat run scripts/maci/6-genProofs.ts --network localhost` to generate proofs with docker-compose. (Note that you should have this [maci docker image](https://hub.docker.com/r/chnejohnson/maci-v1) and the [generated zkeys and witnesses](https://github.com/privacy-scaling-explorations/maci/wiki/Download-Precompiled-Circuit-and-Zkeys).)
- Run `./test/runScripts0-8.sh` to run through the cycle of maci. 

## How to design a QV application?

Quadratic voting is a way of making collective decisions, a tool to elicit individual preferences over a given set of options, and also called the demand-revealing process for public goods. See ["Efficient collective decision-making, marginal cost pricing, and quadratic voting"](https://www.researchgate.net/publication/310410595_Efficient_collective_decision-making_marginal_cost_pricing_and_quadratic_voting) for more details.

The idea is to associate a cost with a vote. Voters buy as many votes as they wish by paying the square of the number of votes they want to cast using some currency which is called “voice credit”. Each voter pays some voice credits for her votes, and a vote pricing rule is a quadratic function:

Cost to the voter = (Number of votes)^2

The cost to the voter, which is the payment for votes, may be through either an artificial currency or real money. So our degree of freedom is the design of the voice credit and the way of applying the voting results to the app. 

There are two main considerations in designing a QV app:

1. What's a unit of voice credit, how to distribute voice credits to the voters, and whether voters can retain voice credits for future votes?
2. What functions do you want to execute according to the voting results?

## Applications

- [dHackathon](contracts/dHackathon) - The prize pool will be split among winners pro-rata to the number of votes they received.
- [dDonation](contracts/dDonation/) - The donations will be split based on voters' preferences, and respectively flow to the predefined addresses owned by nonprofits organizations accepting ETH donations.

## Credits

This project is supported by the Ethereum Foundation [ESP Grants](https://esp.ethereum.foundation/applicants) and powered by the [Privacy & Scaling Explorations](https://twitter.com/PrivacyScaling) team, thanks a lot!