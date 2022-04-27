import hre, { ethers } from "hardhat";
import fs from "fs";
import path from "path";
import { Command, Keypair, PrivKey, PubKey } from "maci-domainobjs";
import { Addresses } from "../../ts/interfaces";
import { Poll__factory } from "../../build/typechain/factories/Poll__factory";
import { MACI__factory } from "../../build/typechain/factories/MACI__factory";
import { checkDeployment, checkEnvFile } from "../../ts/utils";

const pollId = 0;

// .env
const userPrivKey = process.env.USER_PRIV_KEY as string;
const userKeypair = new Keypair(PrivKey.unserialize(userPrivKey));

const votes = [
  {
    stateIndex: 1,
    voteOptionIndex: 5,
    newVoteWeight: 5,
    nonce: 1,
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

  const coordinatorPubKeyResult = await poll.coordinatorPubKey();
  const coordinatorPubKey = new PubKey([
    BigInt(coordinatorPubKeyResult.x.toString()),
    BigInt(coordinatorPubKeyResult.y.toString()),
  ]);

  const encKeypair = new Keypair();
  const sharedKey = Keypair.genEcdhSharedKey(
    encKeypair.privKey,
    coordinatorPubKey
  );

  const _stateIndex = BigInt(votes[0].stateIndex);
  const _voteOptionIndex = BigInt(votes[0].voteOptionIndex);
  const _newVoteWeight = BigInt(votes[0].newVoteWeight);
  const _nonce = BigInt(votes[0].nonce);
  const _pollId = BigInt(votes[0].pollId);

  const command = new Command(
    _stateIndex,
    userKeypair.pubKey,
    _voteOptionIndex,
    _newVoteWeight,
    _nonce,
    _pollId
  );

  const signature = command.sign(userKeypair.privKey);
  const message = command.encrypt(signature, sharedKey);
  const encPubKey = encKeypair.pubKey;

  console.log("Publishing message...");
  const tx = await poll.publishMessage(
    // @ts-ignore
    message.asContractParam(),
    encPubKey.asContractParam()
  );
  const { logs } = await tx.wait();
  console.log("Transaction hash:", tx.hash);

  const iface = poll.interface;
  const PublishMessageEvent = iface.parseLog(logs[logs.length - 1]);
  const messageEventArg = PublishMessageEvent.args._message.toString();
  console.log("Message:", messageEventArg);

  console.log("Message Proof", message.data);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
