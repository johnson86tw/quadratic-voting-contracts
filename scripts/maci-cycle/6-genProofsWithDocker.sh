#!/bin/bash

cd "$(dirname "$0")"

cd ..

# Load .env file
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
else
  echo "Error: .env file not found."
  exit 1
fi

docker-compose run maci node build/index.js genProofs \
    --contract $MACI \
    --privkey $COORDINATOR_PRIV_KEY \
    --poll-id $POLL_ID \
    --tally-file proofs/tally.json \
    --output proofs \
    --rapidsnark /root/rapidsnark/build/prover \
    --process-witnessgen ./zkeys/ProcessMessages_10-2-1-2_test \
    --tally-witnessgen ./zkeys/TallyVotes_10-1-2_test \
    --process-zkey ./zkeys/ProcessMessages_10-2-1-2_test.0.zkey \
    --tally-zkey ./zkeys/TallyVotes_10-1-2_test.0.zkey