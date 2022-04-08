import { ethers } from "hardhat";
import { BigNumber, BigNumberish, Signer } from "ethers";
import { Command, Keypair, VerifyingKey } from "maci-domainobjs";

import { Poll__factory } from "../typechain/factories/Poll__factory";

import {
  MACI__factory,
  MACILibraryAddresses,
} from "../typechain/factories/MACI__factory";

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

async function main() {
  const [deployer, user1] = await ethers.getSigners();

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

  const duration = 10000;
  const coordinator = new Keypair();
  const coordinatorPubkey = coordinator.pubKey.asContractParam();

  const { blockHash } = await maci
    .connect(deployer)
    .deployPoll(duration, maxValues, treeDepths, coordinatorPubkey, {
      gasLimit: 30000000,
    })
    .then((tx) => tx.wait());

  const pollContractAddress = await maci.getPoll(0);
  const poll = new Poll__factory(
    { ...linkedLibraryAddresses },
    deployer
  ).attach(pollContractAddress);

  console.log(
    `coordinator: PubKey: ${coordinator.pubKey.serialize()}, PrivKey: ${coordinator.privKey.serialize()}`
  );
  console.log("Poll deployed to:", poll.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
