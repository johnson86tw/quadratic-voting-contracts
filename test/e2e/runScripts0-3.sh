#!/bin/bash

set -e

yarn hardhat run scripts/maci/0-deploy.ts --network localhost
yarn hardhat run scripts/maci/1-setVerifyingKeys.ts --network localhost
yarn hardhat run scripts/maci/2-signUp.ts --network localhost
yarn hardhat run scripts/maci/3-deployPoll.ts --network localhost