import { providers, Signer } from "ethers";
import { MACI, Poll, AccQueueQuinaryMaci } from "../typechain/";

const mergeMaciState = async (
  provider: providers.Provider,
  maci: MACI,
  poll: Poll,
  pollId: number,
  stateAq: AccQueueQuinaryMaci,
  numQueueOps = 4 // The number of subroot queue operations per transaction
) => {
  const dd = await poll.getDeployTimeAndDuration();
  const deadline = Number(dd[0]) + Number(dd[1]);

  const now = await currentBlockTimestamp(provider);

  if (now < deadline) {
    throw new Error(
      "Voting period is not over. " +
        "Please wait till " +
        new Date(deadline * 1000)
    );
  }

  while (true) {
    const subTreesMerged = await stateAq.subTreesMerged();
    if (subTreesMerged) {
      console.log("All state subtrees have been merged.");
      break;
    }

    const indices = (await stateAq.getSrIndices()).map((x) => Number(x));

    console.log(`Merging state subroots ${indices[0] + 1} / ${indices[1] + 1}`);

    const tx = await poll.mergeMaciStateAqSubRoots(
      numQueueOps.toString(),
      pollId.toString()
    );
    const receipt = await tx.wait();

    console.log(
      `Executed mergeMaciStateAqSubRoots(); ` +
        `gas used: ${receipt.gasUsed.toString()}`
    );
    console.log(`Transaction hash: ${receipt.transactionHash}\n`);
  }

  // Check if the state AQ has been fully merged
  const stateTreeDepth = Number(await maci.stateTreeDepth());
  const mainRoot = (
    await stateAq.getMainRoot(stateTreeDepth.toString())
  ).toString();

  if (mainRoot === "0" || pollId > 0) {
    console.log("Merging subroots to a main state root...");
    const tx = await poll.mergeMaciStateAq(pollId.toString());
    const receipt = await tx.wait();
    console.log(
      `Executed mergeStateAq(); ` + `gas used: ${receipt.gasUsed.toString()}`
    );
    console.log(`Transaction hash: ${receipt.transactionHash}`);
    console.log("The state tree has been merged.");
  } else {
    console.log("The state tree has already been merged.");
  }
};

const mergeMessage = async (
  signer: Signer,
  poll: Poll,
  messageAq: AccQueueQuinaryMaci,
  numQueueOps = 4 // The number of subroot queue operations per transaction
) => {
  // Check if the signer is the Poll owner
  const pollOwner = await poll.owner();
  const signerAddr = await signer.getAddress();
  if (pollOwner.toLowerCase() !== signerAddr.toLowerCase()) {
    throw new Error("The signer is not the owner of this Poll contract");
  }

  const dd = await poll.getDeployTimeAndDuration();
  const deadline = Number(dd[0]) + Number(dd[1]);

  const now = await currentBlockTimestamp(signer.provider!);

  if (now < deadline) {
    throw new Error(
      "Error: the voting period is not over. " +
        "Please wait till " +
        new Date(deadline * 1000)
    );
  }

  while (true) {
    const subTreesMerged = await messageAq.subTreesMerged();
    if (subTreesMerged) {
      console.log("All message subtrees have been merged.");
      break;
    }
    const indices = (await messageAq.getSrIndices()).map((x) => Number(x));

    console.log(
      `Merging message subroots ${indices[0] + 1} / ${indices[1] + 1}`
    );

    const tx = await poll.mergeMessageAqSubRoots(numQueueOps.toString());
    const receipt = await tx.wait();

    console.log(
      `Executed mergeMaciStateAqSubRoots(); ` +
        `gas used: ${receipt.gasUsed.toString()}`
    );
    console.log(`Transaction hash: ${receipt.transactionHash}\n`);
  }

  // Check if the message AQ has been fully merged
  const messageTreeDepth = Number((await poll.treeDepths()).messageTreeDepth);

  const mainRoot = (
    await messageAq.getMainRoot(messageTreeDepth.toString())
  ).toString();
  if (mainRoot === "0") {
    console.log("Merging subroots to a main message root...");
    const tx = await poll.mergeMessageAq();
    const receipt = await tx.wait();
    console.log(
      `Executed mergeMessageAq(); ` + `gas used: ${receipt.gasUsed.toString()}`
    );
    console.log(`Transaction hash: ${receipt.transactionHash}`);
    console.log("The message tree has been merged.");
  } else {
    console.log("The message tree has already been merged.");
  }
};

export { mergeMaciState, mergeMessage };

const currentBlockTimestamp = async (
  provider: providers.Provider
): Promise<number> => {
  const blockNum = await provider.getBlockNumber();
  const block = await provider.getBlock(blockNum);
  return Number(block.timestamp);
};
