import hre, { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import { PubKey } from "maci-domainobjs";
import { Addresses } from "../../ts/interfaces";
import { MACI__factory } from "../../build/typechain/factories/MACI__factory";
import { checkDeployment, checkEnvFile } from "../../ts/utils";

const duration = 18000;

// .env
const coordinatorPubKey = process.env.COORDINATOR_PUB_KEY as string;
const maxValues = {
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

  console.log("Deploying Poll contract...");

  const tx = await maci.deployPoll(
    duration,
    maxValues,
    treeDepths,
    _coordinatorPubKey.asContractParam()
  );
  const { logs } = await tx.wait();
  const iface = maci.interface;
  const deployPollEvent = iface.parseLog(logs[logs.length - 1]);
  const pollId = deployPollEvent.args._pollId.toString();
  const pollAddr = deployPollEvent.args._pollAddr.toString();
  const coordinatorPubKeyEventArg = deployPollEvent.args._pubKey.toString();

  console.log(`Successfully deployed poll contract with poll_id: ${pollId}`);
  console.log("Poll ID:", pollId.toString());
  console.log("Poll contract:", pollAddr);
  console.log(
    `coordinator public key: ${coordinatorPubKeyEventArg}` // TODO: how to serialize this?
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
