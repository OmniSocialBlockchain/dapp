import { expect } from "chai";
import { ethers } from "hardhat";
import { PersonaNFT } from "../typechain-types";

describe("PersonaNFT", function () {
  let personaNFT: PersonaNFT;
  let owner: any;
  let addr1: any;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    const PersonaNFT = await ethers.getContractFactory("PersonaNFT");
    personaNFT = await PersonaNFT.deploy();
    await personaNFT.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await personaNFT.owner()).to.equal(owner.address);
    });

    it("Should have the right name and symbol", async function () {
      expect(await personaNFT.name()).to.equal("OmniSocial Persona");
      expect(await personaNFT.symbol()).to.equal("OSP");
    });
  });

  describe("Persona Creation", function () {
    it("Should create a new persona", async function () {
      const tx = await personaNFT.createPersona(
        "Test Persona",
        "ipfs://test",
        "Test Description"
      );
      await tx.wait();

      const tokenId = await personaNFT.getActivePersona(owner.address);
      const persona = await personaNFT.getPersona(tokenId);

      expect(persona.name).to.equal("Test Persona");
      expect(persona.imageURI).to.equal("ipfs://test");
      expect(persona.description).to.equal("Test Description");
    });

    it("Should emit PersonaCreated event", async function () {
      await expect(
        personaNFT.createPersona("Test Persona", "ipfs://test", "Test Description")
      )
        .to.emit(personaNFT, "PersonaCreated")
        .withArgs(1, owner.address, "Test Persona");
    });
  });

  describe("Persona Activation", function () {
    it("Should activate a persona", async function () {
      await personaNFT.createPersona(
        "Test Persona",
        "ipfs://test",
        "Test Description"
      );
      await personaNFT.activatePersona(1);

      const activePersona = await personaNFT.getActivePersona(owner.address);
      expect(activePersona).to.equal(1);
    });

    it("Should emit PersonaActivated event", async function () {
      await personaNFT.createPersona(
        "Test Persona",
        "ipfs://test",
        "Test Description"
      );
      await expect(personaNFT.activatePersona(1))
        .to.emit(personaNFT, "PersonaActivated")
        .withArgs(1, owner.address);
    });

    it("Should not allow non-owner to activate persona", async function () {
      await personaNFT.createPersona(
        "Test Persona",
        "ipfs://test",
        "Test Description"
      );
      await expect(
        personaNFT.connect(addr1).activatePersona(1)
      ).to.be.revertedWith("Not the owner");
    });
  });
}); 