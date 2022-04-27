import { Command, Keypair, PrivKey, PubKey } from "maci-domainobjs";
import { Poll } from "../build/typechain/Poll";

interface Vote {
  stateIndex: number;
  voteOptionIndex: number;
  newVoteWeight: number;
  nonce: number;
  pollId: number;
  salt?: BigInt;
}

const vote = async (
  poll: Poll,
  vote: Vote,
  userPubKey: PubKey,
  userPrivKey: PrivKey
) => {
  const maxValues = await poll.maxValues();
  const maxVoteOptions = Number(maxValues.maxVoteOptions);

  const coordinatorPubKeyResult = await poll.coordinatorPubKey();
  const coordinatorPubKey = new PubKey([
    BigInt(coordinatorPubKeyResult.x.toString()),
    BigInt(coordinatorPubKeyResult.y.toString()),
  ]);

  if (maxVoteOptions < vote.voteOptionIndex) {
    throw new Error(`The vote option index is invalid`);
  }

  const stateIndex = BigInt(vote.stateIndex);
  const voteOptionIndex = BigInt(vote.voteOptionIndex);
  const newVoteWeight = BigInt(vote.newVoteWeight);
  const nonce = BigInt(vote.nonce);
  const pollId = BigInt(vote.pollId);

  const command = new Command(
    stateIndex,
    userPubKey,
    voteOptionIndex,
    newVoteWeight,
    nonce,
    pollId,
    vote.salt ? vote.salt : undefined
  );

  const signature = command.sign(userPrivKey);

  const encKeypair = new Keypair();
  const sharedKey = Keypair.genEcdhSharedKey(
    encKeypair.privKey,
    coordinatorPubKey
  );

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

  // const iface = poll.interface;
  // const PublishMessageEvent = iface.parseLog(logs[logs.length - 1]);
  // const messageEventArg = PublishMessageEvent.args._message.toString();
  // console.log("Message:", messageEventArg);
};

export default vote;
