import hre, { ethers } from "hardhat";
import path from "path";
import fs from "fs";
import { Addresses } from "../ts/addresses";

import { Keypair, PrivKey, PubKey } from "maci-domainobjs";

import { MACI__factory } from "../typechain/factories/MACI__factory";

async function main() {
  const [deployer, user1] = await ethers.getSigners();

  const userPrivKey = process.env.userPrivKey;
  if (!userPrivKey) {
    throw new Error("Please provide correct private key in .env file");
  }
  const userKeypair = new Keypair(PrivKey.unserialize(userPrivKey));

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

  const _pubKey = userKeypair.pubKey.asContractParam();
  const _signUpGatekeeperData = ethers.utils.defaultAbiCoder.encode(
    ["uint256"],
    [1]
  );
  const _initialVoiceCreditProxyData = ethers.utils.defaultAbiCoder.encode(
    ["uint256"],
    [0]
  );

  const { logs } = await maci
    .connect(user1)
    .signUp(_pubKey, _signUpGatekeeperData, _initialVoiceCreditProxyData)
    .then((tx) => tx.wait());

  const iface = maci.interface;
  const signUpEvent = iface.parseLog(logs[logs.length - 1]);
  const stateIndex = signUpEvent.args._stateIndex.toString();
  const userPubKey = signUpEvent.args._userPubKey.toString();
  const voiceCreditBalance = signUpEvent.args._voiceCreditBalance.toString();
  const timestamp = signUpEvent.args._timestamp.toString();

  console.log(`Successfully sign up at state index: ${stateIndex}`);
  console.log(`userPubKey: ${userPubKey}`); // TODO: how to serialize this?
  console.log(`voiceCreditBalance: ${voiceCreditBalance}`);
  console.log(`timestamp: ${timestamp}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
