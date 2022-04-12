import hre, { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import { Addresses } from "../ts/addresses";
import { PubKey } from "maci-domainobjs";

import { MACI__factory } from "../typechain/factories/MACI__factory";

// deployPoll parameters
const duration = 10000;
// const maxValues = {
//   maxUsers: 25,
//   maxMessages: 25,
//   maxVoteOptions: 25,
// };
// const treeDepths = {
//   intStateTreeDepth: 2, //NOTE: actualy use tally batch size of 25
//   messageTreeDepth: 4,
//   messageTreeSubDepth: 2,
//   voteOptionTreeDepth: 2,
// };
const maxValues = {
  maxUsers: 25,
  maxMessages: 25,
  maxVoteOptions: 25,
};
const treeDepths = {
  intStateTreeDepth: 1, //NOTE: actualy use tally batch size of 25
  messageTreeDepth: 2,
  messageTreeSubDepth: 1,
  voteOptionTreeDepth: 2,
};

async function main() {
  const [deployer, user1] = await ethers.getSigners();

  const _coordinatorPubKey = process.env.coordinatorPubKey;
  if (!_coordinatorPubKey) {
    throw new Error("Please provide coordinator public key");
  }
  const coordinatorPubKey = PubKey.unserialize(_coordinatorPubKey);

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
