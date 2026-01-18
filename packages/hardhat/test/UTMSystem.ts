import hre from 'hardhat';
import { expect } from 'chai';
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';
import { UTMCoin } from '../typechain-types';
import { UTMStore } from '../typechain-types';

describe('UTM System', () => {
  let utmCoin: UTMCoin;
  let utmStore: UTMStore;
  let owner: HardhatEthersSigner;
  let addr1: HardhatEthersSigner;
  let addr2: HardhatEthersSigner;

  const toWei = (value: string) => hre.ethers.parseEther(value);
  const toUTM = (value: string) => hre.ethers.parseUnits(value, 12);

  beforeEach(async () => {
    [owner, addr1, addr2] = await hre.ethers.getSigners();

    const UTMCoinFactory = await hre.ethers.getContractFactory('UTMCoin');
    utmCoin = await UTMCoinFactory.deploy(owner.address);
    await utmCoin.waitForDeployment();

    const UTMStoreFactory = await hre.ethers.getContractFactory('UTMStore');
    utmStore = await UTMStoreFactory.deploy(await utmCoin.getAddress(), owner.address);
    await utmStore.waitForDeployment();
  });

  describe('UTMCoin', () => {
    describe('Deployment', () => {
      it('should set correct owner', async () => {
        expect(await utmCoin.owner()).to.equal(owner.address);
      });

      it('should have correct token name and symbol', async () => {
        expect(await utmCoin.name()).to.equal('UTMCoin');
        expect(await utmCoin.symbol()).to.equal('UTM');
      });

      it('should have 12 decimals for Polkadot compatibility', async () => {
        expect(await utmCoin.decimals()).to.equal(12);
      });

      it('should initialize with zero total supply', async () => {
        expect(await utmCoin.totalSupply()).to.equal(0);
      });
    });

    describe('Register', () => {
      it('should allow new user to register and claim 1000 coins', async () => {
        const expectedAmount = toUTM('1000');
        await utmCoin.connect(addr1).register();

        expect(await utmCoin.balanceOf(addr1.address)).to.equal(expectedAmount);
        expect(await utmCoin.hasClaimed(addr1.address)).to.equal(true);
      });

      it('should emit UserRegistered event', async () => {
        const expectedAmount = toUTM('1000');
        await expect(utmCoin.connect(addr1).register())
          .to.emit(utmCoin, 'UserRegistered')
          .withArgs(addr1.address, expectedAmount);
      });

      it('should increase total supply after registration', async () => {
        const expectedAmount = toUTM('1000');
        await utmCoin.connect(addr1).register();

        expect(await utmCoin.totalSupply()).to.equal(expectedAmount);
      });

      it('should prevent double claiming by same address', async () => {
        await utmCoin.connect(addr1).register();

        await expect(utmCoin.connect(addr1).register())
          .to.be.revertedWith('Already claimed free coins');
      });

      it('should allow multiple users to register separately', async () => {
        const expectedAmount = toUTM('1000');
        await utmCoin.connect(addr1).register();
        await utmCoin.connect(addr2).register();

        expect(await utmCoin.balanceOf(addr1.address)).to.equal(expectedAmount);
        expect(await utmCoin.balanceOf(addr2.address)).to.equal(expectedAmount);
        expect(await utmCoin.totalSupply()).to.equal(expectedAmount * 2n);
      });

      it('should mint exactly 1000 coins with 12 decimals', async () => {
        await utmCoin.connect(addr1).register();
        const balance = await utmCoin.balanceOf(addr1.address);
        const expected = 1000n * 10n ** 12n;

        expect(balance).to.equal(expected);
      });
    });

    describe('Mint', () => {
      it('should allow owner to mint additional tokens', async () => {
        const mintAmount = toUTM('5000');
        await utmCoin.mint(addr1.address, mintAmount);

        expect(await utmCoin.balanceOf(addr1.address)).to.equal(mintAmount);
      });

      it('should increase total supply when owner mints', async () => {
        const mintAmount = toUTM('10000');
        const supplyBefore = await utmCoin.totalSupply();

        await utmCoin.mint(addr1.address, mintAmount);

        const expectedSupply = supplyBefore + mintAmount;
        expect(await utmCoin.totalSupply()).to.equal(expectedSupply);
      });

      it('should prevent non-owner from minting', async () => {
        const mintAmount = toUTM('1000');

        await expect(utmCoin.connect(addr1).mint(addr2.address, mintAmount))
          .to.be.revertedWithCustomError(utmCoin, 'OwnableUnauthorizedAccount');
      });
    });
  });

  describe('UTMStore', () => {
    describe('Deployment', () => {
      it('should set correct owner', async () => {
        expect(await utmStore.owner()).to.equal(owner.address);
      });

      it('should set correct token address', async () => {
        expect(await utmStore.token()).to.equal(await utmCoin.getAddress());
      });

      it('should initialize analytics to zero', async () => {
        const [totalPurchases, totalRevenue, contractBalance] = await utmStore.getStoreStats();

        expect(totalPurchases).to.equal(0);
        expect(totalRevenue).to.equal(0);
        expect(contractBalance).to.equal(0);
      });
    });

    describe('Set Product', () => {
      it('should allow owner to set a product', async () => {
        const price = toUTM('50');

        await utmStore.setProduct(1, price, true);
        const [productPrice, isActive] = await utmStore.getProduct(1);

        expect(productPrice).to.equal(price);
        expect(isActive).to.equal(true);
      });

      it('should emit ProductUpdated event', async () => {
        const price = toUTM('75');

        await expect(utmStore.setProduct(1, price, true))
          .to.emit(utmStore, 'ProductUpdated')
          .withArgs(1, price, true, owner.address);
      });

      it('should allow owner to update existing product', async () => {
        const initialPrice = toUTM('50');
        const newPrice = toUTM('75');

        await utmStore.setProduct(1, initialPrice, true);
        await utmStore.setProduct(1, newPrice, false);

        const [productPrice, isActive] = await utmStore.getProduct(1);
        expect(productPrice).to.equal(newPrice);
        expect(isActive).to.equal(false);
      });

      it('should prevent non-owner from setting products', async () => {
        const price = toUTM('50');

        await expect(utmStore.connect(addr1).setProduct(1, price, true))
          .to.be.revertedWithCustomError(utmStore, 'OwnableUnauthorizedAccount');
      });

      it('should set multiple products independently', async () => {
        await utmStore.setProduct(1, toUTM('50'), true);
        await utmStore.setProduct(2, toUTM('75'), true);
        await utmStore.setProduct(3, toUTM('100'), false);

        const [price1, active1] = await utmStore.getProduct(1);
        const [price2, active2] = await utmStore.getProduct(2);
        const [price3, active3] = await utmStore.getProduct(3);

        expect(price1).to.equal(toUTM('50'));
        expect(active1).to.equal(true);
        expect(price2).to.equal(toUTM('75'));
        expect(active2).to.equal(true);
        expect(price3).to.equal(toUTM('100'));
        expect(active3).to.equal(false);
      });
    });

    describe('Purchase Item', () => {
      beforeEach(async () => {
        await utmCoin.mint(addr1.address, toUTM('5000'));
        await utmStore.setProduct(1, toUTM('50'), true);
      });

      it('should allow user to purchase an item', async () => {
        const price = toUTM('50');
        await utmCoin.connect(addr1).approve(await utmStore.getAddress(), price);

        await utmStore.connect(addr1).purchaseItem(1);

        const userBalance = await utmCoin.balanceOf(addr1.address);
        expect(userBalance).to.equal(toUTM('5000') - price);
      });

      it('should transfer tokens to store contract', async () => {
        const price = toUTM('50');
        await utmCoin.connect(addr1).approve(await utmStore.getAddress(), price);

        await utmStore.connect(addr1).purchaseItem(1);

        const contractBalance = await utmCoin.balanceOf(await utmStore.getAddress());
        expect(contractBalance).to.equal(price);
      });

      it('should emit ItemPurchased event', async () => {
        const price = toUTM('50');
        await utmCoin.connect(addr1).approve(await utmStore.getAddress(), price);

        await expect(utmStore.connect(addr1).purchaseItem(1))
          .to.emit(utmStore, 'ItemPurchased')
          .withArgs(addr1.address, 1, price);
      });

      it('should update purchase analytics', async () => {
        const price = toUTM('50');
        await utmCoin.connect(addr1).approve(await utmStore.getAddress(), price);

        await utmStore.connect(addr1).purchaseItem(1);

        const [totalPurchases, totalRevenue] = await utmStore.getStoreStats();
        expect(totalPurchases).to.equal(1);
        expect(totalRevenue).to.equal(price);
      });

      it('should revert when product is not active', async () => {
        const price = toUTM('50');
        await utmStore.setProduct(2, price, false);
        await utmCoin.connect(addr1).approve(await utmStore.getAddress(), price);

        await expect(utmStore.connect(addr1).purchaseItem(2))
          .to.be.revertedWith('Product not available');
      });

      it('should revert when product price is zero', async () => {
        await utmStore.setProduct(3, 0, true);
        await utmCoin.connect(addr1).approve(await utmStore.getAddress(), 0);

        await expect(utmStore.connect(addr1).purchaseItem(3))
          .to.be.revertedWith('Invalid product price');
      });

      it('should revert when user has insufficient balance', async () => {
        await utmCoin.mint(addr2.address, toUTM('10'));
        const price = toUTM('50');
        await utmCoin.connect(addr2).approve(await utmStore.getAddress(), price);

        await expect(utmStore.connect(addr2).purchaseItem(1))
          .to.be.revertedWith('ERC20: transfer amount exceeds balance');
      });

      it('should revert when allowance is insufficient', async () => {
        const price = toUTM('50');
        await utmCoin.connect(addr1).approve(await utmStore.getAddress(), toUTM('10'));

        await expect(utmStore.connect(addr1).purchaseItem(1))
          .to.be.revertedWith('ERC20: insufficient allowance');
      });

      it('should allow multiple purchases', async () => {
        const price1 = toUTM('50');
        const price2 = toUTM('75');

        await utmStore.setProduct(2, price2, true);
        await utmCoin.connect(addr1).approve(await utmStore.getAddress(), price1 + price2);

        await utmStore.connect(addr1).purchaseItem(1);
        await utmStore.connect(addr1).purchaseItem(2);

        const userBalance = await utmCoin.balanceOf(addr1.address);
        expect(userBalance).to.equal(toUTM('5000') - price1 - price2);

        const [totalPurchases] = await utmStore.getStoreStats();
        expect(totalPurchases).to.equal(2);
      });
    });

    describe('Withdraw', () => {
      beforeEach(async () => {
        await utmCoin.mint(addr1.address, toUTM('5000'));
        await utmStore.setProduct(1, toUTM('50'), true);
        await utmCoin.connect(addr1).approve(await utmStore.getAddress(), toUTM('50'));
        await utmStore.connect(addr1).purchaseItem(1);
      });

      it('should allow owner to withdraw all tokens', async () => {
        await utmStore.withdraw(0);

        const contractBalance = await utmCoin.balanceOf(await utmStore.getAddress());
        expect(contractBalance).to.equal(0);
      });

      it('should allow owner to withdraw specific amount', async () => {
        const withdrawAmount = toUTM('25');
        await utmStore.withdraw(withdrawAmount);

        const contractBalance = await utmCoin.balanceOf(await utmStore.getAddress());
        expect(contractBalance).to.equal(toUTM('50') - withdrawAmount);
      });

      it('should emit TokensWithdrawn event', async () => {
        const withdrawAmount = toUTM('25');

        await expect(utmStore.withdraw(withdrawAmount))
          .to.emit(utmStore, 'TokensWithdrawn')
          .withArgs(owner.address, withdrawAmount);
      });

      it('should increase owner balance after withdrawal', async () => {
        const ownerBalanceBefore = await utmCoin.balanceOf(owner.address);
        await utmStore.withdraw(0);

        const ownerBalanceAfter = await utmCoin.balanceOf(owner.address);
        expect(ownerBalanceAfter).to.equal(ownerBalanceBefore + toUTM('50'));
      });

      it('should revert when non-owner tries to withdraw', async () => {
        await expect(utmStore.connect(addr1).withdraw(0))
          .to.be.revertedWithCustomError(utmStore, 'OwnableUnauthorizedAccount');
      });

      it('should revert when withdrawal amount exceeds balance', async () => {
        await expect(utmStore.withdraw(toUTM('100')))
          .to.be.revertedWith('Insufficient balance');
      });

      it('should handle withdrawal of zero balance', async () => {
        await utmStore.withdraw(0);

        await expect(utmStore.withdraw(0)).to.not.be.reverted;
      });

      it('should allow multiple withdrawals over time', async () => {
        await utmCoin.connect(addr1).purchaseItem(1);

        await utmStore.withdraw(toUTM('25'));

        let contractBalance = await utmCoin.balanceOf(await utmStore.getAddress());
        expect(contractBalance).to.equal(toUTM('75'));

        await utmStore.withdraw(0);

        contractBalance = await utmCoin.balanceOf(await utmStore.getAddress());
        expect(contractBalance).to.equal(0);
      });
    });

    describe('Store Stats', () => {
      it('should return correct stats after multiple purchases', async () => {
        await utmCoin.mint(addr1.address, toUTM('5000'));
        await utmCoin.mint(addr2.address, toUTM('5000'));

        await utmStore.setProduct(1, toUTM('50'), true);
        await utmStore.setProduct(2, toUTM('75'), true);

        await utmCoin.connect(addr1).approve(await utmStore.getAddress(), toUTM('50'));
        await utmCoin.connect(addr2).approve(await utmStore.getAddress(), toUTM('75'));

        await utmStore.connect(addr1).purchaseItem(1);
        await utmStore.connect(addr2).purchaseItem(2);

        const [totalPurchases, totalRevenue, contractBalance] = await utmStore.getStoreStats();

        expect(totalPurchases).to.equal(2);
        expect(totalRevenue).to.equal(toUTM('125'));
        expect(contractBalance).to.equal(toUTM('125'));
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete user flow: register -> purchase -> admin withdraw', async () => {
      await utmCoin.connect(addr1).register();

      await utmStore.setProduct(1, toUTM('50'), true);

      await utmCoin.connect(addr1).approve(await utmStore.getAddress(), toUTM('50'));
      await utmStore.connect(addr1).purchaseItem(1);

      const userBalance = await utmCoin.balanceOf(addr1.address);
      expect(userBalance).to.equal(toUTM('1000') - toUTM('50'));

      await utmStore.withdraw(0);

      const ownerBalance = await utmCoin.balanceOf(owner.address);
      expect(ownerBalance).to.equal(toUTM('50'));

      const contractBalance = await utmCoin.balanceOf(await utmStore.getAddress());
      expect(contractBalance).to.equal(0);
    });

    it('should handle multiple users with different products', async () => {
      await utmCoin.connect(addr1).register();
      await utmCoin.connect(addr2).register();

      await utmStore.setProduct(1, toUTM('50'), true);
      await utmStore.setProduct(2, toUTM('75'), true);

      await utmCoin.connect(addr1).approve(await utmStore.getAddress(), toUTM('50'));
      await utmCoin.connect(addr2).approve(await utmStore.getAddress(), toUTM('75'));

      await utmStore.connect(addr1).purchaseItem(1);
      await utmStore.connect(addr2).purchaseItem(2);

      const [totalPurchases, totalRevenue] = await utmStore.getStoreStats();
      expect(totalPurchases).to.equal(2);
      expect(totalRevenue).to.equal(toUTM('125'));
    });
  });
});
