import { ethers } from "hardhat";

import { PollProcessorAndTallyer__factory } from "../typechain/factories/PollProcessorAndTallyer__factory";
import { Verifier__factory } from "../typechain/factories/Verifier__factory";

async function main() {
  const [deployer] = await ethers.getSigners();

  const verifier = await new Verifier__factory(deployer).deploy();

  const pollProcessorAndTallyer = await new PollProcessorAndTallyer__factory(
    deployer
  ).deploy(verifier.address);

  console.log(
    `Successfully deployed pollProcessorAndTallyer at ${pollProcessorAndTallyer.address}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
