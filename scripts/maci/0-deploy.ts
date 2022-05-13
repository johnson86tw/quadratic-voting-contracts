import hre, { ethers } from "hardhat";
import path from "path";
import fs from "fs";
import { Addresses } from "../../ts/interfaces";
import {
  PoseidonT3__factory,
  PoseidonT4__factory,
  PoseidonT5__factory,
  PoseidonT6__factory,
  VkRegistry__factory,
  PollFactory__factory,
  MessageAqFactory__factory,
  QuadraticVoting__factory,
  MACI__factory,
  PollProcessorAndTallyer__factory,
  Verifier__factory,
} from "../../build/typechain";

const deploymentFileName = `deployment-${hre.network.name}.json`;
const deploymentPath = path.join(
  __dirname,
  "../../deployment",
  deploymentFileName
);

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying PoseidonT3...");
  const poseidonT3 = await new PoseidonT3__factory(deployer).deploy();

  console.log("Deploying PoseidonT4...");
  const poseidonT4 = await new PoseidonT4__factory(deployer).deploy();

  console.log("Deploying PoseidonT5...");
  const poseidonT5 = await new PoseidonT5__factory(deployer).deploy();

  console.log("Deploying PoseidonT6...");
  const poseidonT6 = await new PoseidonT6__factory(deployer).deploy();

  await poseidonT3.deployed();
  console.log(`PoseidonT3 deployed at ${poseidonT3.address}`);

  await poseidonT4.deployed();
  console.log(`PoseidonT4 deployed at ${poseidonT4.address}`);

  await poseidonT5.deployed();
  console.log(`PoseidonT5 deployed at ${poseidonT5.address}`);

  await poseidonT6.deployed();
  console.log(`PoseidonT6 deployed at ${poseidonT6.address}`);

  const linkedLibraryAddresses = {
    ["maci-contracts/contracts/crypto/Hasher.sol:PoseidonT5"]:
      poseidonT5.address,
    ["maci-contracts/contracts/crypto/Hasher.sol:PoseidonT3"]:
      poseidonT3.address,
    ["maci-contracts/contracts/crypto/Hasher.sol:PoseidonT6"]:
      poseidonT6.address,
    ["maci-contracts/contracts/crypto/Hasher.sol:PoseidonT4"]:
      poseidonT4.address,
  };

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
  const tx = await maci.init(vkRegistry.address, messageAqFactory.address);
  await tx.wait();

  if (await maci.isInitialised()) {
    console.log("Successfully deployed contracts and initialized maci");
  } else {
    throw new Error("Failed to initialize maci");
  }

  // deploy verifier and pollProcessorAndTallyer
  console.log("Deploying verifier...");
  const verifier = await new Verifier__factory(deployer).deploy();
  await verifier.deployed();
  console.log("Successfully deployed verifer at", verifier.address);

  console.log("Deploying pollProcessorAndTallyer...");
  const ppt = await new PollProcessorAndTallyer__factory(deployer).deploy(
    verifier.address
  );
  await ppt.deployed();
  console.log("Successfully deployed ppt at", ppt.address);

  const addresses: Addresses = {
    poseidonT5: poseidonT5.address,
    poseidonT3: poseidonT3.address,
    poseidonT6: poseidonT6.address,
    poseidonT4: poseidonT4.address,
    vkRegistry: vkRegistry.address,
    pollFactory: pollFactory.address,
    messageAqFactory: messageAqFactory.address,
    qv: qv.address,
    maci: maci.address,
    ppt: ppt.address,
  };

  fs.writeFileSync(deploymentPath, JSON.stringify(addresses));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
