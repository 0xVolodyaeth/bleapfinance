import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { DepositContract } from '../typechain-types';
import { upgrades } from "hardhat";
import { ethers } from 'hardhat';
import { Signer, toBigInt } from 'ethers';
import { expect } from "chai";

describe('DepositContract', function () {
  let DepositContract: DepositContract;
  let owner: Signer;
  let bob: Signer;
  let alice: Signer;
  let companyAddress: Signer;

  const initialBasisPoints = 10;// 0.1% basis points

  async function deploy(): Promise<DepositContract> {
    [owner, bob, alice, companyAddress] = await ethers.getSigners();
    const DepositContractFactory = await ethers.getContractFactory("DepositContract");
    const depositContract = await upgrades.deployProxy(DepositContractFactory, [await companyAddress.getAddress(), initialBasisPoints])
    const dc = (await depositContract.waitForDeployment());

    return dc as unknown as DepositContract;
  }

  beforeEach(async function () {
    DepositContract = await loadFixture(deploy)
  });

  describe('Deposit', function () {
    it('Should deposit correct amount', async function () {
      const value = ethers.parseEther("1");

      let tx = await DepositContract.connect(bob).deposit({ value: value });
      await tx.wait();

      await expect(tx).emit(DepositContract, "Deposited")
        .withArgs(await bob.getAddress(), value);

      expect(await DepositContract.balances(await bob.getAddress())).to.equal(value);
    });
  });

  describe('Withdraw', function () {
    it('Should revert because amount exceeds balance', async function () {
      const withdrawAmount = ethers.parseEther("0.5");

      await expect(DepositContract.connect(bob).withdraw(withdrawAmount)).to.be.
        revertedWithCustomError(DepositContract, "InsufficientFunds");
    });

    it('Should withdraw correct amount', async function () {
      const value = ethers.parseEther("1");
      const withdrawAmount = ethers.parseEther("0.5");

      let tx = await DepositContract.connect(bob).deposit({ value: value });
      await tx.wait();

      tx = await DepositContract.connect(bob).withdraw(withdrawAmount);
      await tx.wait();

      await expect(tx).emit(DepositContract, "Withdrawn")
        .withArgs((await bob.getAddress()), withdrawAmount);
      expect(await DepositContract.balances(await bob.getAddress())).to.equal(withdrawAmount);
    });
  });

  describe('SendTo', function () {
    it('Should send correct amount and charge fee', async function () {
      const value = ethers.parseEther("1");
      const amountToSend = ethers.parseEther("1");

      const fee = amountToSend * toBigInt(10) / toBigInt(10000);
      const netAmount = amountToSend - fee;

      let tx = await DepositContract.connect(bob).deposit({ value: value });
      await tx.wait();

      tx = await DepositContract.connect(bob).sendTo(await alice.getAddress(), amountToSend);
      await tx.wait();

      await expect(tx).emit(DepositContract, "Sent")
        .withArgs((await bob.getAddress()), (await alice.getAddress()), netAmount);

      expect(await DepositContract.balances((await bob.getAddress()))).to.equal(value - amountToSend);
      expect(await DepositContract.balances((await alice.getAddress()))).to.equal(netAmount);
      expect(await DepositContract.balances(await DepositContract.companyAddress())).to.equal(fee);
    });

    it('Should revert because amount exceeds balance', async function () {
      const withdrawAmount = ethers.parseEther("0.5");

      await expect(DepositContract.connect(bob).sendTo(await alice.getAddress(), withdrawAmount)).to.be.
        revertedWithCustomError(DepositContract, "InsufficientFunds");
    });
  });

  describe('SetBasisPoint', function () {
    it('Should set fee basis points', async function () {
      let tx = await DepositContract.connect(owner).setBasisPoint(1000);
      await tx.wait();

      expect(await DepositContract.feeBasisPoints()).equals(1000);
    });

    it('Should revert because fee basis points exceed base', async function () {
      await expect(DepositContract.connect(owner).setBasisPoint(100000)).to.be.
        revertedWithCustomError(DepositContract, "FeeBasisPointsExceedBase");
    });
  });
});
