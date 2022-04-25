#!/bin/bash

set -e

yarn hardhat run scripts/maci/0-deploy.ts --network localhost
yarn hardhat run scripts/maci/1-setVerifyingKeys.ts --network localhost
yarn hardhat run scripts/maci/2-signUp.ts --network localhost
yarn hardhat run scripts/maci/3-deployPoll.ts --network localhost
yarn hardhat run scripts/maci/4-publishMessage.ts --network localhost

yarn hardhat run scripts/timeTravel.ts --network localhost

yarn hardhat run scripts/maci/5-merge.ts --network localhost

rm ./proofs/tally.json

yarn hardhat run scripts/maci/6-genProofs.ts --network localhost
yarn hardhat run scripts/maci/7-proveOnChain.ts --network localhost
yarn hardhat run scripts/maci/8-verify.ts --network localhost

