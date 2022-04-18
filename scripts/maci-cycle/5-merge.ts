import hre, { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import { Addresses } from "../../ts/interfaces";
import {
  MACI__factory,
  Poll__factory,
  AccQueueQuinaryMaci__factory,
} from "../../typechain/";
import { mergeMaciState, mergeMessage } from "../../ts/merge";
import { checkDeployment } from "../../ts/utils";

const pollId = 0;

const deploymentFileName = `deployment-${hre.network.name}.json`;
const deploymentPath = path.join(
  __dirname,
  "../../deployment",
  deploymentFileName
);

async function main() {
  const [deployer] = await ethers.getSigners();

  const addresses = JSON.parse(
    fs.readFileSync(deploymentPath).toString()
  ) as Addresses;
  checkDeployment(addresses);

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

  const stateAqAddress = await maci.stateAq();
  const stateAq = new AccQueueQuinaryMaci__factory(
    { ...linkedLibraryAddresses },
    deployer
  ).attach(stateAqAddress);

  const messageAqAddress = (await poll.extContracts()).messageAq;
  const messageAq = new AccQueueQuinaryMaci__factory(
    { ...linkedLibraryAddresses },
    deployer
  ).attach(messageAqAddress);

  console.log("Merging...");

  await mergeMaciState(deployer.provider!, maci, poll, pollId, stateAq);
  await mergeMessage(deployer, poll, messageAq);

  console.log("Successfully merged.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
