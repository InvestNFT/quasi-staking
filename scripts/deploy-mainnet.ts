import { ethers } from "hardhat"
import { Contract, Signer } from "ethers"
import { genesisNFTs, allianceNFTs } from './args/NFTList';

async function main() {
  let quasiStakingImpl: Contract, quasiStaking: Contract, bcnt: Contract
  let operator: Signer
  operator = ethers.provider.getSigner()
  const name = "Quasi Staking"
  const operatorAddr = "0x8B243DC87Fb34bD1bC5491FD08B730FAdAc88756"
  const BCNT = "0x9669890e48f330ACD88b78D63E1A6b3482652CD9"
  quasiStakingImpl = await (
      await ethers.getContractFactory("QuasiStaking", operator)
  ).deploy()
  await quasiStakingImpl.deployed();

  const quasiStakingInitData = quasiStakingImpl.interface.encodeFunctionData("initialize", [
      name,
      operatorAddr,
      BCNT,
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