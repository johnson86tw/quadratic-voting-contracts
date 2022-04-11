import { ethers } from "hardhat";
import { Command, Keypair, PrivKey } from "maci-domainobjs";
import { Poll__factory } from "../typechain/factories/Poll__factory";
import { MACI__factory } from "../typechain/factories/MACI__factory";
import { AccQueueQuinaryMaci__factory } from "../typechain";

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

const coordinatorPrivKey =
  "macisk.232d0cc27d0ebb93aa81cad1ca38198559c692d40e17b7620e17a36c0ec780c0";

const userPrivKey =
  "macisk.2c4b2cf6277e3dd8c94ac7acd73b7393646f1e922468aa9d03837e055b5741b1";
const stateIndex = 1;

async function main() {
  const [deployer, user1] = await ethers.getSigners();

  const maci = new MACI__factory(
    { ...linkedLibraryAddresses },
    deployer
  ).attach("0x610178dA211FEF7D417bC0e6FeD39F05609AD788");

  const pollContractAddress = await maci.getPoll(0);
  const poll = new Poll__factory(
    { ...linkedLibraryAddresses },
    deployer
  ).attach(pollContractAddress);

  const extContracts = await poll.extContracts();

  const messageAqAddress = extContracts.messageAq;

  const MessageAq_Factory = new AccQueueQuinaryMaci__factory(
    { ...linkedLibraryAddresses },
    deployer
  );
  const messageAq = MessageAq_Factory.attach(messageAqAddress);

  await poll.mergeMaciStateAqSubRoots(0, 0);
  await poll.mergeMaciStateAq(0);

  await poll.mergeMessageAqSubRoots(0);
  await poll.mergeMessageAq();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
