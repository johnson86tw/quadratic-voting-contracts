import hre, { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import { Addresses } from "../ts/addresses";

import { Poll__factory } from "../typechain/factories/Poll__factory";
import { MACI__factory } from "../typechain/factories/MACI__factory";
import { AccQueueQuinaryMaci__factory } from "../typechain";

const pollId = 0;

async function main() {
  const [deployer, user1] = await ethers.getSigners();

  const deploymentFileName = `deployment-${hre.network.name}.json`;
  const deploymentPath = path.join(__dirname, "..", deploymentFileName);
  const addresses = JSON.parse(
    fs.readFileSync(deploymentPath).toString()
  ) as Addresses;

  const linkedLibraryAddresses = {
    ["maci-contracts/contracts/crypto/Hasher.sol:PoseidonT5"]:
      addresses.poseidonT5,
    ["maci-contracts/contracts/crypto/Hasher.sol:PoseidonT3"]:
      addresses.poseidonT3,
    ["maci-contracts/contracts/crypto/Hasher.sol:PoseidonT6"]:
      addresses.poseidonT6,
    ["maci-contracts/contracts/crypto/Hasher.sol:PoseidonT4"]:
      addresses.poseidonT4,
  };

  const maci = new MACI__factory(
    { ...linkedLibraryAddresses },
    deployer
  ).attach(addresses.maci);

  const pollAddress = await maci.getPoll(pollId);
  const poll = new Poll__factory(
    { ...linkedLibraryAddresses },
    deployer
  ).attach(pollAddress);

  // const extContracts = await poll.extContracts();
  // const messageAqAddress = extContracts.messageAq;

  // const messageAq = new AccQueueQuinaryMaci__factory(
  //   { ...linkedLibraryAddresses },
  //   deployer
  // ).attach(messageAqAddress);

  await poll.mergeMaciStateAqSubRoots(0, 0);
  await poll.mergeMaciStateAq(0);

  await poll.mergeMessageAqSubRoots(0);
  await poll.mergeMessageAq();
  console.log("Successfully merged");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
