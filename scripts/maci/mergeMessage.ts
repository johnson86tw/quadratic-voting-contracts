import hre, { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import { Addresses } from "../../ts/interfaces";
import { Poll__factory } from "../../build/typechain/factories/Poll__factory";
import { MACI__factory } from "../../build/typechain/factories/MACI__factory";
import { AccQueueQuinaryMaci__factory } from "../../build/typechain";
import { mergeMessage } from "../../ts/merge";

const pollId = 1;

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

  const messageAqAddress = (await poll.extContracts()).messageAq;
  const messageAq = new AccQueueQuinaryMaci__factory(
    { ...linkedLibraryAddresses },
    deployer
  ).attach(messageAqAddress);

  console.log("Merging...");

  await mergeMessage(deployer, poll, messageAq);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
