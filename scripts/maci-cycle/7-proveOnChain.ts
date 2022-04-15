import hre, { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import { Addresses } from "../../ts/interfaces";
import proveOnChain from "../../ts/proveOnChain";
import {
  MACI__factory,
  PollProcessorAndTallyer__factory,
  AccQueueQuinaryMaci__factory,
  Poll__factory,
  Verifier__factory,
  VkRegistry__factory,
} from "../../typechain";

const pollId = 0;
const proofDirPath = path.join(__dirname, "../../", "proofs");

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

  const ppt = new PollProcessorAndTallyer__factory(deployer).attach(
    addresses.ppt
  );

  const extContracts = await poll.extContracts();

  const messageAq = new AccQueueQuinaryMaci__factory(
    { ...linkedLibraryAddresses },
    deployer
  ).attach(extContracts.messageAq);

  const vkRegistry = new VkRegistry__factory(deployer).attach(
    extContracts.vkRegistry
  );

  const verifierAddress = await ppt.verifier();
  const verifier = new Verifier__factory(deployer).attach(verifierAddress);

  await proveOnChain(
    proofDirPath,
    maci,
    vkRegistry,
    poll,
    messageAq,
    ppt,
    verifier
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
