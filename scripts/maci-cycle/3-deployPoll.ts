import hre, { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import { PubKey } from "maci-domainobjs";
import { Addresses } from "../../ts/interfaces";
import { MACI__factory } from "../../typechain/factories/MACI__factory";
import { checkEnvFile } from "../../ts/utils";

const duration = 300; // 5 min

// .env
const coordinatorPubKey = process.env.COORDINATOR_PUB_KEY as string;
const maxValues = {
  maxUsers: process.env.MAX_USERS as string,
  maxMessages: process.env.MAX_MESSAGES as string,
  maxVoteOptions: process.env.MAX_VOTE_OPTIONS as string,
};
const treeDepths = {
  intStateTreeDepth: process.env.INT_STATE_TREE_DEPTH as string,
  messageTreeDepth: process.env.MESSAGE_TREE_DEPTH as string,
  messageTreeSubDepth: process.env.MESSAGE_TREE_SUB_DEPTH as string,
  voteOptionTreeDepth: process.env.VOTE_OPTION_TREE_DEPTH as string,
};

const deploymentFileName = `deployment-${hre.network.name}.json`;
const deploymentPath = path.join(
  __dirname,
  "../../deployment",
  deploymentFileName
);

async function main() {
  checkEnvFile();
  const [deployer] = await ethers.getSigners();

  const _coordinatorPubKey = PubKey.unserialize(coordinatorPubKey);

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
      _coordinatorPubKey.asContractParam(),
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
