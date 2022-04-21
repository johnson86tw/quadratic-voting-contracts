import { VerifyingKey } from "maci-domainobjs";
import path from "path";
import fs from "fs";
import tmp from "tmp";
import shelljs from "shelljs";
import { VkRegistry } from "../build/typechain";

interface TreeDepths {
  stateTreeDepth: string | number;
  intStateTreeDepth: string | number;
  msgTreeDepth: string | number;
  msgBatchDepth: string | number;
  voteOptionTreeDepth: string | number;
}

interface VkPath {
  processVk: string;
  tallyVk: string;
}

const setVerifyingKeys = async (
  treeDepths: TreeDepths,
  vkPath: VkPath,
  vkRegistry: VkRegistry
) => {
  // turn into number
  Object.keys(treeDepths).forEach((key) => {
    treeDepths[key as keyof TreeDepths] = Number(
      treeDepths[key as keyof TreeDepths]
    );
  });

  const processZkeyFile = path.resolve(vkPath.processVk);
  const tallyZkeyFile = path.resolve(vkPath.tallyVk);

  const processVk: VerifyingKey = VerifyingKey.fromObj(
    extractVk(processZkeyFile)
  );
  const tallyVk: VerifyingKey = VerifyingKey.fromObj(extractVk(tallyZkeyFile));

  // Simple validation
  if (
    treeDepths.stateTreeDepth < 1 ||
    treeDepths.intStateTreeDepth < 1 ||
    treeDepths.msgTreeDepth < 1 ||
    treeDepths.voteOptionTreeDepth < 1 ||
    treeDepths.msgBatchDepth < 1
  ) {
    throw new Error("Invalid depth or batch size parameters");
  }

  if (treeDepths.stateTreeDepth < treeDepths.intStateTreeDepth) {
    throw new Error(
      "Invalid state tree depth or intermediate state tree depth"
    );
  }

  // Check the pm zkey filename against specified params
  const pmMatch = processZkeyFile.match(/.+_(\d+)-(\d+)-(\d+)-(\d+)_/);
  if (pmMatch == null) {
    throw new Error(`${processZkeyFile} has an invalid filename`);
  }
  const pmStateTreeDepth = Number(pmMatch[1]);
  const pmMsgTreeDepth = Number(pmMatch[2]);
  const pmMsgBatchDepth = Number(pmMatch[3]);
  const pmVoteOptionTreeDepth = Number(pmMatch[4]);

  const tvMatch = tallyZkeyFile.match(/.+_(\d+)-(\d+)-(\d+)_/);
  if (tvMatch == null) {
    throw new Error(`${tallyZkeyFile} has an invalid filename`);
  }
  const tvStateTreeDepth = Number(tvMatch[1]);
  const tvIntStateTreeDepth = Number(tvMatch[2]);
  const tvVoteOptionTreeDepth = Number(tvMatch[3]);

  if (
    treeDepths.stateTreeDepth !== pmStateTreeDepth ||
    treeDepths.msgTreeDepth !== pmMsgTreeDepth ||
    treeDepths.msgBatchDepth !== pmMsgBatchDepth ||
    treeDepths.voteOptionTreeDepth !== pmVoteOptionTreeDepth ||
    treeDepths.stateTreeDepth != tvStateTreeDepth ||
    treeDepths.intStateTreeDepth != tvIntStateTreeDepth ||
    treeDepths.voteOptionTreeDepth != tvVoteOptionTreeDepth
  ) {
    throw new Error("incorrect .zkey file; please check the circuit params");
  }

  const messageBatchSize = 5 ** treeDepths.msgBatchDepth;

  // Query the contract to see if the processVk has been set
  const processVkSig = genProcessVkSig(
    treeDepths.stateTreeDepth,
    treeDepths.msgTreeDepth,
    treeDepths.voteOptionTreeDepth,
    messageBatchSize
  );

  const isProcessVkSet = await vkRegistry.isProcessVkSet(
    processVkSig.toString()
  );

  if (isProcessVkSet) {
    throw new Error(
      "this process verifying key is already set in the contract"
    );
  }

  // Query the contract to see if the tallyVk has been set
  const tallyVkSig = genTallyVkSig(
    treeDepths.stateTreeDepth,
    treeDepths.intStateTreeDepth,
    treeDepths.voteOptionTreeDepth
  );

  const isTallyVkSet = await vkRegistry.isTallyVkSet(tallyVkSig.toString());

  if (isTallyVkSet) {
    throw new Error("this tally verifying key is already set in the contract");
  }

  try {
    console.log("Setting verifying keys...");
    const tx = await vkRegistry.setVerifyingKeys(
      treeDepths.stateTreeDepth,
      treeDepths.intStateTreeDepth,
      treeDepths.msgTreeDepth,
      treeDepths.voteOptionTreeDepth,
      5 ** treeDepths.msgBatchDepth,
      // @ts-ignore
      processVk.asContractParam(),
      tallyVk.asContractParam()
    );

    const receipt = await tx.wait();
    if (receipt.status !== 1) {
      throw new Error("transaction failed");
    }

    console.log("Transaction hash:", tx.hash);

    const processVkOnChain = await vkRegistry.getProcessVk(
      treeDepths.stateTreeDepth,
      treeDepths.msgTreeDepth,
      treeDepths.voteOptionTreeDepth,
      messageBatchSize
    );

    const tallyVkOnChain = await vkRegistry.getTallyVk(
      treeDepths.stateTreeDepth,
      treeDepths.intStateTreeDepth,
      treeDepths.voteOptionTreeDepth
    );

    if (!compareVks(processVk, processVkOnChain)) {
      throw new Error("processVk mismatch");
    }
    if (!compareVks(tallyVk, tallyVkOnChain)) {
      throw new Error("tallyVk mismatch");
    }
  } catch (e) {
    throw new Error(`Failed to set verifying key: ${e}`);
  }
};

export default setVerifyingKeys;

const extractVk = (zkeyPath: string) => {
  // Create tmp directory
  const tmpObj = tmp.dirSync();
  const tmpDirPath = tmpObj.name;
  const vkJsonPath = path.join(tmpDirPath, "vk.json");

  const exportCmd = `yarn snarkjs zkev ${zkeyPath} ${vkJsonPath}`;
  shelljs.exec(exportCmd);

  const vk = JSON.parse(fs.readFileSync(vkJsonPath).toString());

  fs.unlinkSync(vkJsonPath);
  tmpObj.removeCallback();

  return vk;
};

const genProcessVkSig = (
  _stateTreeDepth: number,
  _messageTreeDepth: number,
  _voteOptionTreeDepth: number,
  _batchSize: number
): BigInt => {
  return (
    (BigInt(_batchSize) << BigInt(192)) +
    (BigInt(_stateTreeDepth) << BigInt(128)) +
    (BigInt(_messageTreeDepth) << BigInt(64)) +
    BigInt(_voteOptionTreeDepth)
  );
};

const genTallyVkSig = (
  _stateTreeDepth: number,
  _intStateTreeDepth: number,
  _voteOptionTreeDepth: number
): BigInt => {
  return (
    (BigInt(_stateTreeDepth) << BigInt(128)) +
    (BigInt(_intStateTreeDepth) << BigInt(64)) +
    BigInt(_voteOptionTreeDepth)
  );
};

const compareVks = (vk: VerifyingKey, vkOnChain: any): boolean => {
  let isEqual = vk.ic.length === vkOnChain.ic.length;
  for (let i = 0; i < vk.ic.length; i++) {
    isEqual = isEqual && vk.ic[i].x.toString() === vkOnChain.ic[i].x.toString();
    isEqual = isEqual && vk.ic[i].y.toString() === vkOnChain.ic[i].y.toString();
  }
  isEqual = isEqual && vk.alpha1.x.toString() === vkOnChain.alpha1.x.toString();
  isEqual = isEqual && vk.alpha1.y.toString() === vkOnChain.alpha1.y.toString();
  isEqual =
    isEqual && vk.beta2.x[0].toString() === vkOnChain.beta2.x[0].toString();
  isEqual =
    isEqual && vk.beta2.x[1].toString() === vkOnChain.beta2.x[1].toString();
  isEqual =
    isEqual && vk.beta2.y[0].toString() === vkOnChain.beta2.y[0].toString();
  isEqual =
    isEqual && vk.beta2.y[1].toString() === vkOnChain.beta2.y[1].toString();
  isEqual =
    isEqual && vk.delta2.x[0].toString() === vkOnChain.delta2.x[0].toString();
  isEqual =
    isEqual && vk.delta2.x[1].toString() === vkOnChain.delta2.x[1].toString();
  isEqual =
    isEqual && vk.delta2.y[0].toString() === vkOnChain.delta2.y[0].toString();
  isEqual =
    isEqual && vk.delta2.y[1].toString() === vkOnChain.delta2.y[1].toString();
  isEqual =
    isEqual && vk.gamma2.x[0].toString() === vkOnChain.gamma2.x[0].toString();
  isEqual =
    isEqual && vk.gamma2.x[1].toString() === vkOnChain.gamma2.x[1].toString();
  isEqual =
    isEqual && vk.gamma2.y[0].toString() === vkOnChain.gamma2.y[0].toString();
  isEqual =
    isEqual && vk.gamma2.y[1].toString() === vkOnChain.gamma2.y[1].toString();

  return isEqual;
};
