#!/bin/bash

set -e

yarn hardhat run scripts/maci-cycle/0-deploy.ts --network localhost
yarn hardhat run scripts/maci-cycle/1-setVerifyingKeys.ts --network localhost
yarn hardhat run scripts/maci-cycle/2-signUp.ts --network localhost
yarn hardhat run scripts/maci-cycle/3-deployPoll.ts --network localhost
yarn hardhat run scripts/maci-cycle/4-publishMessage.ts --network localhost

yarn hardhat run scripts/timeTravel.ts --network localhost

yarn hardhat run scripts/maci-cycle/5-merge.ts --network localhost

rm ./proofs/tally.json

yarn hardhat run scripts/maci-cycle/6-genProofs.ts --network localhost
yarn hardhat run scripts/maci-cycle/7-proveOnChain.ts --network localhost
yarn hardhat run scripts/maci-cycle/8-verify.ts --network localhost

