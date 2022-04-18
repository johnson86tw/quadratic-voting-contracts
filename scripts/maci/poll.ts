import hre, { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import { Keypair, PrivKey } from "maci-domainobjs";
import { Addresses } from "../../ts/interfaces";
import { checkEnvFile } from "../../ts/utils";
import {
  MACI__factory,
  Poll__factory,
  AccQueueQuinaryMaci__factory,
} from "../../typechain";

const pollId = 1;

// .env
const userPrivKey = process.env.USER_PRIV_KEY as string;

const deploymentFileName = `deployment-${hre.network.name}.json`;
const deploymentPath = path.join(
  __dirname,
  "../../deployment",
  deploymentFileName
);

async function main() {
  checkEnvFile("USER_PRIV_KEY", "COORDINATOR_PUB_KEY");
  const [deployer] = await ethers.getSigners();

  const userKeypair = new Keypair(PrivKey.unserialize(userPrivKey));

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

  console.log("Poll ID:", pollId);
  console.log("isAfterDeadline:", await poll.isAfterDeadline());
  console.log("messageAq.subTreesMerged:", await messageAq.subTreesMerged());
  console.log("messageAq.treeMerged:", await messageAq.treeMerged());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
