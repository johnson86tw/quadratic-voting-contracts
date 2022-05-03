import hre, { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import { Keypair, PrivKey } from "maci-domainobjs";
import { Addresses } from "../../ts/interfaces";
import { Poll__factory } from "../../build/typechain/factories/Poll__factory";
import { MACI__factory } from "../../build/typechain/factories/MACI__factory";
import { checkDeployment, checkEnvFile } from "../../ts/utils";
import vote from "../../ts/vote";

/**
 * This script is according to clr.fund pattern which is change key and vote again.
 */

const stateIndex = 1;
const pollId = 0;

// .env
const userPrivKey = process.env.USER_PRIV_KEY as string;
const userKeypair = new Keypair(PrivKey.unserialize(userPrivKey));

// User's new key
const newKey = new Keypair();

const votes = [
  {
    stateIndex,
    voteOptionIndex: 1,
    newVoteWeight: 3,
    nonce: 1,
    pollId,
  },
  {
    stateIndex,
    voteOptionIndex: 2,
    newVoteWeight: 2,
    nonce: 2,
    pollId,
  },
  {
    stateIndex,
    voteOptionIndex: 3,
    newVoteWeight: 3,
    nonce: 3,
    pollId,
  },
];

const deploymentFileName = `deployment-${hre.network.name}.json`;
const deploymentPath = path.join(
  __dirname,
  "../../deployment",
  deploymentFileName
);

async function main() {
  checkEnvFile("USER_PRIV_KEY", "COORDINATOR_PUB_KEY");
  const [deployer] = await ethers.getSigners();

  const addresses = JSON.parse(
    fs.readFileSync(deploymentPath).toString()
  ) as Addresses;
  checkDeployment(addresses);

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

  for (let i = votes.length - 1; i >= 0; i--) {
    // change key
    if (i === 0) {
      await vote(poll, votes[i], newKey.pubKey, userKeypair.privKey);
    }
    // vote with new key
    await vote(poll, votes[i], newKey.pubKey, newKey.privKey);
  }

  console.log("new PubKey", newKey.pubKey.serialize());
  console.log("new PrivKey", newKey.privKey.serialize());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
