import hre, { ethers } from "hardhat";
import path from "path";
import fs from "fs";
import { Addresses } from "../../ts/interfaces";
import {
  MACI__factory,
  InitialVoiceCreditProxy__factory,
} from "../../build/typechain";

const deploymentFileName = `deployment-${hre.network.name}.json`;
const deploymentPath = path.join(
  __dirname,
  "../../deployment",
  deploymentFileName
);

async function main() {
  const [deployer, user] = await ethers.getSigners();

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

  const initialVCProxy = InitialVoiceCreditProxy__factory.connect(
    await maci.initialVoiceCreditProxy(),
    deployer
  );

  const voiceCreditBalance = (
    await initialVCProxy.getVoiceCredits(user.address, [])
  ).toString();

  console.log("user address", user.address);
  console.log("voice credit balance", voiceCreditBalance);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
