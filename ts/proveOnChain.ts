import fs from "fs";
import path from "path";
import { hashLeftRight } from "maci-crypto";
import {
  AccQueueQuinaryMaci,
  MACI,
  Poll,
  PollProcessorAndTallyer,
  Verifier,
  VkRegistry,
} from "../typechain";

const proveOnChain = async (
  proofDirPath: string,
  maci: MACI,
  vkRegistry: VkRegistry,
  poll: Poll,
  messageAq: AccQueueQuinaryMaci,
  ppt: PollProcessorAndTallyer,
  verifier: Verifier
) => {
  let data = {
    processProofs: {},
    tallyProofs: {},
  };

  let numProcessProofs = 0;

  // Read the proof directory
  const filenames = fs.readdirSync(proofDirPath);
  for (let i = 0; i < filenames.length; i++) {
    const filename = filenames[i];
    const filepath = path.join(proofDirPath, filename);
    let match = filename.match(/process_(\d+)/);
    if (match != null) {
      // @ts-ignore
      data.processProofs[Number(match[1])] = JSON.parse(
        fs.readFileSync(filepath).toString()
      );
      numProcessProofs++;
      continue;
    }

    match = filename.match(/tally_(\d+)/);
    if (match != null) {
      // @ts-ignore
      data.tallyProofs[Number(match[1])] = JSON.parse(
        fs.readFileSync(filepath).toString()
      );
      continue;
    }
  }

  const numSignUpsAndMessages = await poll.numSignUpsAndMessages();
  const numSignUps = Number(numSignUpsAndMessages[0]);
  const numMessages = Number(numSignUpsAndMessages[1]);
  const batchSizes = await poll.batchSizes();
  const messageBatchSize = Number(batchSizes.messageBatchSize);
  const tallyBatchSize = Number(batchSizes.tallyBatchSize);
  let totalMessageBatches =
    numMessages <= messageBatchSize
      ? 1
      : Math.floor(numMessages / messageBatchSize);

  if (numMessages > messageBatchSize && numMessages % messageBatchSize > 0) {
    totalMessageBatches++;
  }

  if (numProcessProofs !== totalMessageBatches) {
    console.error(
      `Error: ${proofDirPath} does not have the correct ` +
        `number of message processing proofs ` +
        `(expected ${totalMessageBatches}, got ${numProcessProofs}.`
    );
  }

  const treeDepths = await poll.treeDepths();

  let numBatchesProcessed = Number(await ppt.numBatchesProcessed());
  const messageRootOnChain = await messageAq.getMainRoot(
    Number(treeDepths.messageTreeDepth)
  );

  const stateTreeDepth = Number(await maci.stateTreeDepth());
  const onChainProcessVk = await vkRegistry.getProcessVk(
    stateTreeDepth,
    treeDepths.messageTreeDepth,
    treeDepths.voteOptionTreeDepth,
    messageBatchSize
  );

  const dd = await poll.getDeployTimeAndDuration();
  const pollEndTimestampOnChain = dd[0].toBigInt() + dd[1].toBigInt();

  if (numBatchesProcessed < totalMessageBatches) {
    console.log("Submitting proofs of message processing...");
  }

  for (let i = numBatchesProcessed; i < totalMessageBatches; i++) {
    //const currentMessageBatchIndex = Number(await ppt.currentMessageBatchIndex())
    let currentMessageBatchIndex;
    if (numBatchesProcessed === 0) {
      const r = numMessages % messageBatchSize;
      if (r === 0) {
        currentMessageBatchIndex =
          Math.floor(numMessages / messageBatchSize) * messageBatchSize;
      } else {
        currentMessageBatchIndex = numMessages;
      }

      if (currentMessageBatchIndex > 0) {
        if (r === 0) {
          currentMessageBatchIndex -= messageBatchSize;
        } else {
          currentMessageBatchIndex -= r;
        }
      }
    } else {
      currentMessageBatchIndex =
        (totalMessageBatches - numBatchesProcessed) * messageBatchSize;
    }

    if (numBatchesProcessed > 0 && currentMessageBatchIndex > 0) {
      currentMessageBatchIndex -= messageBatchSize;
    }

    const txErr = "Error: processMessages() failed";
    // @ts-ignore
    const { proof, circuitInputs, publicInputs } = data.processProofs[i];

    // Perform checks
    if (circuitInputs.pollEndTimestamp !== pollEndTimestampOnChain.toString()) {
      console.error("Error: pollEndTimestamp mismatch.");
      return;
    }

    if (
      BigInt(circuitInputs.msgRoot).toString() !== messageRootOnChain.toString()
    ) {
      console.error("Error: message root mismatch.");
      return;
    }

    let currentSbCommitmentOnChain;

    if (numBatchesProcessed === 0) {
      currentSbCommitmentOnChain = (
        await poll.currentSbCommitment()
      ).toBigInt();
    } else {
      currentSbCommitmentOnChain = (await ppt.sbCommitment()).toBigInt();
    }

    if (
      currentSbCommitmentOnChain.toString() !==
      circuitInputs.currentSbCommitment
    ) {
      console.error("Error: currentSbCommitment mismatch.");
      return;
    }

    const coordPubKeyHashOnChain = (
      await poll.coordinatorPubKeyHash()
    ).toBigInt();
    if (
      hashLeftRight(
        BigInt(circuitInputs.coordPubKey[0]),
        BigInt(circuitInputs.coordPubKey[1])
      ).toString() !== coordPubKeyHashOnChain.toString()
    ) {
      console.error("Error: coordPubKey mismatch.");
      return;
    }

    const packedValsOnChain = (
      await ppt.genProcessMessagesPackedVals(
        poll.address,
        currentMessageBatchIndex,
        numSignUps
      )
    ).toString();

    if (circuitInputs.packedVals !== packedValsOnChain) {
      console.error("Error: packedVals mismatch.");
      return;
    }

    const formattedProof = formatProofForVerifierContract(proof);

    const publicInputHashOnChain = (
      await ppt.genProcessMessagesPublicInputHash(
        poll.address,
        currentMessageBatchIndex,
        messageRootOnChain.toString(),
        numSignUps,
        circuitInputs.currentSbCommitment,
        circuitInputs.newSbCommitment
      )
    ).toBigInt();

    if (publicInputHashOnChain.toString() !== publicInputs[0].toString()) {
      console.error("Public input mismatch.");
      return;
    }

    const isValidOnChain = await verifier.verify(
      // @ts-ignore
      formattedProof,
      onChainProcessVk,
      publicInputHashOnChain.toString()
    );

    if (!isValidOnChain) {
      console.error("Error: the verifier contract found the proof invalid.");
      return;
    }

    let tx;
    try {
      tx = await ppt.processMessages(
        poll.address,
        "0x" + BigInt(circuitInputs.newSbCommitment).toString(16),
        // @ts-ignore
        formattedProof
      );
    } catch (e) {
      console.error(txErr);
      console.error(e);
      return;
    }

    const receipt = await tx.wait();

    if (receipt.status !== 1) {
      console.error(txErr);
      return;
    }

    console.log(`Transaction hash: ${tx.hash}`);

    // Wait for the node to catch up
    numBatchesProcessed = Number(await ppt.numBatchesProcessed());
    let backOff = 1000;
    let numAttempts = 0;
    while (numBatchesProcessed !== i + 1) {
      await delay(backOff);
      backOff *= 1.2;
      numAttempts++;
      if (numAttempts >= 100) {
        break;
      }
    }
    console.log(`Progress: ${numBatchesProcessed} / ${totalMessageBatches}`);
  }

  if (numBatchesProcessed === totalMessageBatches) {
    console.log("All message processing proofs have been submitted.");
  }

  // Vote tallying proofs
  const totalTallyBatches =
    numSignUps < tallyBatchSize
      ? 1
      : Math.floor(numSignUps / tallyBatchSize) + 1;

  let tallyBatchNum = Number(await ppt.tallyBatchNum());

  console.log();
  if (tallyBatchNum < totalTallyBatches) {
    console.log("Submitting proofs of vote tallying...");
  }

  for (let i = tallyBatchNum; i < totalTallyBatches; i++) {
    const batchStartIndex = i * tallyBatchSize;

    const txErr = "Error: tallyVotes() failed";
    // @ts-ignore
    const { proof, circuitInputs, publicInputs } = data.tallyProofs[i];

    const currentTallyCommitmentOnChain = await ppt.tallyCommitment();
    if (
      currentTallyCommitmentOnChain.toString() !==
      circuitInputs.currentTallyCommitment
    ) {
      console.error("Error: currentTallyCommitment mismatch.");
      return;
    }

    const packedValsOnChain = (
      await ppt.genTallyVotesPackedVals(
        numSignUps,
        batchStartIndex,
        tallyBatchSize
      )
    ).toBigInt();
    if (circuitInputs.packedVals !== packedValsOnChain.toString()) {
      console.error("Error: packedVals mismatch.");
      return;
    }

    const currentSbCommitmentOnChain = await ppt.sbCommitment();
    if (currentSbCommitmentOnChain.toString() !== circuitInputs.sbCommitment) {
      console.error("Error: currentSbCommitment mismatch.");
      return;
    }

    const publicInputHashOnChain = await ppt.genTallyVotesPublicInputHash(
      numSignUps,
      batchStartIndex,
      tallyBatchSize,
      circuitInputs.newTallyCommitment
    );
    if (publicInputHashOnChain.toString() !== publicInputs[0]) {
      console.error("Error: public input mismatch.");
      return;
    }

    const formattedProof = formatProofForVerifierContract(proof);
    let tx;
    try {
      tx = await ppt.tallyVotes(
        poll.address,
        "0x" + BigInt(circuitInputs.newTallyCommitment).toString(16),
        // @ts-ignore
        formattedProof
      );
    } catch (e) {
      console.error(txErr);
      console.error(e);
      return;
    }

    const receipt = await tx.wait();

    if (receipt.status !== 1) {
      console.error(txErr);
      return;
    }

    console.log(`Progress: ${tallyBatchNum + 1} / ${totalTallyBatches}`);
    console.log(`Transaction hash: ${tx.hash}`);

    // Wait for the node to catch up
    tallyBatchNum = Number(await ppt.tallyBatchNum());
    let backOff = 1000;
    let numAttempts = 0;
    while (tallyBatchNum !== i + 1) {
      await delay(backOff);
      backOff *= 1.2;
      numAttempts++;
      if (numAttempts >= 100) {
        break;
      }
    }
  }

  if (tallyBatchNum === totalTallyBatches) {
    console.log("All vote tallying proofs have been submitted.");
    console.log();
    console.log("OK");
  }

  return;
};

export default proveOnChain;

interface SnarkProof {
  pi_a: BigInt[];
  pi_b: BigInt[][];
  pi_c: BigInt[];
}

const formatProofForVerifierContract = (_proof: SnarkProof) => {
  return [
    _proof.pi_a[0],
    _proof.pi_a[1],

    _proof.pi_b[0][1],
    _proof.pi_b[0][0],
    _proof.pi_b[1][1],
    _proof.pi_b[1][0],

    _proof.pi_c[0],
    _proof.pi_c[1],
  ].map((x) => x.toString());
};

const delay = (ms: number): Promise<void> => {
  return new Promise((resolve: Function) => setTimeout(resolve, ms));
};
