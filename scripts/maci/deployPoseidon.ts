import hre, { ethers } from "hardhat";
import path from "path";
import fs from "fs";
import { Addresses } from "../../ts/interfaces";

import { PoseidonT3__factory } from "../../build/typechain/factories/PoseidonT3__factory";
import { PoseidonT4__factory } from "../../build/typechain/factories/PoseidonT4__factory";
import { PoseidonT5__factory } from "../../build/typechain/factories/PoseidonT5__factory";
import { PoseidonT6__factory } from "../../build/typechain/factories/PoseidonT6__factory";

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

  const addresses: Addresses = {
    poseidonT5: poseidonT5.address,
    poseidonT3: poseidonT3.address,
    poseidonT6: poseidonT6.address,
    poseidonT4: poseidonT4.address,
    vkRegistry: "",
    pollFactory: "",
    messageAqFactory: "",
    maci: "",
    ppt: "",
  };

  fs.writeFileSync(deploymentPath, JSON.stringify(addresses));
  console.log(`Successfully updated ${deploymentFileName}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
