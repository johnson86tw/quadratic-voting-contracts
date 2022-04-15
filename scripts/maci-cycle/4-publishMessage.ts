import hre, { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import { Command, Keypair, PrivKey, PubKey } from "maci-domainobjs";
import { Addresses } from "../../ts/interfaces";
import { Poll__factory } from "../../typechain/factories/Poll__factory";
import { MACI__factory } from "../../typechain/factories/MACI__factory";
import { checkEnvFile } from "../../ts/utils";

const stateIndex = 1;
const pollId = 1;
const voteWeight = 3;
const voteOptionIndex = 1;

// .env
const userPrivKey = process.env.USER_PRIV_KEY as string;

const deploymentFileName = `deployment-${hre.network.name}.json`;
const deploymentPath = path.join(
  __dirname,
  "../../deployment",
  deploymentFileName
);

async function main() {
  checkEnvFile("USER_PRIV_KEY", "COORDINATOR_PUB_KEY");
  const [deployer] = await ethers.getSigners();

  const userKeypair = new Keypair(PrivKey.unserialize(userPrivKey));

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

  const maxValues = await poll.maxValues();
  const maxVoteOptions = Number(maxValues.maxVoteOptions);

  if (maxVoteOptions < voteOptionIndex) {
    throw new Error("The vote option index is invalid");
  }

  const coordinatorPubKeyResult = await poll.coordinatorPubKey();
  const coordinatorPubKey = new PubKey([
    BigInt(coordinatorPubKeyResult.x.toString()),
    BigInt(coordinatorPubKeyResult.y.toString()),
  ]);

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

  const encKeypair = new Keypair();
  const sharedKey = Keypair.genEcdhSharedKey(
    encKeypair.privKey,
    coordinatorPubKey
  );

  const message = command.encrypt(signature, sharedKey);

  console.log("Start publishing message...");
  const tx = await poll.publishMessage(
    // @ts-ignore
    message.asContractParam(),
    encKeypair.pubKey.asContractParam(),
    {
      gasLimit: 1000000,
    }
  );

  const { logs } = await tx.wait();
  console.log("Transaction hash:", tx.hash);
  console.log("Ephemeral private key:", encKeypair.privKey.serialize());

  const iface = poll.interface;
  const PublishMessageEvent = iface.parseLog(logs[logs.length - 1]);
  // note: can use these to get user's voice credit balance?
  const messageEventArg = PublishMessageEvent.args._message.toString();
  const encPubKeyEventArg = PublishMessageEvent.args._encPubKey.toString();

  console.log("Successfully published message");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
