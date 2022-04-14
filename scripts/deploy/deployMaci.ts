import hre, { ethers } from "hardhat";
import path from "path";
import fs from "fs";
import { Addresses } from "../../ts/interfaces";
import { MACI__factory, QuadraticVoting__factory } from "../../typechain";

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

  // TODO: should check addresses being valid
  if (!addresses.qv) {
    throw new Error("Incorrect deployment addresses");
  }

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

  console.log("Deploying MACI...");
  const maci = await new MACI__factory(
    { ...linkedLibraryAddresses },
    deployer
  ).deploy(addresses.pollFactory, addresses.qv, addresses.qv);

  console.log(`Successfully deployed MACI at ${maci.address}`);

  addresses.maci = maci.address;
  fs.writeFileSync(deploymentPath, JSON.stringify(addresses));
  console.log(`Successfully updated ${deploymentFileName}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
