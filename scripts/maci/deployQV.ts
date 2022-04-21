import hre, { ethers } from "hardhat";
import path from "path";
import fs from "fs";
import { Addresses } from "../../ts/interfaces";
import { QuadraticVoting__factory } from "../../build/typechain";

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

  console.log("Deploying QuadraticVoting...");

  const qv = await new QuadraticVoting__factory(deployer).deploy();
  await qv.deployed();
  console.log(`Successfully deployed QuadraticVoting at ${qv.address}`);

  addresses.qv = qv.address;
  fs.writeFileSync(deploymentPath, JSON.stringify(addresses));
  console.log(`Successfully updated ${deploymentFileName}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
