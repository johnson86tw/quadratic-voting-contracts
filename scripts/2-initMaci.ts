import { ethers } from "hardhat";
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

import {
  MACI__factory,
  MACILibraryAddresses,
} from "../typechain/factories/MACI__factory";

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
  const [deployer] = await ethers.getSigners();

  const vkRegistry = new VkRegistry__factory(deployer).attach(
    "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"
  );

  const linkedLibraryAddresses = {
    ["maci-contracts/contracts/crypto/Hasher.sol:PoseidonT5"]:
      "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    ["maci-contracts/contracts/crypto/Hasher.sol:PoseidonT3"]:
      "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    ["maci-contracts/contracts/crypto/Hasher.sol:PoseidonT6"]:
      "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
    ["maci-contracts/contracts/crypto/Hasher.sol:PoseidonT4"]:
      "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  };

  const maci = new MACI__factory(
    { ...linkedLibraryAddresses },
    deployer
  ).attach("0x610178dA211FEF7D417bC0e6FeD39F05609AD788");

  await maci.init(
    "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
    "0x0165878A594ca255338adfa4d48449f69242Eb8F"
  );

  if (await maci.isInitialised()) {
    console.log("maci is initialized");
  } else {
    throw new Error("Failed to initialize maci");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
