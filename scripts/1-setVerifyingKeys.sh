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

docker-compose run maci node ./build/index.js setVerifyingKeys \
    --vk_registry $vk_registry \
    --state-tree-depth $stateTreeDepth \
    --int-state-tree-depth $intStateTreeDepth \
    --msg-tree-depth $messageTreeDepth \
    --msg-batch-depth $messageTreeSubDepth \
    --vote-option-tree-depth $voteOptionTreeDepth \
    --process-messages-zkey ./zkeys/ProcessMessages_10-2-1-2_test.0.zkey \
    --tally-votes-zkey ./zkeys/TallyVotes_10-1-2_test.0.zkey