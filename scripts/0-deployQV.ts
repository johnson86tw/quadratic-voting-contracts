import { ethers } from "hardhat";

import { PoseidonT3__factory } from "../typechain/factories/PoseidonT3__factory";
import { PoseidonT3 } from "../typechain/PoseidonT3";
import { PoseidonT4__factory } from "../typechain/factories/PoseidonT4__factory";
import { PoseidonT4 } from "../typechain/PoseidonT4";
import { PoseidonT5__factory } from "../typechain/factories/PoseidonT5__factory";
import { PoseidonT5 } from "../typechain/PoseidonT5";
import { PoseidonT6__factory } from "../typechain/factories/PoseidonT6__factory";
import { PoseidonT6 } from "../typechain/PoseidonT6";

import { VkRegistry__factory } from "../typechain/factories/VkRegistry__factory";
import { VkRegistry } from "../typechain/VkRegistry";

import {
  PollFactory__factory,
  PollFactoryLibraryAddresses,
} from "../typechain/factories/PollFactory__factory";
import { PollFactory } from "../typechain/PollFactory";

import { Poll } from "../typechain/Poll";

import {
  MessageAqFactory__factory,
  MessageAqFactoryLibraryAddresses,
} from "../typechain/factories/MessageAqFactory__factory";
import { MessageAqFactory } from "../typechain/MessageAqFactory";
import { AccQueueQuinaryMaci__factory } from "../typechain";
import { AccQueueQuinaryMaci } from "../typechain/AccQueueQuinaryMaci";

import { PollProcessorAndTallyer__factory } from "../typechain/factories/PollProcessorAndTallyer__factory";
import { PollProcessorAndTallyer } from "../typechain/PollProcessorAndTallyer";
import { MockVerifier } from "../typechain/MockVerifier";
import { MockVerifier__factory } from "../typechain/factories/MockVerifier__factory";

import {
  MACI__factory,
  MACILibraryAddresses,
} from "../typechain/factories/MACI__factory";
import { MACI } from "../typechain/MACI";

import { QuadraticVoting__factory } from "../typechain/factories/QuadraticVoting__factory";
import { QuadraticVoting } from "../typechain/QuadraticVoting";

let PoseidonT3Factory: PoseidonT3__factory;
let PoseidonT4Factory: PoseidonT4__factory;
let PoseidonT5Factory: PoseidonT5__factory;
let PoseidonT6Factory: PoseidonT6__factory;

let poseidonT3: PoseidonT3;
let poseidonT4: PoseidonT4;
let poseidonT5: PoseidonT5;
let poseidonT6: PoseidonT6;

let PollFactoryFactory: PollFactory__factory;
let MessageAqFactoryFactory: MessageAqFactory__factory;
let MessageAq_Factory: AccQueueQuinaryMaci__factory;
let messageAq: AccQueueQuinaryMaci;

let VKRegistryFactory: VkRegistry__factory;
let QuadraticVotingFactory: QuadraticVoting__factory;
let MACIFactory: MACI__factory;

let PollProcessorAndTallyerFactory: PollProcessorAndTallyer__factory;
let pollProcessorAndTallyer: PollProcessorAndTallyer;
let MockVerifierFactory: MockVerifier__factory;
let mockVerifier: MockVerifier;

let pollFactory: PollFactory;
let poll: Poll;
let messageAqFactory: MessageAqFactory;
let vkRegistry: VkRegistry;
let qv: QuadraticVoting;
let maci: MACI;

let linkedLibraryAddresses:
  | MACILibraryAddresses
  | PollFactoryLibraryAddresses
  | MessageAqFactoryLibraryAddresses;

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

  PoseidonT3Factory = new PoseidonT3__factory(deployer);
  PoseidonT4Factory = new PoseidonT4__factory(deployer);
  PoseidonT5Factory = new PoseidonT5__factory(deployer);
  PoseidonT6Factory = new PoseidonT6__factory(deployer);
  poseidonT3 = await PoseidonT3Factory.deploy();
  poseidonT4 = await PoseidonT4Factory.deploy();
  poseidonT5 = await PoseidonT5Factory.deploy();
  poseidonT6 = await PoseidonT6Factory.deploy();

  linkedLibraryAddresses = {
    ["maci-contracts/contracts/crypto/Hasher.sol:PoseidonT5"]:
      poseidonT5.address,
    ["maci-contracts/contracts/crypto/Hasher.sol:PoseidonT3"]:
      poseidonT3.address,
    ["maci-contracts/contracts/crypto/Hasher.sol:PoseidonT6"]:
      poseidonT6.address,
    ["maci-contracts/contracts/crypto/Hasher.sol:PoseidonT4"]:
      poseidonT4.address,
  };

  VKRegistryFactory = new VkRegistry__factory(deployer);
  PollFactoryFactory = new PollFactory__factory(
    { ...linkedLibraryAddresses },
    deployer
  );
  MessageAqFactoryFactory = new MessageAqFactory__factory(
    { ...linkedLibraryAddresses },
    deployer
  );
  MessageAq_Factory = new AccQueueQuinaryMaci__factory(
    { ...linkedLibraryAddresses },
    deployer
  );
  MockVerifierFactory = new MockVerifier__factory(deployer);
  PollProcessorAndTallyerFactory = new PollProcessorAndTallyer__factory(
    deployer
  );

  QuadraticVotingFactory = new QuadraticVoting__factory(deployer);
  MACIFactory = new MACI__factory({ ...linkedLibraryAddresses }, deployer);
  PollProcessorAndTallyerFactory = new PollProcessorAndTallyer__factory(
    deployer
  );

  // ============== Deploy contracts ==============

  vkRegistry = await VKRegistryFactory.deploy();

  pollFactory = await PollFactoryFactory.deploy();
  messageAqFactory = await MessageAqFactoryFactory.deploy();

  mockVerifier = await MockVerifierFactory.deploy();
  pollProcessorAndTallyer = await PollProcessorAndTallyerFactory.deploy(
    mockVerifier.address
  );

  qv = await QuadraticVotingFactory.deploy();
  maci = await MACIFactory.deploy(pollFactory.address, qv.address, qv.address);

  await pollFactory.transferOwnership(maci.address);
  await messageAqFactory.transferOwnership(pollFactory.address);

  console.log("poseidonT5 deployed to:", poseidonT5.address);
  console.log("poseidonT3 deployed to:", poseidonT3.address);
  console.log("poseidonT6 deployed to:", poseidonT6.address);
  console.log("poseidonT4 deployed to:", poseidonT4.address);

  console.log("=======================================================");

  console.log("vkRegistry deployed to:", vkRegistry.address);
  console.log("messageAqFactory deployed to:", messageAqFactory.address);
  console.log("MACI deployed to:", maci.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
