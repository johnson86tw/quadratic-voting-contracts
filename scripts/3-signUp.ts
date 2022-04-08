import { ethers } from "hardhat";
import { BigNumber, BigNumberish, Signer } from "ethers";
import { Command, Keypair, PrivKey, VerifyingKey } from "maci-domainobjs";

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

const userPrivKey =
  "macisk.2c4b2cf6277e3dd8c94ac7acd73b7393646f1e922468aa9d03837e055b5741b1";

async function main() {
  const [deployer, user1] = await ethers.getSigners();

  const unserialisedPrivkey = PrivKey.unserialize(userPrivKey);
  const maciKey = new Keypair(unserialisedPrivkey);

  const maci = new MACI__factory(
    { ...linkedLibraryAddresses },
    deployer
  ).attach("0x610178dA211FEF7D417bC0e6FeD39F05609AD788");

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
    .connect(user1)
    .signUp(_pubKey, _signUpGatekeeperData, _initialVoiceCreditProxyData)
    .then((tx) => tx.wait());

  const iface = maci.interface;
  const signUpEvent = iface.parseLog(logs[logs.length - 1]);
  const stateIndex = signUpEvent.args._stateIndex.toString();

  console.log(
    `PubKey: ${maciKey.pubKey.serialize()}, signerAddress: ${
      user1.address
    }, stateIndex: ${stateIndex},`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
