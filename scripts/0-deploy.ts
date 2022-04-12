import hre, { ethers } from "hardhat";
import path from "path";
import fs from "fs";
import { Addresses } from "../ts/addresses";

import { PoseidonT3__factory } from "../typechain/factories/PoseidonT3__factory";
import { PoseidonT4__factory } from "../typechain/factories/PoseidonT4__factory";
import { PoseidonT5__factory } from "../typechain/factories/PoseidonT5__factory";
import { PoseidonT6__factory } from "../typechain/factories/PoseidonT6__factory";

import { VkRegistry__factory } from "../typechain/factories/VkRegistry__factory";
import { PollFactory__factory } from "../typechain/factories/PollFactory__factory";
import { MessageAqFactory__factory } from "../typechain/factories/MessageAqFactory__factory";
import { QuadraticVoting__factory } from "../typechain/factories/QuadraticVoting__factory";
import { MACI__factory } from "../typechain/factories/MACI__factory";
import { AccQueueQuinaryMaci__factory } from "../typechain/factories/AccQueueQuinaryMaci__factory";

async function main() {
  const [deployer] = await ethers.getSigners();

  const poseidonT3 = await new PoseidonT3__factory(deployer).deploy();
  const poseidonT4 = await new PoseidonT4__factory(deployer).deploy();
  const poseidonT5 = await new PoseidonT5__factory(deployer).deploy();
  const poseidonT6 = await new PoseidonT6__factory(deployer).deploy();

  const linkedLibraryAddresses = {
    ["maci-contracts/contracts/crypto/Hasher.sol:PoseidonT5"]:
      poseidonT5.address,
    ["maci-contracts/contracts/crypto/Hasher.sol:PoseidonT3"]:
      poseidonT3.address,
    ["maci-contracts/contracts/crypto/Hasher.sol:PoseidonT6"]:
      poseidonT6.address,
    ["maci-contracts/contracts/crypto/Hasher.sol:PoseidonT4"]:
      poseidonT4.address,
  };

  const vkRegistry = await new VkRegistry__factory(deployer).deploy();

  const pollFactory = await new PollFactory__factory(
    { ...linkedLibraryAddresses },
    deployer
  ).deploy();

  const messageAqFactory = await new MessageAqFactory__factory(
    { ...linkedLibraryAddresses },
    deployer
  ).deploy();

  const qv = await new QuadraticVoting__factory(deployer).deploy();

  const maci = await new MACI__factory(
    { ...linkedLibraryAddresses },
    deployer
  ).deploy(pollFactory.address, qv.address, qv.address);

  const stateAqAddress = await maci.stateAq();
  const stateAq = new AccQueueQuinaryMaci__factory(
    { ...linkedLibraryAddresses },
    deployer
  ).attach(stateAqAddress);

  // transfer ownership
  await pollFactory.transferOwnership(maci.address);
  await messageAqFactory.transferOwnership(pollFactory.address);

  // init maci
  await maci.init(vkRegistry.address, messageAqFactory.address);

  if (await maci.isInitialised()) {
    console.log("Successfully deployed contracts and initialized maci");
  } else {
    throw new Error("Failed to initialize maci");
  }

  const addresses: Addresses = {
    poseidonT5: poseidonT5.address,
    poseidonT3: poseidonT3.address,
    poseidonT6: poseidonT6.address,
    poseidonT4: poseidonT4.address,
    vkRegistry: vkRegistry.address,
    pollFactory: pollFactory.address,
    messageAqFactory: messageAqFactory.address,
    stateAq: stateAq.address,
    maci: maci.address,
  };

  const jsonPath = path.join(
    __dirname,
    "..",
    `deployment-${hre.network.name}.json`
  );
  fs.writeFileSync(jsonPath, JSON.stringify(addresses));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
