import { ethers } from "hardhat";
import { expect } from "chai";
import { BigNumber, BigNumberish, Signer } from "ethers";
import { Command, Keypair, VerifyingKey } from "maci-domainobjs";
import {
  G1Point,
  G2Point,
  hash5,
  hashLeftRight,
  IncrementalQuinTree,
} from "maci-crypto";
// @ts-ignore
import { MaciState } from "maci-core";

// TODO: check conflix with https://github.com/quadratic-funding/qfi/blob/main/packages/contracts/tests/QV/06-verify.ts

import { PoseidonT3__factory } from "../build/typechain/factories/PoseidonT3__factory";
import { PoseidonT3 } from "../build/typechain/PoseidonT3";
import { PoseidonT4__factory } from "../build/typechain/factories/PoseidonT4__factory";
import { PoseidonT4 } from "../build/typechain/PoseidonT4";
import { PoseidonT5__factory } from "../build/typechain/factories/PoseidonT5__factory";
import { PoseidonT5 } from "../build/typechain/PoseidonT5";
import { PoseidonT6__factory } from "../build/typechain/factories/PoseidonT6__factory";
import { PoseidonT6 } from "../build/typechain/PoseidonT6";

import { VkRegistry__factory } from "../build/typechain/factories/VkRegistry__factory";
import { VkRegistry } from "../build/typechain/VkRegistry";

import {
  PollFactory__factory,
  PollFactoryLibraryAddresses,
} from "../build/typechain/factories/PollFactory__factory";
import { PollFactory } from "../build/typechain/PollFactory";

import { Poll__factory } from "../build/typechain/factories/Poll__factory";
import { Poll } from "../build/typechain/Poll";

import {
  MessageAqFactory__factory,
  MessageAqFactoryLibraryAddresses,
} from "../build/typechain/factories/MessageAqFactory__factory";
import { MessageAqFactory } from "../build/typechain/MessageAqFactory";
import { AccQueueQuinaryMaci__factory } from "../build/typechain";
import { AccQueueQuinaryMaci } from "../build/typechain/AccQueueQuinaryMaci";

import { PollProcessorAndTallyer__factory } from "../build/typechain/factories/PollProcessorAndTallyer__factory";
import { PollProcessorAndTallyer } from "../build/typechain/PollProcessorAndTallyer";
import { MockVerifier } from "../build/typechain/MockVerifier";
import { MockVerifier__factory } from "../build/typechain/factories/MockVerifier__factory";

import {
  MACI__factory,
  MACILibraryAddresses,
} from "../build/typechain/factories/MACI__factory";
import { MACI } from "../build/typechain/MACI";

import { QuadraticVoting__factory } from "../build/typechain/factories/QuadraticVoting__factory";
import { QuadraticVoting } from "../build/typechain/QuadraticVoting";

let deployer: Signer;
let deployerAddress: string;

let PoseidonT3Factory: PoseidonT3__factory;
let PoseidonT4Factory: PoseidonT4__factory;
let PoseidonT5Factory: PoseidonT5__factory;
let PoseidonT6Factory: PoseidonT6__factory;

let poseidonT3: PoseidonT3;
let poseidonT4: PoseidonT4;
let poseidonT5: PoseidonT5;
let poseidonT6: PoseidonT6;

let PollFactoryFactory: PollFactory__factory;
let MessageAqFactoryFactory: MessageAqFactory__factory;
let MessageAq_Factory: AccQueueQuinaryMaci__factory;
let messageAq: AccQueueQuinaryMaci;

let VKRegistryFactory: VkRegistry__factory;
let QuadraticVotingFactory: QuadraticVoting__factory;
let MACIFactory: MACI__factory;

let PollProcessorAndTallyerFactory: PollProcessorAndTallyer__factory;
let pollProcessorAndTallyer: PollProcessorAndTallyer;
let MockVerifierFactory: MockVerifier__factory;
let mockVerifier: MockVerifier;

let pollFactory: PollFactory;
let poll: Poll;
let messageAqFactory: MessageAqFactory;
let vkRegistry: VkRegistry;
let qv: QuadraticVoting;
let maci: MACI;

let linkedLibraryAddresses:
  | MACILibraryAddresses
  | PollFactoryLibraryAddresses
  | MessageAqFactoryLibraryAddresses;

// roles
let coordinator: Keypair;
let users: {
  maciKey: Keypair;
  signer: Signer;
  stateIndex: number;
}[] = [];
let user1: Signer;
let user2: Signer;
let user3: Signer;
let user4: Signer;
let user5: Signer;
let user6: Signer;
let user7: Signer;
let user8: Signer;
let user9: Signer;
let user10: Signer;

// state
const testProcessVk = new VerifyingKey(
  new G1Point(BigInt(0), BigInt(1)),
  new G2Point([BigInt(2), BigInt(3)], [BigInt(4), BigInt(5)]),
  new G2Point([BigInt(6), BigInt(7)], [BigInt(8), BigInt(9)]),
  new G2Point([BigInt(10), BigInt(11)], [BigInt(12), BigInt(13)]),
  [new G1Point(BigInt(14), BigInt(15)), new G1Point(BigInt(16), BigInt(17))]
);

const testTallyVk = new VerifyingKey(
  new G1Point(BigInt(0), BigInt(1)),
  new G2Point([BigInt(2), BigInt(3)], [BigInt(4), BigInt(5)]),
  new G2Point([BigInt(6), BigInt(7)], [BigInt(8), BigInt(9)]),
  new G2Point([BigInt(10), BigInt(11)], [BigInt(12), BigInt(13)]),
  [new G1Point(BigInt(14), BigInt(15)), new G1Point(BigInt(16), BigInt(17))]
);

const maxValues = {
  maxUsers: 25,
  maxMessages: 25,
  maxVoteOptions: 25,
};
const treeDepths = {
  intStateTreeDepth: 2, //NOTE: actualy use tally batch size of 25
  messageTreeDepth: 4,
  messageTreeSubDepth: 2,
  voteOptionTreeDepth: 2,
};
const STATE_TREE_DEPTH = 10;
const STATE_TREE_ARITY = 5;
const MESSAGE_TREE_ARITY = 5;
const messageBatchSize = MESSAGE_TREE_ARITY ** treeDepths.messageTreeSubDepth;
const tallyBatchSize = STATE_TREE_ARITY ** treeDepths.intStateTreeDepth;

let maciState: MaciState;
let tallyFileData: {
  maci: string;
  pollId: number;
  newTallyCommitment: any;
  results: {
    tally: any;
    salt: any;
  };
  totalSpentVoiceCredits: {
    spent: any;
    salt: any;
  };
  perVOSpentVoiceCredits: {
    tally: any;
    salt: any;
  };
};
let maciNewSbCommitment: any;

describe("Test Quadratic Voting", function () {
  before(async function () {
    this?.timeout(400000);
    [
      deployer,
      user1,
      user2,
      user3,
      user4,
      user5,
      user6,
      user7,
      user8,
      user9,
      user10,
    ] = await ethers.getSigners();
    deployerAddress = await deployer.getAddress();
    deployerAddress = await deployer.getAddress();
    PoseidonT3Factory = new PoseidonT3__factory(deployer);
    PoseidonT4Factory = new PoseidonT4__factory(deployer);
    PoseidonT5Factory = new PoseidonT5__factory(deployer);
    PoseidonT6Factory = new PoseidonT6__factory(deployer);
    poseidonT3 = await PoseidonT3Factory.deploy();
    poseidonT4 = await PoseidonT4Factory.deploy();
    poseidonT5 = await PoseidonT5Factory.deploy();
    poseidonT6 = await PoseidonT6Factory.deploy();

    linkedLibraryAddresses = {
      ["maci-contracts/contracts/crypto/Hasher.sol:PoseidonT5"]:
        poseidonT5.address,
      ["maci-contracts/contracts/crypto/Hasher.sol:PoseidonT3"]:
        poseidonT3.address,
      ["maci-contracts/contracts/crypto/Hasher.sol:PoseidonT6"]:
        poseidonT6.address,
      ["maci-contracts/contracts/crypto/Hasher.sol:PoseidonT4"]:
        poseidonT4.address,
    };

    VKRegistryFactory = new VkRegistry__factory(deployer);
    PollFactoryFactory = new PollFactory__factory(
      { ...linkedLibraryAddresses },
      deployer
    );
    MessageAqFactoryFactory = new MessageAqFactory__factory(
      { ...linkedLibraryAddresses },
      deployer
    );
    MessageAq_Factory = new AccQueueQuinaryMaci__factory(
      { ...linkedLibraryAddresses },
      deployer
    );
    MockVerifierFactory = new MockVerifier__factory(deployer);
    PollProcessorAndTallyerFactory = new PollProcessorAndTallyer__factory(
      deployer
    );

    QuadraticVotingFactory = new QuadraticVoting__factory(deployer);
    MACIFactory = new MACI__factory({ ...linkedLibraryAddresses }, deployer);
    PollProcessorAndTallyerFactory = new PollProcessorAndTallyer__factory(
      deployer
    );

    // ============== Deploy contracts ==============

    vkRegistry = await VKRegistryFactory.deploy();

    pollFactory = await PollFactoryFactory.deploy();
    messageAqFactory = await MessageAqFactoryFactory.deploy();

    mockVerifier = await MockVerifierFactory.deploy();
    pollProcessorAndTallyer = await PollProcessorAndTallyerFactory.deploy(
      mockVerifier.address
    );

    qv = await QuadraticVotingFactory.deploy();
    maci = await MACIFactory.deploy(
      pollFactory.address,
      qv.address,
      qv.address
    );

    await pollFactory.transferOwnership(maci.address);
    await messageAqFactory.transferOwnership(pollFactory.address);

    // ============== Set verifying keys ==============
    console.log("Set verifying keys");

    const stateTreeDepth = STATE_TREE_DEPTH;
    const _stateTreeDepth = stateTreeDepth.toString();
    const _intStateTreeDepth = treeDepths.intStateTreeDepth;
    const _messageTreeDepth = treeDepths.messageTreeDepth;
    const _voteOptionTreeDepth = treeDepths.voteOptionTreeDepth;
    const _messageBatchSize = messageBatchSize.toString();
    const _processVk = testProcessVk.asContractParam();
    const _tallyVk = testTallyVk.asContractParam();

    const { status } = await vkRegistry
      .setVerifyingKeys(
        _stateTreeDepth,
        _intStateTreeDepth,
        _messageTreeDepth,
        _voteOptionTreeDepth,
        _messageBatchSize,
        // @ts-ignore
        _processVk,
        _tallyVk
      )
      .then((tx) => tx.wait());

    expect(status).to.equal(1);

    const pSig = await vkRegistry.genProcessVkSig(
      _stateTreeDepth,
      _messageTreeDepth,
      _voteOptionTreeDepth,
      _messageBatchSize
    );

    const isPSigSet = await vkRegistry.isProcessVkSet(pSig);
    expect(isPSigSet).to.be.true;

    const tSig = await vkRegistry.genTallyVkSig(
      _stateTreeDepth,
      _intStateTreeDepth,
      _voteOptionTreeDepth
    );
    const isTSigSet = await vkRegistry.isTallyVkSet(tSig);
    expect(isTSigSet).to.be.true;

    // Check that the VKs are set
    const processVkOnChain = await vkRegistry.getProcessVk(
      _stateTreeDepth,
      _messageTreeDepth,
      _voteOptionTreeDepth,
      _messageBatchSize
    );
    expect(processVkOnChain).to.have.own.property("alpha1");

    const tallyVkOnChain = await vkRegistry.getTallyVk(
      _stateTreeDepth,
      _intStateTreeDepth,
      _voteOptionTreeDepth
    );
    expect(tallyVkOnChain).to.have.own.property("alpha1");
    expect(tallyVkOnChain.alpha1.x).to.not.be.empty;

    // ============== Init maci ==============
    console.log("Init maci");

    coordinator = new Keypair();
    const coordinatorPubkey = coordinator.pubKey.asContractParam();

    maciState = new MaciState();
    const provider = deployer.provider ?? ethers.getDefaultProvider();

    const userSigners = [
      user1,
      user2,
      user3,
      user4,
      user5,
      user6,
      user7,
      user8,
      user9,
      user10,
    ];

    const initMaci = await maci.init(
      vkRegistry.address,
      messageAqFactory.address
    );
    await expect(initMaci)
      .to.emit(maci, "Init")
      .withArgs(vkRegistry.address, messageAqFactory.address);
    expect(await maci.owner()).to.equal(deployerAddress);

    // ============== User SignUp ==============
    console.log("User SignUp");

    users = [];
    for (const user of userSigners) {
      const maciKey = new Keypair();
      const _pubKey = maciKey.pubKey.asContractParam();
      const _signUpGatekeeperData = ethers.utils.defaultAbiCoder.encode(
        ["uint256"],
        [1]
      );
      const _initialVoiceCreditProxyData = ethers.utils.defaultAbiCoder.encode(
        ["uint256"],
        [0]
      );

      const { logs } = await maci
        .connect(user)
        .signUp(_pubKey, _signUpGatekeeperData, _initialVoiceCreditProxyData)
        .then((tx) => tx.wait());

      const iface = maci.interface;
      const signUpEvent = iface.parseLog(logs[logs.length - 1]);
      const stateIndex = signUpEvent.args._stateIndex.toString();
      users.push({ maciKey: maciKey, signer: user, stateIndex: stateIndex });

      maciState.signUp(
        maciKey.pubKey,
        BigInt(signUpEvent.args._voiceCreditBalance.toString()),
        BigInt(signUpEvent.args._timestamp.toString())
      );
    }

    // ============== Deploy Poll ==============
    console.log("Deploy Poll");

    const duration = 35;

    const { blockHash } = await maci
      .connect(deployer)
      .deployPoll(duration, maxValues, treeDepths, coordinatorPubkey, {
        gasLimit: 30000000,
      })
      .then((tx) => tx.wait());

    // NOTE: Deploy the poll on local maci data structure
    const deployTime = (await provider.getBlock(blockHash)).timestamp;
    //NOTE: this is where the coordinator key is set on the local maci data structure
    const p = maciState.deployPoll(
      duration,
      BigInt(deployTime + duration),
      maxValues,
      treeDepths,
      messageBatchSize,
      coordinator
    );
    const pollId = p.toString();
    const pollContractAddress = await maci.getPoll(0);
    poll = new Poll__factory({ ...linkedLibraryAddresses }, deployer).attach(
      pollContractAddress
    );

    // ============== Publish Message ==============
    console.log("Publish Message");

    let index = 1;
    for (const user of users) {
      const { maciKey, signer, stateIndex } = user;
      const _stateIndex = BigInt(stateIndex);
      const _newPubKey = maciKey.pubKey;
      const _voteOptionIndex = BigInt(index);
      const _newVoteWeight = BigInt(index);
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
      index++;

      const signature = command.sign(maciKey.privKey);
      const sharedKey = Keypair.genEcdhSharedKey(
        maciKey.privKey,
        coordinator.pubKey
      );
      const message = command.encrypt(signature, sharedKey);
      const _message = message.asContractParam();
      const _encPubKey = maciKey.pubKey.asContractParam();

      maciState.polls[0].publishMessage(message, maciKey.pubKey);
      const { logs } = await poll
        .connect(signer)
        // @ts-ignore
        .publishMessage(_message, _encPubKey)
        .then((tx) => tx.wait());
    }
    const [_deployTime, _duration] = await poll.getDeployTimeAndDuration();
    const hardHatProvider = ethers.provider;
    await hardHatProvider.send("evm_increaseTime", [Number(_duration) + 1]);
    await hardHatProvider.send("evm_mine", []);

    // ============== Merge ==============
    console.log("Merge");

    const extContracts = await poll.extContracts();

    const messageAqAddress = extContracts.messageAq;
    messageAq = MessageAq_Factory.attach(messageAqAddress);

    const maciStateAq = maciState.stateAq;
    maciStateAq.mergeSubRoots(0); // 0 as input attempts to merge all subroots
    maciStateAq.merge(stateTreeDepth);
    await poll.mergeMaciStateAqSubRoots(0, 0);
    await poll.mergeMaciStateAq(0);

    const maciPoll = maciState.polls[0];
    maciPoll.messageAq.mergeSubRoots(0); //NOTE: 0 as input attempts to merge all subroots
    maciPoll.messageAq.merge(treeDepths.messageTreeDepth);
    await poll.mergeMessageAqSubRoots(0);
    await poll.mergeMessageAq();

    const { newSbCommitment: _maciNewSbCommitment } =
      maciPoll.processMessages(0);

    // ============== Tally Votes ==============
    console.log("Tally Votes");

    maciNewSbCommitment = _maciNewSbCommitment;
    //TODO: why does this work? due to the dummy verifier that is linked to the pollProcessor?
    const dummyProof: [
      BigNumberish,
      BigNumberish,
      BigNumberish,
      BigNumberish,
      BigNumberish,
      BigNumberish,
      BigNumberish,
      BigNumberish
    ] = [0, 0, 0, 0, 0, 0, 0, 0];
    await pollProcessorAndTallyer.processMessages(
      poll.address,
      maciNewSbCommitment,
      dummyProof
    );

    const maciTallyCircuitInputs = maciPoll.tallyVotes(0);
    await pollProcessorAndTallyer.tallyVotes(
      poll.address,
      maciTallyCircuitInputs.newTallyCommitment,
      dummyProof
    );

    // ============== Tally File Data ==============
    console.log("Tally File Data");

    const newTallyCommitment = maciTallyCircuitInputs.newTallyCommitment;
    const tallyResults = maciPoll.results.map((x: any) => x.toString());
    const tallySalt = maciTallyCircuitInputs.newResultsRootSalt;
    const voiceCreditsSpent = maciPoll.totalSpentVoiceCredits.toString();
    const voiceCreditsSalt =
      maciTallyCircuitInputs.newSpentVoiceCreditSubtotalSalt;
    const perVOSpentTally = maciPoll.perVOSpentVoiceCredits.map((x: any) =>
      x.toString()
    );
    const perVOSpentSalt =
      maciTallyCircuitInputs.newPerVOSpentVoiceCreditsRootSalt;
    tallyFileData = {
      maci: maci.address,
      pollId: pollId,
      newTallyCommitment: newTallyCommitment,
      results: {
        tally: tallyResults,
        salt: tallySalt,
      },
      totalSpentVoiceCredits: {
        spent: voiceCreditsSpent,
        salt: voiceCreditsSalt,
      },
      perVOSpentVoiceCredits: {
        tally: perVOSpentTally,
        salt: perVOSpentSalt,
      },
    };
  });

  it("verify tally off chain", async () => {
    // prettier-ignore
    const expectedResultsTally = [
        '0', '1', '2', '3', '4',  '5',
        '6', '7', '8', '9', '10', '0',
        '0', '0', '0', '0', '0',  '0',
        '0', '0', '0', '0', '0',  '0',
        '0'
      ];
    expect(tallyFileData.results.tally).to.deep.equal(expectedResultsTally);

    // prettier-ignore
    const expectedPerVOSpentVoiceCredits = [
        '0',   '1',  '4',  '9',  '16',
        '25',  '36', '49', '64', '81',
        '100', '0',  '0',  '0',  '0',
        '0',   '0',  '0',  '0',  '0',
        '0',   '0',  '0',  '0',  '0'
      ];
    expect(tallyFileData.perVOSpentVoiceCredits.tally).to.deep.equal(
      expectedPerVOSpentVoiceCredits
    );

    // prettier-ignore
    const expectedTotalSpentVoiceCredits = [
        '0',   '1',  '4',  '9',  '16',
        '25',  '36', '49', '64', '81',
        '100', '0',  '0',  '0',  '0',
        '0',   '0',  '0',  '0',  '0',
        '0',   '0',  '0',  '0',  '0'
      ].reduce(((acc, x) => acc + Number(x)), 0).toString();
    expect(tallyFileData.totalSpentVoiceCredits.spent).to.deep.equal(
      expectedTotalSpentVoiceCredits
    );
  });

  it("verify - stateAQ merged and processing complete", async () => {
    const stateAqMerged = await poll.stateAqMerged();
    expect(stateAqMerged).to.be.true;

    const processingComplete =
      await pollProcessorAndTallyer.processingComplete();
    expect(processingComplete).to.be.true;
  });

  it("verify - all parameters are set correctly", async () => {
    const {
      intStateTreeDepth,
      messageTreeSubDepth,
      messageTreeDepth,
      voteOptionTreeDepth,
    } = await poll.treeDepths();
    expect(intStateTreeDepth).to.be.equal(treeDepths.intStateTreeDepth);
    expect(messageTreeDepth).to.be.equal(treeDepths.messageTreeDepth);
    expect(messageTreeSubDepth).to.be.equal(treeDepths.messageTreeSubDepth);
    expect(voteOptionTreeDepth).to.be.equal(treeDepths.voteOptionTreeDepth);

    const [numSignUps, numMessages] = await poll.numSignUpsAndMessages();
    expect(numSignUps).to.be.equal(10);
    expect(numMessages).to.be.equal(10);

    const [maxMessages, maxVoteOptions] = await poll.maxValues();
    expect(maxVoteOptions).to.be.equal(maxValues.maxVoteOptions);
    expect(maxMessages).to.be.equal(maxValues.maxMessages);

    const [_messageBatchSize, _tallyBatchSize] = await poll.batchSizes();
    expect(_messageBatchSize).to.be.equal(messageBatchSize);
    expect(_tallyBatchSize).to.be.equal(tallyBatchSize);
  });

  it("verify - merged state root is correct", async () => {
    const mergedStateRootPoll = await poll.mergedStateRoot();
    const mergedStateRootMACI = await maci.getStateAqRoot();
    const expectedStateTreeRoot =
      maciState.polls[0].maciStateRef.stateTree.root;
    expect(mergedStateRootPoll).to.not.be.equal(BigNumber.from(0));
    expect(mergedStateRootMACI).to.not.be.equal(BigNumber.from(0));
    expect(expectedStateTreeRoot).to.not.be.equal(BigNumber.from(0));
    expect(mergedStateRootPoll).to.be.equal(mergedStateRootMACI); // MACI state root is the same as the poll state root
    expect(mergedStateRootPoll).to.be.equal(expectedStateTreeRoot); // MACI state root is the same as the one calculated offchain
  });

  it("verify - sbCommitment is correct on pollProcessorAndTallyer", async () => {
    const pptsbCommitment = await pollProcessorAndTallyer.sbCommitment();
    const expectedSbCommitment = maciNewSbCommitment;
    expect(pptsbCommitment).to.not.be.equal(BigNumber.from(0));
    expect(expectedSbCommitment).to.not.be.equal(BigNumber.from(0));
    expect(pptsbCommitment).to.be.equal(expectedSbCommitment); // pollProcessorAndTallyer sbCommitment is the same as the one calculated offchain
  });

  it("verify - sbCommitment correct on poll", async () => {
    const pollCurrentSbCommitment = await poll.currentSbCommitment();
    const pptsbCommitment = await pollProcessorAndTallyer.sbCommitment();
    const expectedSbCommitment = maciNewSbCommitment;
    expect(pollCurrentSbCommitment).to.not.be.equal(BigNumber.from(0));
    expect(pptsbCommitment).to.not.be.equal(BigNumber.from(0));
    expect(expectedSbCommitment).to.not.be.equal(BigNumber.from(0));
    expect(pptsbCommitment).to.be.equal(expectedSbCommitment);
    expect(pollCurrentSbCommitment).to.not.be.equal(pptsbCommitment); // poll sbCommitment is not the same as the one calculated on state
  });

  it("verify - merged message root is correct", async () => {
    const mergedMessageRoot = await messageAq.getMainRoot(
      treeDepths.messageTreeDepth
    );
    const expectedMessageTreeRoot = maciState.polls[0].messageTree.root;
    expect(mergedMessageRoot).to.not.be.equal(BigNumber.from(0));
    expect(expectedMessageTreeRoot).to.not.be.equal(BigNumber.from(0));
    expect(mergedMessageRoot).to.be.equal(expectedMessageTreeRoot); // MACI message root is the same as the one calculated offchain
  });

  it("verify - tally commitment is correct", async () => {
    const tallyCommitment = await pollProcessorAndTallyer.tallyCommitment();
    const expectedTallyCommitment = tallyFileData.newTallyCommitment;
    expect(tallyCommitment).to.not.be.equal(BigNumber.from(0));
    expect(expectedTallyCommitment).to.not.be.equal(BigNumber.from(0));
    expect(tallyCommitment).to.be.equal(expectedTallyCommitment); // pollProcessorAndTallyer tallyCommitment is the same as the one calculated offchain
  });

  // ===========================================================
  // There are 3 verifier:
  // 1. poll.verifySpentVoiceCredits()
  // 2. poll.verifyTallyResult()
  // 3. poll.verifyPerVOSpentVoiceCredits()
  //
  // TODO: fix these broken tests once upstream maci decorator is fixed
  // ===========================================================

  it.skip("should verify total spent voice credits", async () => {
    const { spent: _totalSpent, salt: _totalSpentSalt } =
      tallyFileData.totalSpentVoiceCredits;

    expect(await poll.verifySpentVoiceCredits(_totalSpent, _totalSpentSalt)).to
      .be.true;
  });

  it.skip("should verify tally result", async () => {
    // Setup
    const recipientIndex = 1;
    const resultTree = new IncrementalQuinTree(
      treeDepths.voteOptionTreeDepth,
      BigInt(0),
      STATE_TREE_ARITY,
      hash5
    );
    const perVOspentTree = new IncrementalQuinTree( treeDepths.voteOptionTreeDepth, BigInt(0), STATE_TREE_ARITY, hash5); // prettier-ignore

    for (const leaf of tallyFileData.results.tally) resultTree.insert(leaf); // insert resuls tally as leaves
    for (const leaf of tallyFileData.perVOSpentVoiceCredits.tally)
      perVOspentTree.insert(leaf); // insert perVO spent as leaves

    const resultProof = resultTree.genMerklePath(recipientIndex); // generate merkle path for result
    const spentProof = perVOspentTree.genMerklePath(recipientIndex); // generate merkle path for spent

    expect(resultTree.root).to.be.equal(resultProof.root); // verify result tree root
    expect(perVOspentTree.root).to.be.equal(spentProof.root); // verify spent tree root

    // Calculate arguments
    const _voteOptionIndex = recipientIndex;
    const _tallyResult = tallyFileData.results.tally[recipientIndex]; // result of the recipient
    const _tallyResultProof = resultProof.pathElements.map((x: any) =>
      x.map((y: any) => y.toString())
    ); // result proof as astring
    const _spentVoiceCreditsHash = BigNumber.from(
      hashLeftRight(
        BigInt(tallyFileData.totalSpentVoiceCredits.spent),
        BigInt(tallyFileData.totalSpentVoiceCredits.salt)
      ).toString()
    ).toString();
    const _perVOSpentVoiceCreditsHash = BigNumber.from(
        hashLeftRight(
          perVOspentTree.root, 
          BigInt(tallyFileData.perVOSpentVoiceCredits.salt)).toString()
      ).toString(); // prettier-ignore
    const _tallyCommitment = BigNumber.from(
      tallyFileData.newTallyCommitment
    ).toString();

    // * @param _voteOptionIndex the index of the vote option to verify the correctness of the tally
    // * @param _tallyResult Flattened array of the tally
    // * @param _tallyResultProof Corresponding proof of the tally result
    // * @param _tallyResultSalt the respective salt in the results object in the tally.json
    // * @param _spentVoiceCreditsHash hashLeftRight(number of spent voice credits, spent salt)
    // * @param _perVOSpentVoiceCreditsHash hashLeftRight(merkle root of the no spent voice credits per vote option, perVOSpentVoiceCredits salt)
    // * @param _tallyCommitment newTallyCommitment field in the tally.json
    expect(
      await poll.verifyTallyResult(
        _voteOptionIndex,
        _tallyResult,
        _tallyResultProof,
        _spentVoiceCreditsHash,
        _perVOSpentVoiceCreditsHash,
        _tallyCommitment
      )
    ).to.be.true;
  });

  it.skip("should verify per vote option spent voice credits", async () => {
    const recipientIndex = 1;

    const perVOspentTree = new IncrementalQuinTree( treeDepths.voteOptionTreeDepth, BigInt(0), STATE_TREE_ARITY, hash5); // prettier-ignore
    for (const leaf of tallyFileData.perVOSpentVoiceCredits.tally)
      perVOspentTree.insert(leaf); // insert tally as leaves
    const spentProof = perVOspentTree.genMerklePath(recipientIndex); // generate merkle path for the spent voice credits
    expect(perVOspentTree.root).to.be.equal(spentProof.root); // verify that the root of the tree is the same as the root of the merkle path

    const _voteOptionIndex = recipientIndex;
    const _spent = tallyFileData.perVOSpentVoiceCredits.tally[recipientIndex]; // get the spent voice credits for the recipient
    const _spentProof = spentProof.pathElements.map((x: any) =>
      x.map((y: any) => y.toString())
    ); // convert merkle path to string
    const _spentSalt = tallyFileData.perVOSpentVoiceCredits.salt; // get salt from tally.json

    expect(
      await poll.verifyPerVOSpentVoiceCredits(
        _voteOptionIndex,
        _spent,
        _spentProof,
        _spentSalt
      )
    ).to.be.true;
  });
});
