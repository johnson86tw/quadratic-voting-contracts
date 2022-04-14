import { Keypair } from "maci-domainobjs";

async function main() {
  const keypair = new Keypair();

  const serializedPrivKey = keypair.privKey.serialize();
  const serializedPubKey = keypair.pubKey.serialize();
  console.log("Private key:", serializedPrivKey);
  console.log("Public key: ", serializedPubKey);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
