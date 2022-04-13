#!/bin/bash

docker-compose run maci node ./build/index.js setVerifyingKeys \
    --vk_registry 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9 \
    --state-tree-depth 10 \
    --int-state-tree-depth 1 \
    --msg-tree-depth 2 \
    --vote-option-tree-depth 2 \
    --msg-batch-depth 1 \
    --process-messages-zkey ./zkeys/ProcessMessages_10-2-1-2_test.0.zkey \
    --tally-votes-zkey ./zkeys/TallyVotes_10-1-2_test.0.zkey