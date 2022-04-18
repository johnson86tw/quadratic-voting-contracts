import hre, { ethers } from "hardhat";
import path from "path";
import fs from "fs";
import setVerifyingKeys from "../../ts/setVerifyingKeys";
import { Addresses } from "../../ts/interfaces";
import { checkDeployment, checkEnvFile } from "../../ts/utils";

import { VkRegistry__factory } from "../../typechain/factories/VkRegistry__factory";

const deploymentFileName = `deployment-${hre.network.name}.json`;
const deploymentPath = path.join(
  __dirname,
  "../../deployment",
  deploymentFileName
);

const treeDepths = {
  stateTreeDepth: process.env.STATE_TREE_DEPTH as string,
  intStateTreeDepth: process.env.INT_STATE_TREE_DEPTH as string,
  msgTreeDepth: process.env.MESSAGE_TREE_DEPTH as string,
  msgBatchDepth: process.env.MESSAGE_TREE_SUB_DEPTH as string,
  voteOptionTreeDepth: process.env.VOTE_OPTION_TREE_DEPTH as string,
};

const vkPaths = {
  processVk: "./zkeys/ProcessMessages_10-2-1-2_test.0.zkey",
  tallyVk: "./zkeys/TallyVotes_10-1-2_test.0.zkey",
};

async function main() {
  checkEnvFile();
  const [deployer] = await ethers.getSigners();

  let addresses = JSON.parse(
    fs.readFileSync(deploymentPath).toString()
  ) as Addresses;
  checkDeployment(addresses);

  const vkRegistry = new VkRegistry__factory(deployer).attach(
    addresses.vkRegistry
  );

  await setVerifyingKeys(treeDepths, vkPaths, vkRegistry);
  console.log("Successfully set verifying keys");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
