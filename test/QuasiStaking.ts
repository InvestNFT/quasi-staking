import { expect, use } from "chai"
import { ethers, network } from "hardhat"
import { Contract, Signer, BigNumber } from "ethers"
import { fastforward } from './utils/network';
import { solidity } from "ethereum-waffle";

use(solidity);

describe("Quasi Staking", function() {
  let operator: Signer, operatorAddr: string
  let userA: Signer, userAAddr: string
  let userB: Signer, userBAddr: string

  // Contracts
  let bcnt: Contract
  let quasiStakingImpl: Contract, quasiStakingImplV2: Contract
  let quasiStaking: Contract
  let ERC721GenesisA: Contract, ERC721GenesisB: Contract, ERC721GenesisC: Contract
  let ERC721AllianceA: Contract, ERC721AllianceB: Contract, ERC721AllianceC: Contract

  const MAX_INT = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"

  const zeroAddress = "0x0000000000000000000000000000000000000000"
  
  before(async () => {
    await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: ["0xDa2f56143BC88F1eA76986E5b14b7B7fC78E8971"],
    });
    await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: ["0xf16bE3C010f0Ea801C3AEfcF20b1fd01b9Ead0B7"],
    });
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0xEEb991702e3472166da495B22F3349A7A3aa638a"],
  });
    await network.provider.send("hardhat_setBalance", [
      "0xDa2f56143BC88F1eA76986E5b14b7B7fC78E8971",
      "0x1000000000000000000",
    ]);
    await network.provider.send("hardhat_setBalance", [
      "0xf16bE3C010f0Ea801C3AEfcF20b1fd01b9Ead0B7",
      "0x1000000000000000000",
    ]);
    await network.provider.send("hardhat_setBalance", [
      "0xEEb991702e3472166da495B22F3349A7A3aa638a",
      "0x1000000000000000000",
    ]);
    operator = await ethers.getSigner("0xDa2f56143BC88F1eA76986E5b14b7B7fC78E8971");
    userA = await ethers.getSigner("0xf16bE3C010f0Ea801C3AEfcF20b1fd01b9Ead0B7");
    userB = await ethers.getSigner("0xEEb991702e3472166da495B22F3349A7A3aa638a");
    operatorAddr = "0xDa2f56143BC88F1eA76986E5b14b7B7fC78E8971";
    userAAddr = "0xf16bE3C010f0Ea801C3AEfcF20b1fd01b9Ead0B7";
    userBAddr = "0xEEb991702e3472166da495B22F3349A7A3aa638a";

    const decimal = 18
    const initSupply = ethers.utils.parseUnits("10000000")

    bcnt = await (
        await ethers.getContractFactory("mintersBEP2EToken", operator)
    ).deploy("BCNT", "BCNT", decimal, initSupply)

    const contractURI = "ipfs://QmYnjGeLbBhfDM8Y11F5hVMDdGQz91dFCroHT8eiygnXxC/contract.json"
    const blindBoxURI = "ipfs://QmX5CnSJjtunPUp67DwVYUBgPYR2PB18M6riqPa3verc721Up/"
    const metadataURI = ""

    ERC721GenesisA = await (
        await ethers.getContractFactory("stubERC721", operator)
    ).deploy(contractURI, blindBoxURI, metadataURI);

    ERC721GenesisB = await (
        await ethers.getContractFactory("stubERC721", operator)
    ).deploy(contractURI, blindBoxURI, metadataURI);

    ERC721GenesisC = await (
        await ethers.getContractFactory("stubERC721", operator)
    ).deploy(contractURI, blindBoxURI, metadataURI);

    ERC721AllianceA = await (
        await ethers.getContractFactory("stubERC721", operator)
    ).deploy(contractURI, blindBoxURI, metadataURI);

    ERC721AllianceB = await (
        await ethers.getContractFactory("stubERC721", operator)
    ).deploy(contractURI, blindBoxURI, metadataURI);

    ERC721AllianceC = await (
        await ethers.getContractFactory("stubERC721", operator)
    ).deploy(contractURI, blindBoxURI, metadataURI);

    const quasiStakingName = "Quasi Staking"
    quasiStakingImpl = await (
        await ethers.getContractFactory("QuasiStaking", operator)
    ).deploy()

    const quasiStakingInitData = quasiStakingImpl.interface.encodeFunctionData("initialize", [
        quasiStakingName,
        operatorAddr,
        bcnt.address,
        600,
        [ERC721GenesisA.address, ERC721GenesisB.address, ERC721GenesisC.address],
        [ERC721AllianceA.address, ERC721AllianceB.address, ERC721AllianceC.address]
    ])
    quasiStaking = await (
        await ethers.getContractFactory("UpgradeProxy", operator)
    ).deploy(
        quasiStakingImpl.address,
        quasiStakingInitData
    )
    quasiStaking = quasiStakingImpl.attach(quasiStaking.address)
    expect(await quasiStaking.callStatic.implementation()).to.equal(quasiStakingImpl.address)
    expect(await quasiStaking.callStatic.name()).to.equal(quasiStakingName)
    expect(await quasiStaking.callStatic.rewardsToken()).to.equal(bcnt.address)
    expect(await quasiStaking.callStatic.operator()).to.equal(operatorAddr)
  })

  it("Should not re-initialize", async () => {
    const quasiStakingName = "Quasi Staking"
    await expect(quasiStaking.connect(userA).initialize(
      quasiStakingName,
      operatorAddr,
      bcnt.address,
      600,
      [ERC721GenesisA.address, ERC721GenesisB.address, ERC721GenesisC.address],
      [ERC721AllianceA.address, ERC721AllianceB.address, ERC721AllianceC.address]
    )).to.be.revertedWith("Already initialized")
  })

  it("Should not upgrade by non-owner", async () => {
    await expect(quasiStaking.connect(userA).upgradeTo(
        bcnt.address
    )).to.be.revertedWith("Only the contract owner may perform this action")
  })

  it("Should be able to upgrade", async () => {
    quasiStakingImplV2 = await (
        await ethers.getContractFactory("QuasiStaking", operator)
    ).deploy()

    await quasiStaking.connect(operator).upgradeTo(
      quasiStakingImplV2.address
    )

    quasiStaking = quasiStakingImplV2.attach(quasiStaking.address);
  })

  it("NFT should be able to mint", async () => {
    const price = ethers.utils.parseUnits("0.1")
    const triPrice = ethers.utils.parseUnits("0.3")

    await ERC721GenesisC.connect(operator).mint(1, { value: price })

    await ERC721AllianceA.connect(operator).mint(1, { value: price })
    await ERC721AllianceB.connect(operator).mint(1, { value: price })

    await ERC721GenesisA.connect(userA).mint(1, { value: price })
    await ERC721GenesisB.connect(userA).mint(1, { value: price })
    await ERC721GenesisC.connect(userA).mint(1, { value: price })

    await ERC721AllianceA.connect(userA).mint(1, { value: price })
    await ERC721AllianceB.connect(userA).mint(1, { value: price })
    await ERC721AllianceC.connect(userA).mint(1, { value: price })

    await ERC721AllianceA.connect(userB).mint(1, { value: price })
    await ERC721AllianceB.connect(userB).mint(1, { value: price })
    await ERC721AllianceC.connect(userB).mint(3, { value: triPrice })
  })

  it("Should be able to register", async () => {
    const price = ethers.utils.parseUnits("0.1")

    await quasiStaking.connect(operator).batchRegister([ERC721AllianceA.address, ERC721AllianceB.address], [1,1])

    await quasiStaking.connect(userA).batchRegister([ERC721AllianceA.address, ERC721AllianceB.address, ERC721AllianceC.address], [2, 2, 1])

    await expect(quasiStaking.connect(userB).batchRegister([ERC721AllianceA.address, ERC721AllianceB.address, ERC721AllianceC.address], [3, 3, 2])).to.be.revertedWith("You should own the genesis NFT")

    await ERC721GenesisA.connect(userB).mint(1, { value: price })
  })

  it("Rewards should be distributed", async () => {
    const distirbutionAmount = ethers.utils.parseUnits("657000");

    await quasiStaking.connect(operator).addDistribution(31536000, distirbutionAmount)

    const lastDistributionsIndex = await quasiStaking.lastDistributionsIndex()
    const distirbutionData = await quasiStaking.getDistributionData(lastDistributionsIndex)

    expect(distirbutionData[1] -distirbutionData[0] ).to.equal(31536000)
    expect(distirbutionData[2]).to.equal(distirbutionAmount)

    await fastforward(3600 * 24 * 30)

    expect(await quasiStaking.rewardsUnpaid(ERC721AllianceA.address, 1)).to.gte(ethers.utils.parseUnits("90"));
    expect(await quasiStaking.batchRewardsUnpaid([ERC721AllianceA.address, ERC721AllianceB.address], [1, 1])).to.gte(ethers.utils.parseUnits("180"));

    await quasiStaking.connect(userB).batchRegister([ERC721AllianceA.address, ERC721AllianceB.address, ERC721AllianceC.address], [3, 3, 2]);

    await fastforward(3600 * 24 * 30)

    await ERC721GenesisA.connect(userB).transferFrom(userBAddr, userAAddr, 2);

    await expect(quasiStaking.connect(userB).batchRegister([ERC721AllianceC.address, ERC721AllianceC.address], [3, 4])).to.be.revertedWith("You should own the genesis NFT");

    await ERC721GenesisA.connect(userA).transferFrom(userAAddr, userBAddr, 2);

    await quasiStaking.connect(userB).batchRegister([ERC721AllianceC.address, ERC721AllianceC.address], [3, 4]);

    expect(await quasiStaking.batchRewardsUnpaid([ERC721AllianceA.address, ERC721AllianceB.address, ERC721AllianceC.address], [3, 3, 2])).to.gte(ethers.utils.parseUnits("270"));

    await fastforward(3600 * 24 * 30)

    expect(await quasiStaking.batchRewardsUnpaid([ERC721AllianceA.address, ERC721AllianceB.address], [1, 1])).to.gte(ethers.utils.parseUnits("540"));
  })

  it("Rewards should be claimed", async () => {
    await bcnt.connect(operator).transfer(quasiStaking.address, ethers.utils.parseUnits("657000"));

    expect(await quasiStaking.batchRewardsUnpaid([ERC721AllianceA.address, ERC721AllianceB.address, ERC721AllianceC.address], [2, 2, 1])).to.gte(ethers.utils.parseUnits("810"))
    await quasiStaking.connect(userA).batchGetRewards([ERC721AllianceA.address, ERC721AllianceB.address, ERC721AllianceC.address], [2, 2, 1])
    expect(await quasiStaking.batchRewardsUnpaid([ERC721AllianceA.address, ERC721AllianceB.address, ERC721AllianceC.address], [2, 2, 1])).to.eq(ethers.utils.parseUnits("0"))

    await fastforward(3600 * 24 * 30)

    expect(await quasiStaking.batchRewardsUnpaid([ERC721AllianceA.address, ERC721AllianceB.address, ERC721AllianceC.address], [3, 3, 2])).to.gte(ethers.utils.parseUnits("810"))
    await quasiStaking.connect(userB).batchGetRewards([ERC721AllianceA.address, ERC721AllianceB.address, ERC721AllianceC.address], [3, 3, 2])
    expect(await quasiStaking.batchRewardsUnpaid([ERC721AllianceA.address, ERC721AllianceB.address, ERC721AllianceC.address], [3, 3, 2])).to.eq(ethers.utils.parseUnits("0"))

    const lastDistributionsIndex = await quasiStaking.lastDistributionsIndex()
    expect(await quasiStaking.rewardsPaidTotal(lastDistributionsIndex)).to.gte(ethers.utils.parseUnits("1620"))

    await expect(quasiStaking.connect(operator).settleRewardsToken()).to.be.revertedWith("Distribution is active");

    await fastforward(3600 * 24 * 300)

    expect(await quasiStaking.batchRewardsUnpaid([ERC721AllianceA.address, ERC721AllianceB.address], [1, 1])).to.eq(ethers.utils.parseUnits("2190"))
    await quasiStaking.connect(operator).batchGetRewards([ERC721AllianceA.address, ERC721AllianceB.address], [1, 1])
    expect(await quasiStaking.batchRewardsUnpaid([ERC721AllianceA.address, ERC721AllianceB.address], [1, 1])).to.eq(ethers.utils.parseUnits("0"))
    expect(await quasiStaking.rewardsPaidTotal(lastDistributionsIndex)).to.gte(ethers.utils.parseUnits("3810"))

    await quasiStaking.connect(userA).batchGetRewards([ERC721AllianceA.address, ERC721AllianceB.address, ERC721AllianceC.address], [2, 2, 1])
    await quasiStaking.connect(userB).batchGetRewards([ERC721AllianceA.address, ERC721AllianceB.address, ERC721AllianceC.address, ERC721AllianceC.address, ERC721AllianceC.address], [3, 3, 2, 3, 4])

    expect(await quasiStaking.batchRewardsUnpaid([ERC721AllianceA.address, ERC721AllianceB.address, ERC721AllianceC.address], [2, 2, 1])).to.eq(ethers.utils.parseUnits("0"))
    expect(await quasiStaking.batchRewardsUnpaid([ERC721AllianceA.address, ERC721AllianceB.address, ERC721AllianceC.address], [3, 3, 2])).to.eq(ethers.utils.parseUnits("0"))

    expect(await quasiStaking.rewardsPaidTotal(lastDistributionsIndex)).to.lte(ethers.utils.parseUnits("10320"))
  })

  it("Should be settled", async () => {
    const quasiStakingRewardsTokenAmountBefore = await bcnt.balanceOf(quasiStaking.address);
    const operatorRewardsTokenAmountBefore = await bcnt.balanceOf(operatorAddr);

    await quasiStaking.connect(operator).settleRewardsToken();

    const quasiStakingRewardsTokenAmountAfter = await bcnt.balanceOf(quasiStaking.address);
    const operatorRewardsTokenAmountAfter = await bcnt.balanceOf(operatorAddr);

    expect(quasiStakingRewardsTokenAmountAfter).to.eq(0)
    expect(BigNumber.from(operatorRewardsTokenAmountAfter).sub(quasiStakingRewardsTokenAmountBefore)).to.eq(operatorRewardsTokenAmountBefore)
  })
})
