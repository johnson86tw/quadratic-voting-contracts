import hre, { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import { Addresses } from "../../ts/interfaces";
import { Poll__factory } from "../../typechain/factories/Poll__factory";
import { MACI__factory } from "../../typechain/factories/MACI__factory";

const pollId = 1;

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

  const pollAddress = await maci.getPoll(pollId);
  const poll = new Poll__factory(
    { ...linkedLibraryAddresses },
    deployer
  ).attach(pollAddress);

  console.log("Merging...");

  try {
    const mergeMaciStateAqSubRootsTx = await poll.mergeMaciStateAqSubRoots(
      0,
      0
    );
    await mergeMaciStateAqSubRootsTx.wait();

    const mergeMaciStateAqTx = await poll.mergeMaciStateAq(0);
    await mergeMaciStateAqTx.wait();

    const mergeMessageAqSubRootsTx = await poll.mergeMessageAqSubRoots(0);
    await mergeMessageAqSubRootsTx.wait();

    const mergeMessageAqTx = await poll.mergeMessageAq();
    await mergeMessageAqTx.wait();
  } catch (e: any) {
    throw new Error(e.error);
  }

  console.log("Successfully merged.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
