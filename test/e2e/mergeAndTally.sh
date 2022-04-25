#!/bin/bash

set -e


yarn hardhat run scripts/timeTravel.ts --network localhost
yarn hardhat run scripts/maci/5-merge.ts --network localhost
yarn hardhat run scripts/maci/tallyVotes.ts --network localhost

