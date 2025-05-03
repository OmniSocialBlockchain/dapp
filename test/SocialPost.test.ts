import { expect } from "chai";
import { ethers } from "hardhat";
import { SocialPost, PersonaNFT } from "../typechain-types";

describe("SocialPost", function () {
  let socialPost: SocialPost;
  let personaNFT: PersonaNFT;
  let owner: any;
  let addr1: any;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    const PersonaNFT = await ethers.getContractFactory("PersonaNFT");
    personaNFT = await PersonaNFT.deploy();
    await personaNFT.waitForDeployment();

    const SocialPost = await ethers.getContractFactory("SocialPost");
    socialPost = await SocialPost.deploy(await personaNFT.getAddress());
    await socialPost.waitForDeployment();
  });

  describe("Post Creation", function () {
    it("Should create a new post", async function () {
      await personaNFT.createPersona(
        "Test Persona",
        "ipfs://test",
        "Test Description"
      );
      await personaNFT.activatePersona(1);

      const tx = await socialPost.createPost(
        1,
        "Test Content",
        "ipfs://test-media"
      );
      await tx.wait();

      const post = await socialPost.getPost(1);
      expect(post.personaId).to.equal(1);
      expect(post.content).to.equal("Test Content");
      expect(post.mediaURI).to.equal("ipfs://test-media");
    });

    it("Should not allow post creation without active persona", async function () {
      await expect(
        socialPost.createPost(1, "Test Content", "ipfs://test-media")
      ).to.be.revertedWith("Persona not active");
    });
  });

  describe("Likes", function () {
    beforeEach(async function () {
      await personaNFT.createPersona(
        "Test Persona",
        "ipfs://test",
        "Test Description"
      );
      await personaNFT.activatePersona(1);
      await socialPost.createPost(1, "Test Content", "ipfs://test-media");
    });

    it("Should allow users to like posts", async function () {
      await socialPost.likePost(1);
      const post = await socialPost.getPost(1);
      expect(post.likes).to.equal(1);
    });

    it("Should not allow users to like the same post twice", async function () {
      await socialPost.likePost(1);
      await expect(socialPost.likePost(1)).to.be.revertedWith("Already liked");
    });
  });

  describe("Comments", function () {
    beforeEach(async function () {
      await personaNFT.createPersona(
        "Test Persona",
        "ipfs://test",
        "Test Description"
      );
      await personaNFT.activatePersona(1);
      await socialPost.createPost(1, "Test Content", "ipfs://test-media");
    });

    it("Should allow users to add comments", async function () {
      await socialPost.addComment(1, "Test Comment");
      const post = await socialPost.getPost(1);
      expect(post.comments).to.equal(1);
    });

    it("Should store comment IDs", async function () {
      await socialPost.addComment(1, "Test Comment");
      const comments = await socialPost.getComments(1);
      expect(comments.length).to.equal(1);
    });
  });
}); 