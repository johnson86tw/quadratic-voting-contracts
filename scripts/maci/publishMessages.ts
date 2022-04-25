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

interface Vote {
  stateIndex: BigInt;
  newPubKey: PubKey;
  voteOptionIndex: BigInt;
  newVoteWeight: BigInt;
  nonce: BigInt;
  pollId: BigInt;
  salt?: BigInt | undefined;
}

const votes: Vote[] = [
  {
    stateIndex: BigInt(1),
    newPubKey: userKeypair.pubKey,
    voteOptionIndex: BigInt(0),
    newVoteWeight: BigInt(4),
    nonce: BigInt(1),
    pollId: BigInt(0),
  },
  {
    stateIndex: BigInt(1),
    newPubKey: userKeypair.pubKey,
    voteOptionIndex: BigInt(1),
    newVoteWeight: BigInt(1),
    nonce: BigInt(2),
    pollId: BigInt(0),
  },
  {
    stateIndex: BigInt(1),
    newPubKey: userKeypair.pubKey,
    voteOptionIndex: BigInt(3),
    newVoteWeight: BigInt(3),
    nonce: BigInt(3),
    pollId: BigInt(0),
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

  const maxValues = await poll.maxValues();
  const maxVoteOptions = Number(maxValues.maxVoteOptions);

  const coordinatorPubKeyResult = await poll.coordinatorPubKey();
  const coordinatorPubKey = new PubKey([
    BigInt(coordinatorPubKeyResult.x.toString()),
    BigInt(coordinatorPubKeyResult.y.toString()),
  ]);

  let messages = [];
  let encPubKeys = [];
  for (let vote of votes) {
    // @ts-ignore
    const command = new Command(...Object.values(vote));
    const signature = command.sign(userKeypair.privKey);

    const encKeypair = new Keypair();
    const sharedKey = Keypair.genEcdhSharedKey(
      encKeypair.privKey,
      coordinatorPubKey
    );

    const message = command.encrypt(signature, sharedKey);
    const encPubKey = encKeypair.pubKey;

    messages.push(message);
    encPubKeys.push(encPubKey);
  }

  const batchSize = messages.length;

  // note: must publish in reverse according to the nonce
  for (let i = batchSize - 1; i >= 0; i--) {
    console.log("Publishing message...");
    const tx = await poll.publishMessage(
      // @ts-ignore
      messages[i].asContractParam(),
      encPubKeys[i].asContractParam()
    );
    await tx.wait();
  }

  console.log("Successfully published messages");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
