import { ethers } from "hardhat";
import { Command, Keypair, PrivKey } from "maci-domainobjs";
import { Poll__factory } from "../typechain/factories/Poll__factory";
import { MACI__factory } from "../typechain/factories/MACI__factory";

const linkedLibraryAddresses = {
  ["maci-contracts/contracts/crypto/Hasher.sol:PoseidonT5"]:
    "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
  ["maci-contracts/contracts/crypto/Hasher.sol:PoseidonT3"]:
    "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  ["maci-contracts/contracts/crypto/Hasher.sol:PoseidonT6"]:
    "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
  ["maci-contracts/contracts/crypto/Hasher.sol:PoseidonT4"]:
    "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
};

const coordinatorPrivKey =
  "macisk.232d0cc27d0ebb93aa81cad1ca38198559c692d40e17b7620e17a36c0ec780c0";

const userPrivKey =
  "macisk.2c4b2cf6277e3dd8c94ac7acd73b7393646f1e922468aa9d03837e055b5741b1";
const stateIndex = 1;

async function main() {
  const [deployer, user1] = await ethers.getSigners();

  const maci = new MACI__factory(
    { ...linkedLibraryAddresses },
    deployer
  ).attach("0x610178dA211FEF7D417bC0e6FeD39F05609AD788");

  const coordinator = new Keypair(PrivKey.unserialize(coordinatorPrivKey));

  const pollContractAddress = await maci.getPoll(0);
  const poll = new Poll__factory(
    { ...linkedLibraryAddresses },
    deployer
  ).attach(pollContractAddress);

  const userKeypair = new Keypair(PrivKey.unserialize(userPrivKey));

  const _stateIndex = BigInt(stateIndex);
  const _newPubKey = userKeypair.pubKey;
  const _voteOptionIndex = BigInt(1);
  const _newVoteWeight = BigInt(3);
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
    coordinator.pubKey
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

  console.log(messageEventArg, encPubKeyEventArg);
  console.log("message published");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
