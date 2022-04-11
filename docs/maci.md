# MACI v1.0.4

## Use docker

Build docker image with repo https://github.com/chnejohnson/maci

```
docker build -t maci .
```

or download image from [dockerhub](https://hub.docker.com/repository/docker/chnejohnson/maci-v1) (about 3 GB)

```
docker pull chnejohnson/maci-v1
```

Run docker-compose in qv-contracts

```
docker-compose up -d
```
(Run `docker-compose down` to shut down container)

Enter the maci container
```
docker-compose exec maci bash
``` 

## Generate .zkey files
```
cd ~/maci/cli

npx zkey-manager compile -c zkeys.config.yml
npx zkey-manager downloadPtau -c zkeys.config.yml
npx zkey-manager genZkeys -c zkeys.config.yml
```

## Demo

Open another terminal for running hardhat node in the container

```
docker-compose exec maci bash
cd ~/maci/contracts
npm run hardhat
```

Start using CLI
```
cd ~/maci/cli
```

Examples of serialized public and private keys:

```
Private key: macisk.49953af3585856f539d194b46c82f4ed54ec508fb9b882940cbe68bbc57e59e
Public key:  macipk.c974f4f168b79727ac98bfd53a65ea0b4e45dc2552fe73df9f8b51ebb0930330
```

### Coordinator: Deploy VkRegistry

```bash
node build/index.js deployVkRegistry
```

### Coordinator: Set verifying keys

```bash
node build/index.js setVerifyingKeys \
    --vk_registry 0x8CdaF0CD259887258Bc13a92C0a6dA92698644C0 \
    --state-tree-depth 10 \
    --int-state-tree-depth 1 \
    --msg-tree-depth 2 \
    --vote-option-tree-depth 2 \
    --msg-batch-depth 1 \
    --process-messages-zkey ./zkeys/ProcessMessages_10-2-1-2_test.0.zkey \
    --tally-votes-zkey ./zkeys/TallyVotes_10-1-2_test.0.zkey
```

### Coordinator: Create MACI instance

```bash
node build/index.js create \
    --vk-registry 0x8CdaF0CD259887258Bc13a92C0a6dA92698644C0
```

### Coordinator: Deploy poll

```bash
node ./build/index.js deployPoll \
    --maci-address 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a \
    --pubkey macipk.c974f4f168b79727ac98bfd53a65ea0b4e45dc2552fe73df9f8b51ebb0930330 \
    --duration 30 \
    --max-messages 25 \
    --max-vote-options 25 \
    --int-state-tree-depth 1 \
    --msg-tree-depth 2 \
    --msg_batch_depth 1 \
    --vote-option-tree-depth 2
```

### User: sign up

```bash
node ./build/index.js signup \
    --pubkey macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391 \
    --contract 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a
```

### User: publish message

```bash
node build/index.js publish \
    --pubkey macipk.3e7bb2d7f0a1b7e980f1b6f363d1e3b7a12b9ae354c2cd60a9cfa9fd12917391 \
    --privkey macisk.fd7aa614ec4a82716ffc219c24fd7e7b52a2b63b5afb17e81c22fe21515539c \
    --contract 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a \
    --state-index 1 \
    --vote-option-index 0 \
    --new-vote-weight 9 \
    --nonce 1 \
    --poll-id 0
```

Time Travel
```
node build timeTravel -s 30
```

### Coordinator: merge state tree

```bash
node build/index.js mergeSignups \
    --contract 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a \
    --poll-id 0
```

### Coordinator: merge message tree

```bash
node build/index.js mergeMessages \
    --contract 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a \
    --poll-id 0
```

### Coordinator: generate proofs

```bash
node build/index.js genProofs \
    --contract 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a \
    --privkey macisk.49953af3585856f539d194b46c82f4ed54ec508fb9b882940cbe68bbc57e59e \
    --poll-id 0 \
    --tally-file tally.json \
    --output proofs \
    --rapidsnark ~/rapidsnark/build/prover \
    --process-witnessgen ./zkeys/ProcessMessages_10-2-1-2_test \
    --tally-witnessgen ./zkeys/TallyVotes_10-1-2_test \
    --process-zkey ./zkeys/ProcessMessages_10-2-1-2_test.0.zkey \
    --tally-zkey ./zkeys/TallyVotes_10-1-2_test.0.zkey
```

### Coordinator: prove on chain

```bash
node build/index.js proveOnChain \
    --contract 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a \
    --poll-id 0 \
    --ppt 0xEcFcaB0A285d3380E488A39B4BB21e777f8A4EaC \
    --proof-dir proofs/
```

### Anyone: verify

```bash
node build/index.js verify \
    --contract 0xf204a4Ef082f5c04bB89F7D5E6568B796096735a \
    --poll-id 0 \
    --tally-file tally.json \
    --ppt 0xEcFcaB0A285d3380E488A39B4BB21e777f8A4EaC
```