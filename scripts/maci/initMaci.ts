import hre, { ethers } from "hardhat";
import path from "path";
import fs from "fs";
import { Addresses } from "../../ts/interfaces";
import { MACI__factory } from "../../typechain/factories/MACI__factory";
import {
  MessageAqFactory__factory,
  PollFactory__factory,
} from "../../typechain";

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
  try {
    if ((await pollFactory.owner()) !== maci.address) {
      await pollFactory.transferOwnership(maci.address);
    } else if ((await messageAqFactory.owner()) !== pollFactory.address) {
      await messageAqFactory.transferOwnership(pollFactory.address);
    } else {
      console.log("Skip ownership transferring");
    }
  } catch (e) {
    throw new Error(
      "Failed to transferOwnership of pollFactory and messageAqFactory"
    );
  }

  // init maci
  console.log("Initializing MACI...");
  try {
    const tx = await maci.init(
      addresses.vkRegistry,
      addresses.messageAqFactory
    );
    await tx.wait();
  } catch (e) {
    throw new Error(`Failed to initiailze maci, ${e}`);
  }

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
