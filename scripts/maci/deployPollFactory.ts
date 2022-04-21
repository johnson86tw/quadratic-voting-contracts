import hre, { ethers } from "hardhat";
import path from "path";
import fs from "fs";
import { Addresses } from "../../ts/interfaces";
import { PollFactory__factory } from "../../build/typechain/factories/PollFactory__factory";

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

  console.log("Deploying pollFactory...");
  const pollFactory = await new PollFactory__factory(
    { ...linkedLibraryAddresses },
    deployer
  ).deploy();

  await pollFactory.deployed();
  console.log(`Successfully deployed pollFactory at ${pollFactory.address}`);

  addresses.pollFactory = pollFactory.address;
  fs.writeFileSync(deploymentPath, JSON.stringify(addresses));
  console.log(`Successfully updated ${deploymentFileName}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
