import hre, { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import { Addresses, TallyResult } from "../ts/interfaces";
import { verifyTallyResult } from "../ts/maci";
import { MACI__factory } from "../typechain/factories/MACI__factory";
import { PollProcessorAndTallyer__factory } from "../typechain/factories/PollProcessorAndTallyer__factory";
import { Poll__factory } from "../typechain";

const pollId = 0;
const tallyFilePath = path.join(__dirname, "..", "proofs/tally.json");

async function main() {
  const [deployer] = await ethers.getSigners();

  const userPrivKey = process.env.userPrivKey;
  if (!userPrivKey) {
    throw new Error("Please provide correct maci private key");
  }

  const _coordinatorPubKey = process.env.coordinatorPubKey;
  if (!_coordinatorPubKey) {
    throw new Error("Please provide coordinator maci public key");
  }

  const deploymentFileName = `deployment-${hre.network.name}.json`;
  const deploymentPath = path.join(__dirname, "..", deploymentFileName);
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

  const ppt = new PollProcessorAndTallyer__factory(deployer).attach(
    addresses.ppt
  );

  const tallyResult: TallyResult = JSON.parse(
    fs.readFileSync(tallyFilePath).toString()
  );

  const isVerified = await verifyTallyResult(tallyResult, poll, ppt);
  if (isVerified) {
    console.log("Verified!");
  } else {
    throw new Error("Failed to verify tally result");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
