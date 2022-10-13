import { ethers } from "hardhat"
import { Contract, Signer, Wallet } from "ethers"

async function main() {
  let nft: Contract
  let operator: Signer

  operator = ethers.provider.getSigner()

  const contractURI = "ipfs://QmYnjGeLbBhfDM8Y11F5hVMDdGQz91dFCroHT8eiygnXxC/contract.json"
  const blindBoxURI = "ipfs://QmX5CnSJjtunPUp67DwVYUBgPYR2PB18M6riqPa3verc721Up/"
  const metadataURI = ""

  nft = await (
    await ethers.getContractFactory("stubERC721", operator)
  ).deploy(
    contractURI,
    blindBoxURI,
    metadataURI
  )

  console.log("Address:\n", nft.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });