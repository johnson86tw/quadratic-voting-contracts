#!/bin/bash

set -e

yarn hardhat run scripts/timeTravel.ts --network localhost

yarn hardhat run scripts/maci/5-merge.ts --network localhost

TallyFile=./proofs/tally.json
if test -f "$TallyFile"; then
    echo "Removing tally.json file"
    rm -rf ./proofs
fi

yarn hardhat run scripts/maci/6-genProofs.ts --network localhost
cat ./proofs/tally.json