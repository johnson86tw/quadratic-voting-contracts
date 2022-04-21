import hre, { ethers } from "hardhat";
import path from "path";
import fs from "fs";
import { PollProcessorAndTallyer__factory } from "../../build/typechain/factories/PollProcessorAndTallyer__factory";
import { Verifier__factory } from "../../build/typechain/factories/Verifier__factory";
import { Addresses } from "../../ts/interfaces";

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

  addresses.ppt = ppt.address;
  fs.writeFileSync(deploymentPath, JSON.stringify(addresses));
  console.log(`Successfully updated ${deploymentFileName}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
