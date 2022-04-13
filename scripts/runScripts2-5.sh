#!/bin/bash

yarn hardhat run scripts/2-signUp.ts --network localhost
yarn hardhat run scripts/3-deployPoll.ts --network localhost
yarn hardhat run scripts/4-publishMessage.ts --network localhost

yarn hardhat run scripts/timeTravel.ts --network localhost
yarn hardhat run scripts/5-merge.ts --network localhost