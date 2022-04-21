import {
  IncrementalQuinTree,
  hashLeftRight,
  hash2,
  hash3,
  hash5,
} from "maci-crypto";
import { Poll, PollProcessorAndTallyer } from "../build/typechain";
import { TallyResult } from "./interfaces";

const genTallyResultCommitment = (
  results: BigInt[],
  salt: BigInt,
  depth: number
): BigInt => {
  const tree = new IncrementalQuinTree(depth, BigInt(0), 5, hash5);
  for (const result of results) {
    tree.insert(result);
  }
  return hashLeftRight(tree.root, salt);
};

const verifyTallyResult = async (
  tallyResult: TallyResult,
  poll: Poll,
  ppt: PollProcessorAndTallyer
): Promise<boolean> => {
  const onChainTallyCommitment = await (await ppt.tallyCommitment()).toBigInt();

  // Check the results commitment
  const validResultsCommitment =
    tallyResult.newTallyCommitment &&
    tallyResult.newTallyCommitment.match(/0x[a-fA-F0-9]+/);

  if (!validResultsCommitment) {
    console.error("Error: Invalid results commitment format");
    return false;
  }

  // Ensure that the lengths of tallyResult.results.tally and tallyResult.perVOSpentVoiceCredits.tally are correct
  const treeDepths = await poll.treeDepths();
  const voteOptionTreeDepth = Number(treeDepths.voteOptionTreeDepth);
  const numVoteOptions = 5 ** voteOptionTreeDepth;
  if (tallyResult.results.tally.length !== numVoteOptions) {
    console.error("Error: wrong number of vote options");
    return false;
  }
  if (tallyResult.perVOSpentVoiceCredits.tally.length !== numVoteOptions) {
    console.error("Error: wrong number of vote options");
    return false;
  }

  // Compute newResultsCommitment
  const newResultsCommitment = genTallyResultCommitment(
    tallyResult.results.tally.map((x) => BigInt(x)),
    BigInt(tallyResult.results.salt),
    voteOptionTreeDepth
  );

  // Compute newSpentVoiceCreditsCommitment
  const newSpentVoiceCreditsCommitment = hash2([
    BigInt(tallyResult.totalSpentVoiceCredits.spent),
    BigInt(tallyResult.totalSpentVoiceCredits.salt),
  ]);

  // Compute newPerVOSpentVoiceCreditsCommitment
  const newPerVOSpentVoiceCreditsCommitment = genTallyResultCommitment(
    tallyResult.perVOSpentVoiceCredits.tally.map((x) => BigInt(x)),
    BigInt(tallyResult.perVOSpentVoiceCredits.salt),
    voteOptionTreeDepth
  );

  // Compute newTallyCommitment
  const newTallyCommitment = hash3([
    newResultsCommitment,
    newSpentVoiceCreditsCommitment,
    newPerVOSpentVoiceCreditsCommitment,
  ]);

  if (onChainTallyCommitment !== newTallyCommitment) {
    console.error("Error: the on-chain tally commitment does not match");
    return false;
  }

  return true;
};

export { verifyTallyResult };
