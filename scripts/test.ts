import { ethers, network } from "hardhat";
import { Keypair, PrivKey } from "maci-domainobjs";

async function main() {
  const coordinatorPrivKey = process.env.coordinatorPrivKey as string;
  const coordinator = new Keypair(PrivKey.unserialize(coordinatorPrivKey));
  console.log(coordinator.pubKey.serialize());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
