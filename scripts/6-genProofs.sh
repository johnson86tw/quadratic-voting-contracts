#!/bin/bash

docker-compose run maci node build/index.js genProofs \
    --contract 0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6 \
    --privkey macisk.232d0cc27d0ebb93aa81cad1ca38198559c692d40e17b7620e17a36c0ec780c0 \
    --poll-id 0 \
    --tally-file proofs/tally.json \
    --output proofs \
    --rapidsnark /root/rapidsnark/build/prover \
    --process-witnessgen ./zkeys/ProcessMessages_10-2-1-2_test \
    --tally-witnessgen ./zkeys/TallyVotes_10-1-2_test \
    --process-zkey ./zkeys/ProcessMessages_10-2-1-2_test.0.zkey \
    --tally-zkey ./zkeys/TallyVotes_10-1-2_test.0.zkey