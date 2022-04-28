import hre, { ethers } from "hardhat";
import path from "path";
import fs from "fs";
import { Addresses } from "../../ts/interfaces";
import { VerifyingKey } from "maci-domainobjs";
import { G1Point, G2Point } from "maci-crypto";
import { VkRegistry__factory } from "../../build/typechain";
import { checkDeployment, checkEnvFile } from "../../ts/utils";

// state
const testProcessVk = new VerifyingKey(
  new G1Point(BigInt(0), BigInt(1)),
  new G2Point([BigInt(2), BigInt(3)], [BigInt(4), BigInt(5)]),
  new G2Point([BigInt(6), BigInt(7)], [BigInt(8), BigInt(9)]),
  new G2Point([BigInt(10), BigInt(11)], [BigInt(12), BigInt(13)]),
  [new G1Point(BigInt(14), BigInt(15)), new G1Point(BigInt(16), BigInt(17))]
);

const testTallyVk = new VerifyingKey(
  new G1Point(BigInt(0), BigInt(1)),
  new G2Point([BigInt(2), BigInt(3)], [BigInt(4), BigInt(5)]),
  new G2Point([BigInt(6), BigInt(7)], [BigInt(8), BigInt(9)]),
  new G2Point([BigInt(10), BigInt(11)], [BigInt(12), BigInt(13)]),
  [new G1Point(BigInt(14), BigInt(15)), new G1Point(BigInt(16), BigInt(17))]
);

const treeDepths = {
  intStateTreeDepth: 2,
  messageTreeDepth: 4,
  messageTreeSubDepth: 2,
  voteOptionTreeDepth: 2,
};
const STATE_TREE_DEPTH = 10;
const STATE_TREE_ARITY = 5;
const MESSAGE_TREE_ARITY = 5;
const messageBatchSize = MESSAGE_TREE_ARITY ** treeDepths.messageTreeSubDepth;
const tallyBatchSize = STATE_TREE_ARITY ** treeDepths.intStateTreeDepth;

const deploymentFileName = `deployment-${hre.network.name}.json`;
const deploymentPath = path.join(
  __dirname,
  "../../deployment",
  deploymentFileName
);

async function main() {
  checkEnvFile();
  const [deployer] = await ethers.getSigners();

  let addresses = JSON.parse(
    fs.readFileSync(deploymentPath).toString()
  ) as Addresses;
  checkDeployment(addresses);

  const vkRegistry = new VkRegistry__factory(deployer).attach(
    addresses.vkRegistry
  );

  const stateTreeDepth = STATE_TREE_DEPTH;
  const _stateTreeDepth = stateTreeDepth.toString();
  const _intStateTreeDepth = treeDepths.intStateTreeDepth;
  const _messageTreeDepth = treeDepths.messageTreeDepth;
  const _voteOptionTreeDepth = treeDepths.voteOptionTreeDepth;
  const _messageBatchSize = messageBatchSize.toString();
  const _processVk = testProcessVk.asContractParam();
  const _tallyVk = testTallyVk.asContractParam();

  await vkRegistry
    .setVerifyingKeys(
      _stateTreeDepth,
      _intStateTreeDepth,
      _messageTreeDepth,
      _voteOptionTreeDepth,
      _messageBatchSize,
      // @ts-ignore
      _processVk,
      _tallyVk
    )
    .then((tx) => tx.wait());

  const pSig = await vkRegistry.genProcessVkSig(
    _stateTreeDepth,
    _messageTreeDepth,
    _voteOptionTreeDepth,
    _messageBatchSize
  );

  const isPSigSet = await vkRegistry.isProcessVkSet(pSig);

  const tSig = await vkRegistry.genTallyVkSig(
    _stateTreeDepth,
    _intStateTreeDepth,
    _voteOptionTreeDepth
  );
  const isTSigSet = await vkRegistry.isTallyVkSet(tSig);

  if (isPSigSet && isTSigSet) {
    console.log("vk is set up.");
  } else {
    throw new Error("Failed to set up verifying keys.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
