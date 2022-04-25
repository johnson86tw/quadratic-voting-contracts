import hre from "hardhat";
import fs from "fs";
import path from "path";
import shelljs from "shelljs";
import { Addresses } from "../../ts/interfaces";
import { checkDeployment, checkEnvFile } from "../../ts/utils";

const pollId = 0;

const coordinatorPrivKey = process.env.COORDINATOR_PRIV_KEY as string;

const deploymentFileName = `deployment-${hre.network.name}.json`;
const deploymentPath = path.join(
  __dirname,
  "../../deployment",
  deploymentFileName
);

const defaultsPath = path.join(__dirname, "../../maci-cli-defaults");

async function main() {
  checkEnvFile("COORDINATOR_PRIV_KEY");

  const addresses = JSON.parse(
    fs.readFileSync(deploymentPath).toString()
  ) as Addresses;
  checkDeployment(addresses);

  let volume = `${defaultsPath}/localhost/defaults.js:/root/maci/cli/build/defaults.js`;
  if (hre.network.name !== "localhost") {
    // TODO: should check if the file exists
    volume = `${defaultsPath}/defaults.js:/root/maci/cli/build/defaults.js`;
  }

  const cmd = `docker-compose run --volume=${volume} maci node build/index.js genProofs \
    --contract ${addresses.maci} \
    --privkey ${coordinatorPrivKey} \
    --poll-id ${pollId} \
    --tally-file proofs/tally.json \
    --output proofs \
    --rapidsnark /root/rapidsnark/build/prover \
    --process-witnessgen ./zkeys/ProcessMessages_10-2-1-2_test \
    --tally-witnessgen ./zkeys/TallyVotes_10-1-2_test \
    --process-zkey ./zkeys/ProcessMessages_10-2-1-2_test.0.zkey \
    --tally-zkey ./zkeys/TallyVotes_10-1-2_test.0.zkey`;

  console.log("Running docker-compose to generate proofs...");
  shelljs.exec(cmd);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
