const hre = require("hardhat");

async function main() {
  // Get the EscrowTradeFactory contract factory
  const EscrowTradeFactory = await hre.ethers.getContractFactory("EscrowTradeFactory");

  console.log("Deploying EscrowTradeFactory...");

  // Deploy the factory contract
  const escrowTradeFactory = await EscrowTradeFactory.deploy();

  await escrowTradeFactory.waitForDeployment();

  const factoryAddress = await escrowTradeFactory.getAddress();

  console.log(`EscrowTradeFactory deployed to: ${factoryAddress}`);

  // You'll need this address in your frontend/backend
  console.log(`\nTo verify your contract on Polygonscan, run:`);
  console.log(`npx hardhat verify --network amoy ${factoryAddress}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});