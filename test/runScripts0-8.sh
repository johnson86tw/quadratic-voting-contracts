#!/bin/bash

yarn hardhat run scripts/0-deploy.ts --network localhost

./scripts/1-setVerifyingKeys.sh

yarn hardhat run scripts/2-signUp.ts --network localhost
yarn hardhat run scripts/3-deployPoll.ts --network localhost
yarn hardhat run scripts/4-publishMessage.ts --network localhost

yarn hardhat run scripts/timeTravel.ts --network localhost

yarn hardhat run scripts/5-merge.ts --network localhost

rm ./proofs/tally.json
./scripts/6-genProofs.sh

yarn hardhat run scripts/7-proveOnChain.ts --network localhost
yarn hardhat run scripts/8-verify.ts --network localhost

