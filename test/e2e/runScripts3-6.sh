#!/bin/bash

set -e

yarn hardhat run scripts/maci-cycle/3-deployPoll.ts --network localhost
yarn hardhat run scripts/maci-cycle/4-publishMessage.ts --network localhost

yarn hardhat run scripts/timeTravel.ts --network localhost

yarn hardhat run scripts/maci-cycle/5-merge.ts --network localhost
yarn hardhat run scripts/maci-cycle/6-genProofs.ts --network localhost


