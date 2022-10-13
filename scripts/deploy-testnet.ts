import { ethers } from "hardhat"
import { Contract, Signer } from "ethers"
import { genesisNFTs, allianceNFTs } from './args/testNFTList';

async function main() {
  let quasiStakingImpl: Contract, quasiStaking: Contract, bcnt: Contract
  let operator: Signer
  operator = ethers.provider.getSigner()
  const name = "Quasi Staking"

  quasiStakingImpl = await (
      await ethers.getContractFactory("QuasiStaking", operator)
  ).deploy()
  await quasiStakingImpl.deployed();

  const quasiStakingInitData = quasiStakingImpl.interface.encodeFunctionData("initialize", [
      name,
      "0xf16bE3C010f0Ea801C3AEfcF20b1fd01b9Ead0B7",
      "0x38D0eac2e1d4D9285937E10ab7c41000768ff3A0",
      600,
      genesisNFTs,
      allianceNFTs
  ])
  quasiStaking = await (
      await ethers.getContractFactory("UpgradeProxy", operator)
  ).deploy(
      quasiStakingImpl.address,
      quasiStakingInitData
  )

  console.log(quasiStaking.address);
  console.log("Address:\n", quasiStakingImpl.address, "Data:\n", quasiStakingInitData);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });