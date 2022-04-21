import hre, { ethers } from "hardhat";
import path from "path";
import fs from "fs";
import { Addresses } from "../../ts/interfaces";
import {
  MACI__factory,
  MessageAqFactory__factory,
  PollFactory__factory,
  QuadraticVoting__factory,
  VkRegistry__factory,
} from "../../build/typechain";

const deploymentFileName = `deployment-${hre.network.name}.json`;
const deploymentPath = path.join(
  __dirname,
  "../../deployment",
  deploymentFileName
);

async function main() {
  const [deployer] = await ethers.getSigners();

  let addresses = JSON.parse(
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

  console.log("linkedLibraryAddresses: ", linkedLibraryAddresses);

  // vkRegistry
  console.log("Deploying vkRegistry...");
  const vkRegistry = await new VkRegistry__factory(deployer).deploy();
  await vkRegistry.deployed();
  console.log(`Successfully deployed vkRegistry at ${vkRegistry.address}`);

  // pollFactory
  console.log("Deploying pollFactory...");
  const pollFactory = await new PollFactory__factory(
    { ...linkedLibraryAddresses },
    deployer
  ).deploy();

  await pollFactory.deployed();
  console.log(`Successfully deployed pollFactory at ${pollFactory.address}`);

  // messageAqFactory
  console.log("Deploying messageAqFactory...");
  const messageAqFactory = await new MessageAqFactory__factory(
    { ...linkedLibraryAddresses },
    deployer
  ).deploy();
  await messageAqFactory.deployed();
  console.log(
    `Successfully deployed messageAqFactory at ${messageAqFactory.address}`
  );

  // QuadraticVoting
  console.log("Deploying QuadraticVoting...");
  const qv = await new QuadraticVoting__factory(deployer).deploy();
  await qv.deployed();
  console.log(`Successfully deployed QuadraticVoting at ${qv.address}`);

  // MACI
  console.log("Deploying MACI...");
  const maci = await new MACI__factory(
    { ...linkedLibraryAddresses },
    deployer
  ).deploy(pollFactory.address, qv.address, qv.address);
  await maci.deployed();
  console.log(`Successfully deployed MACI at ${maci.address}`);

  addresses.vkRegistry = vkRegistry.address;
  addresses.pollFactory = pollFactory.address;
  addresses.messageAqFactory = messageAqFactory.address;
  addresses.qv = qv.address;
  addresses.maci = maci.address;

  fs.writeFileSync(deploymentPath, JSON.stringify(addresses));
  console.log(`Successfully updated ${deploymentFileName}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
