import { ethers } from 'hardhat'

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log('Deploying contracts with the account:', deployer.address)

  // Deploy PersonaNFT
  const PersonaNFT = await ethers.getContractFactory('PersonaNFT')
  const personaNFT = await PersonaNFT.deploy()
  await personaNFT.waitForDeployment()
  console.log('PersonaNFT deployed to:', await personaNFT.getAddress())

  // Deploy SocialPost
  const SocialPost = await ethers.getContractFactory('SocialPost')
  const socialPost = await SocialPost.deploy(await personaNFT.getAddress())
  await socialPost.waitForDeployment()
  console.log('SocialPost deployed to:', await socialPost.getAddress())

  // Deploy OmniToken
  const OmniToken = await ethers.getContractFactory('OmniToken')
  const omniToken = await OmniToken.deploy()
  await omniToken.waitForDeployment()
  console.log('OmniToken deployed to:', await omniToken.getAddress())

  // Deploy OmniDAO
  const OmniDAO = await ethers.getContractFactory('OmniDAO')
  const omniDAO = await OmniDAO.deploy(omniToken)
  await omniDAO.waitForDeployment()
  console.log('OmniDAO deployed to:', await omniDAO.getAddress())
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  }) 