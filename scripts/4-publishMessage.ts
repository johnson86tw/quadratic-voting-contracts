import hre, { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import { Addresses } from "../ts/addresses";

import { Command, Keypair, PrivKey, PubKey } from "maci-domainobjs";
import { Poll__factory } from "../typechain/factories/Poll__factory";
import { MACI__factory } from "../typechain/factories/MACI__factory";

const stateIndex = 1;
const pollId = 0;
const voteWeight = 3;
const voteOptionIndex = 1;

async function main() {
  const [deployer, user1] = await ethers.getSigners();

  const userPrivKey = process.env.userPrivKey;
  if (!userPrivKey) {
    throw new Error("Please provide correct maci private key");
  }
  const userKeypair = new Keypair(PrivKey.unserialize(userPrivKey));

  const _coordinatorPubKey = process.env.coordinatorPubKey;
  if (!_coordinatorPubKey) {
    throw new Error("Please provide coordinator maci public key");
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

  const pollAddress = await maci.getPoll(pollId);
  const poll = new Poll__factory(
    { ...linkedLibraryAddresses },
    deployer
  ).attach(pollAddress);

  const _stateIndex = BigInt(stateIndex);
  const _newPubKey = userKeypair.pubKey;
  const _voteOptionIndex = BigInt(voteOptionIndex);
  const _newVoteWeight = BigInt(voteWeight);
  const _nonce = BigInt(1);
  const _pollId = BigInt(0);
  const _salt = BigInt(1);
  const command = new Command(
    _stateIndex,
    _newPubKey,
    _voteOptionIndex,
    _newVoteWeight,
    _nonce,
    _pollId,
    _salt
  );

  const signature = command.sign(userKeypair.privKey);
  const sharedKey = Keypair.genEcdhSharedKey(
    userKeypair.privKey,
    coordinatorPubKey
  );
  const message = command.encrypt(signature, sharedKey);
  const _message = message.asContractParam();
  const _encPubKey = userKeypair.pubKey.asContractParam();

  const { logs } = await poll
    .connect(user1)
    // @ts-ignore
    .publishMessage(_message, _encPubKey)
    .then((tx) => tx.wait());

  const iface = poll.interface;
  const PublishMessageEvent = iface.parseLog(logs[logs.length - 1]);
  const messageEventArg = PublishMessageEvent.args._message.toString();
  const encPubKeyEventArg = PublishMessageEvent.args._encPubKey.toString();

  console.log("Successfully publish message");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
