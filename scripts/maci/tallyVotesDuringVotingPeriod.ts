import hre, { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import { Addresses } from "../../ts/interfaces";
import { checkDeployment, checkEnvFile } from "../../ts/utils";
import genMaciState from "../../ts/genMaciState";
import { Keypair, PrivKey } from "maci-domainobjs";

/*
 * Notice that only coordinator can tally votes.
 */

const pollId = 0;

const coordinatorPrivKey = process.env.COORDINATOR_PRIV_KEY as string;

const deploymentFileName = `deployment-${hre.network.name}.json`;
const deploymentPath = path.join(
  __dirname,
  "../../deployment",
  deploymentFileName
);

async function main() {
  checkEnvFile("COORDINATOR_PRIV_KEY");
  const [deployer] = await ethers.getSigners();

  const addresses = JSON.parse(
    fs.readFileSync(deploymentPath).toString()
  ) as Addresses;
  checkDeployment(addresses);

  const coordinatorKeypair = new Keypair(
    PrivKey.unserialize(coordinatorPrivKey)
  );

  let fromBlock = 0;
  console.log(`fromBlock = ${fromBlock}`);

  const maciState = await genMaciState(
    deployer.provider!,
    addresses.maci,
    coordinatorKeypair,
    pollId,
    fromBlock
  );

  const poll = maciState.polls[pollId];

  console.log("message processing...");
  const messageBatchSize = poll.batchSizes.messageBatchSize;
  const numMessages = poll.messages.length;
  let totalMessageBatches =
    numMessages <= messageBatchSize
      ? 1
      : Math.floor(numMessages / messageBatchSize);

  if (numMessages > messageBatchSize && numMessages % messageBatchSize > 0) {
    totalMessageBatches++;
  }

  while (poll.hasUnprocessedMessages()) {
    poll.processMessages(pollId);
  }

  console.log("vote tallying...");
  const tallyBatchSize = poll.batchSizes.tallyBatchSize;
  const numStateLeaves = poll.stateLeaves.length;
  let totalTallyBatches =
    numStateLeaves <= tallyBatchSize
      ? 1
      : Math.floor(numStateLeaves / tallyBatchSize);
  if (numStateLeaves > tallyBatchSize && numStateLeaves % tallyBatchSize > 0) {
    totalTallyBatches++;
  }

  let tallyCircuitInputs;
  while (poll.hasUntalliedBallots()) {
    tallyCircuitInputs = poll.tallyVotes();
  }

  const asHex = (val: any): string => {
    return "0x" + BigInt(val).toString(16);
  };

  const tallyFileData = {
    network: hre.network.name,
    maci: addresses.maci,
    pollId,
    newTallyCommitment: asHex(tallyCircuitInputs.newTallyCommitment),
    results: {
      tally: poll.results.map((x: any) => x.toString()),
      salt: asHex(tallyCircuitInputs.newResultsRootSalt),
    },
    totalSpentVoiceCredits: {
      spent: poll.totalSpentVoiceCredits.toString(),
      salt: asHex(tallyCircuitInputs.newSpentVoiceCreditSubtotalSalt),
    },
    perVOSpentVoiceCredits: {
      tally: poll.perVOSpentVoiceCredits.map((x: any) => x.toString()),
      salt: asHex(tallyCircuitInputs.newPerVOSpentVoiceCreditsRootSalt),
    },
  };
  console.log(tallyFileData);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
