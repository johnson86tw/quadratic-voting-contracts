import { expect } from "chai";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { MerkleTree } from "merkletreejs";
import { Whitelist, Whitelist__factory } from "../../build/typechain";
const { keccak256 } = ethers.utils;

let deployer: SignerWithAddress;
let whitelisted: SignerWithAddress[];
let notWhitelisted: SignerWithAddress[];

let whitelist: Whitelist;

let tree: MerkleTree;

describe("Whitelist", function () {
  beforeEach(async () => {
    [deployer] = await ethers.getSigners();
    const accounts = await ethers.getSigners();
    whitelisted = accounts.slice(1, 5);
    notWhitelisted = accounts.slice(5, 10);

    const leaves = whitelisted.map((account) => keccak256(account.address));
    tree = new MerkleTree(leaves, keccak256, { sort: true });
    const merkleRoot = tree.getHexRoot();

    whitelist = await new Whitelist__factory(deployer).deploy(merkleRoot);
  });

  it("should return true if the accounts is whitelised", async () => {
    for (let i = 0; i < whitelisted.length; i++) {
      const merkleProof = tree.getHexProof(keccak256(whitelisted[i].address));
      expect(
        await whitelist.register(whitelisted[i].address, merkleProof.toString())
      ).to.be.true;
    }
  });

  it("should be reverted if the merkle proof is invalid", async () => {
    const invalidMerkleProof = tree.getHexProof(
      keccak256(notWhitelisted[0].address)
    );
    await expect(
      whitelist.register(whitelisted[0].address, invalidMerkleProof.toString())
    ).to.be.revertedWith(
      "Whitelist: voter isn't whitelisted or incorrect proof"
    );
  });

  it("should be reverted if the accounts is not whitelised", async () => {
    const merkleProof = tree.getHexProof(keccak256(whitelisted[0].address));
    for (let i = 0; i < whitelisted.length; i++) {
      await expect(
        whitelist.register(notWhitelisted[i].address, merkleProof.toString())
      ).to.be.revertedWith(
        "Whitelist: voter isn't whitelisted or incorrect proof"
      );
    }
  });
});
