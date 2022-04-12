import hre, { ethers } from "hardhat";
import path from "path";
import fs from "fs";
import { Addresses } from "../ts/addresses";
import { BigNumber, BigNumberish, Signer } from "ethers";
import { Command, Keypair, VerifyingKey } from "maci-domainobjs";
import {
  G1Point,
  G2Point,
  hash5,
  hashLeftRight,
  IncrementalQuinTree,
} from "maci-crypto";

import { VkRegistry__factory } from "../typechain/factories/VkRegistry__factory";

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

const maxValues = {
  maxUsers: 25,
  maxMessages: 25,
  maxVoteOptions: 25,
};
const treeDepths = {
  intStateTreeDepth: 2, //NOTE: actualy use tally batch size of 25
  messageTreeDepth: 4,
  messageTreeSubDepth: 2,
  voteOptionTreeDepth: 2,
};
const STATE_TREE_DEPTH = 10;
const STATE_TREE_ARITY = 5;
const MESSAGE_TREE_ARITY = 5;
const messageBatchSize = MESSAGE_TREE_ARITY ** treeDepths.messageTreeSubDepth;
const tallyBatchSize = STATE_TREE_ARITY ** treeDepths.intStateTreeDepth;

async function main() {
  const [deployer, user1] = await ethers.getSigners();

  const coordinatorPrivKey = process.env.coordinatorPrivKey;
  const userPrivKey = process.env.userPrivKey;
  if (!coordinatorPrivKey || !userPrivKey) {
    throw new Error("Please provide correct MACI private keys");
  }

  const deploymentFileName = `deployment-${hre.network.name}.json`;
  const deploymentPath = path.join(__dirname, "..", deploymentFileName);
  const addresses = JSON.parse(
    fs.readFileSync(deploymentPath).toString()
  ) as Addresses;

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

  const { status } = await vkRegistry
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

  // Check that the VKs are set
  const processVkOnChain = await vkRegistry.getProcessVk(
    _stateTreeDepth,
    _messageTreeDepth,
    _voteOptionTreeDepth,
    _messageBatchSize
  );

  const tallyVkOnChain = await vkRegistry.getTallyVk(
    _stateTreeDepth,
    _intStateTreeDepth,
    _voteOptionTreeDepth
  );

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
