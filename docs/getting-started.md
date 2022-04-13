# Getting started

## Run hardhat network

```bash
yarn hardhat node
```

## Deploy contracts

```bash
yarn hardhat run scripts/0-deploy.ts --network localhost
```

## Run docker-compose

```bash
docker-compose up -d
docker-compose exec maci bash
cd ~/maci/cli
```

## Set verifying keys

```bash
node build/index.js setVerifyingKeys \
    --vk_registry 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9 \
    --state-tree-depth 10 \
    --int-state-tree-depth 1 \
    --msg-tree-depth 2 \
    --vote-option-tree-depth 2 \
    --msg-batch-depth 1 \
    --process-messages-zkey ./zkeys/ProcessMessages_10-2-1-2_test.0.zkey \
    --tally-votes-zkey ./zkeys/TallyVotes_10-1-2_test.0.zkey
```

## Run scripts 2-5

```bash
./scripts/runScripts2-5.sh
```
or
```bash
yarn hardhat run scripts/2-signUp.ts --network localhost
yarn hardhat run scripts/3-deployPoll.ts --network localhost
yarn hardhat run scripts/4-publishMessage.ts --network localhost

yarn hardhat run scripts/timeTravel.ts --network localhost
yarn hardhat run scripts/5-merge.ts --network localhost
```

## Generate proofs
```bash
node build/index.js genProofs \
    --contract 0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6 \
    --privkey macisk.232d0cc27d0ebb93aa81cad1ca38198559c692d40e17b7620e17a36c0ec780c0 \
    --poll-id 0 \
    --tally-file proofs/tally.json \
    --output proofs \
    --rapidsnark ~/rapidsnark/build/prover \
    --process-witnessgen ./zkeys/ProcessMessages_10-2-1-2_test \
    --tally-witnessgen ./zkeys/TallyVotes_10-1-2_test \
    --process-zkey ./zkeys/ProcessMessages_10-2-1-2_test.0.zkey \
    --tally-zkey ./zkeys/TallyVotes_10-1-2_test.0.zkey
```