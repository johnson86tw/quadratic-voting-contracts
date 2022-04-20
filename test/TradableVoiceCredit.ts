import { expect } from "chai";
import { ethers } from "hardhat";
import {
  MockToken,
  MockToken__factory,
  TradableVoiceCredit,
  TradableVoiceCredit__factory,
} from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

let deployer: SignerWithAddress;
let target: SignerWithAddress;

let token: MockToken;
let tradableVC: TradableVoiceCredit;

const totalSupply = BigInt(1000 * 10 ** 18);

describe("TradableVoiceCredit", function () {
  beforeEach(async () => {
    [deployer, target] = await ethers.getSigners();
    token = await new MockToken__factory(deployer).deploy(totalSupply);
  });

  it("should deploy MockToken and the deployer has initial supply", async () => {
    await expect((await token.deployTransaction.wait()).status).to.not.equal(0);
    expect(await token.balanceOf(deployer.address)).to.equal(
      BigInt(1000 * 10 ** 18)
    );
  });

  it("should deploy TradableVoiceCredit contract", async function () {
    const voiceCreditFactor = BigInt(10 ** 18);
    tradableVC = await new TradableVoiceCredit__factory(deployer).deploy(
      token.address,
      voiceCreditFactor,
      target.address
    );
    await expect(
      (
        await tradableVC.deployTransaction.wait()
      ).status
    ).to.not.equal(0);
    expect(await tradableVC.nativeToken()).to.equal(token.address);
  });

  it("should buy 1 voice credit by 10^18 token with VCFactor equal to 10^18", async () => {
    const voiceCreditFactor = BigInt(10 ** 18);
    tradableVC = await new TradableVoiceCredit__factory(deployer).deploy(
      token.address,
      voiceCreditFactor,
      target.address
    );
    const amount = BigInt(1 * 10 ** 18);
    await token.approve(tradableVC.address, amount);
    await tradableVC.buyVoiceCredit(amount);
    expect(await token.balanceOf(deployer.address)).to.equal(
      BigInt(999 * 10 ** 18)
    );
    const initialVoiceCreditProxyData = ethers.utils.defaultAbiCoder.encode(
      ["uint256"],
      [0]
    );
    expect(
      await tradableVC.getVoiceCredits(
        deployer.address,
        initialVoiceCreditProxyData
      )
    ).to.equal(BigInt(1));
  });

  it("should buy 1 voice credit by 1 token with VCFactor equal to 1", async () => {
    const voiceCreditFactor = BigInt(1);
    tradableVC = await new TradableVoiceCredit__factory(deployer).deploy(
      token.address,
      voiceCreditFactor,
      target.address
    );
    const amount = BigInt(100);
    await token.approve(tradableVC.address, amount);
    await tradableVC.buyVoiceCredit(amount);
    expect(await token.balanceOf(deployer.address)).to.equal(
      BigInt(1000 * 10 ** 18) - amount
    );
    const initialVoiceCreditProxyData = ethers.utils.defaultAbiCoder.encode(
      ["uint256"],
      [0]
    );
    expect(
      await tradableVC.getVoiceCredits(
        deployer.address,
        initialVoiceCreditProxyData
      )
    ).to.equal(BigInt(100));
  });

  it("should buy voice credit with the amount devisible by voice credit factor", async () => {
    const voiceCreditFactor = BigInt(6);
    tradableVC = await new TradableVoiceCredit__factory(deployer).deploy(
      token.address,
      voiceCreditFactor,
      target.address
    );
    const amount = BigInt(100);
    await token.approve(tradableVC.address, amount);
    await expect(tradableVC.buyVoiceCredit(amount)).to.be.revertedWith(
      "TradableVoiceCredit: amount should be divisible by voice credit factor"
    );
  });
});
