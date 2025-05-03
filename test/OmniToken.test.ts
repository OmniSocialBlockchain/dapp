import { expect } from "chai";
import { ethers } from "hardhat";
import { OmniToken } from "../typechain-types";

describe("OmniToken", function () {
  let omniToken: OmniToken;
  let owner: any;
  let addr1: any;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    const OmniToken = await ethers.getContractFactory("OmniToken");
    omniToken = await OmniToken.deploy();
    await omniToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await omniToken.owner()).to.equal(owner.address);
    });

    it("Should have the right name and symbol", async function () {
      expect(await omniToken.name()).to.equal("OmniSocial Token");
      expect(await omniToken.symbol()).to.equal("OMNI");
    });

    it("Should mint initial supply to owner", async function () {
      const ownerBalance = await omniToken.balanceOf(owner.address);
      expect(ownerBalance).to.equal(ethers.parseEther("1000000000"));
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint tokens", async function () {
      await omniToken.mint(addr1.address, ethers.parseEther("1000"));
      const balance = await omniToken.balanceOf(addr1.address);
      expect(balance).to.equal(ethers.parseEther("1000"));
    });

    it("Should not allow non-owner to mint tokens", async function () {
      await expect(
        omniToken.connect(addr1).mint(addr1.address, ethers.parseEther("1000"))
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Burning", function () {
    it("Should allow users to burn their tokens", async function () {
      await omniToken.mint(addr1.address, ethers.parseEther("1000"));
      await omniToken.connect(addr1).burn(ethers.parseEther("500"));
      const balance = await omniToken.balanceOf(addr1.address);
      expect(balance).to.equal(ethers.parseEther("500"));
    });

    it("Should not allow users to burn more tokens than they have", async function () {
      await expect(
        omniToken.connect(addr1).burn(ethers.parseEther("1000"))
      ).to.be.revertedWith("ERC20: burn amount exceeds balance");
    });
  });
}); 