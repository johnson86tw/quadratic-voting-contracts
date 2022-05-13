import hre, { ethers } from "hardhat";
import path from "path";
import fs from "fs";
import { Addresses } from "../../ts/interfaces";
import { MACI__factory } from "../../build/typechain/factories/MACI__factory";
import {
  MessageAqFactory__factory,
  PollFactory__factory,
} from "../../build/typechain";

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

  const pollFactory = new PollFactory__factory(
    { ...linkedLibraryAddresses },
    deployer
  ).attach(addresses.pollFactory);

  const messageAqFactory = new MessageAqFactory__factory(
    { ...linkedLibraryAddresses },
    deployer
  ).attach(addresses.messageAqFactory);

  // transfer ownership
  console.log("Transferring ownership...");

  const pollFactoryOwner = await pollFactory.owner();
  const messageAqFactoryOwner = await messageAqFactory.owner();

  if (pollFactoryOwner !== maci.address) {
    const tx = await pollFactory.transferOwnership(maci.address);
    await tx.wait();
  } else {
    console.log("Skip pollFactory ownership transferring");
  }

  if (messageAqFactoryOwner !== pollFactory.address) {
    const tx = await messageAqFactory.transferOwnership(pollFactory.address);
    await tx.wait();
  } else {
    console.log("Skip messageAqFactory ownership transferring");
  }

  // init maci
  console.log("Initializing MACI...");
  const tx = await maci.init(addresses.vkRegistry, addresses.messageAqFactory);
  await tx.wait();

  if (await maci.isInitialised()) {
    console.log("Successfully initialized maci");
  } else {
    throw new Error("Failed to initialize maci");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
