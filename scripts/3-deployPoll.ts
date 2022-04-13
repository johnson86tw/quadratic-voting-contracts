import hre, { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import { Addresses } from "../ts/interfaces";
import { PubKey } from "maci-domainobjs";

import { MACI__factory } from "../typechain/factories/MACI__factory";

// deployPoll parameters
const duration = 10000;

async function main() {
  // users
  const [deployer, user1] = await ethers.getSigners();

  const _coordinatorPubKey = process.env.coordinatorPubKey;
  if (!_coordinatorPubKey) {
    throw new Error("Please provide coordinator public key");
  }
  const coordinatorPubKey = PubKey.unserialize(_coordinatorPubKey);

  // addresses
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

  // settings
  const maxValues = {
    maxUsers: process.env.maxUsers as string,
    maxMessages: process.env.maxMessages as string,
    maxVoteOptions: process.env.maxVoteOptions as string,
  };
  const treeDepths = {
    intStateTreeDepth: process.env.intStateTreeDepth as string,
    messageTreeDepth: process.env.messageTreeDepth as string,
    messageTreeSubDepth: process.env.messageTreeSubDepth as string,
    voteOptionTreeDepth: process.env.voteOptionTreeDepth as string,
  };

  for (const [, value] of Object.entries(maxValues)) {
    if (!value) {
      throw new Error("Please provide correct maxValues");
    }
  }
  for (const [, value] of Object.entries(treeDepths)) {
    if (!value) {
      throw new Error("Please provide correct treeDepths");
    }
  }

  const maci = new MACI__factory(
    { ...linkedLibraryAddresses },
    deployer
  ).attach(addresses.maci);

  const { logs } = await maci
    .connect(deployer)
    .deployPoll(
      duration,
      maxValues,
      treeDepths,
      coordinatorPubKey.asContractParam(),
      {
        gasLimit: 30000000,
      }
    )
    .then((tx) => tx.wait());

  const iface = maci.interface;
  const deployPollEvent = iface.parseLog(logs[logs.length - 1]);
  const pollId = deployPollEvent.args._pollId.toString();
  const pollAddr = deployPollEvent.args._pollAddr.toString();
  const coordinatorPubKeyEventArg = deployPollEvent.args._pubKey.toString();

  console.log(`Successfully deploy poll contract with poll_id: ${pollId}`);
  console.log(`poll address: ${pollAddr}`);
  console.log(
    `coordinator public key: ${coordinatorPubKeyEventArg}` // TODO: how to serialize this?
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
