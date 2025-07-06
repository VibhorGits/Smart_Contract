// scripts/confirmDelivery.js

const hre = require("hardhat");

async function main() {
  // --- Configuration ---
  // !!! IMPORTANT: Replace this with the actual address of the EscrowTrade
  // contract that was created by the testTrade.js script.
  const ESCROW_CONTRACT_ADDRESS = "0x9e4bF1f8805DF5165A753A971b98631882377be8"; 

  // The buyer is the account that created the trade.
  // In our case, it's the deployer account from the hardhat config.
  const [buyer] = await hre.ethers.getSigners();

  console.log("Using account:", buyer.address, "to confirm delivery...");
  console.log("Escrow Contract:", ESCROW_CONTRACT_ADDRESS);

  // Get the contract factory for EscrowTrade to interact with it
  const EscrowTrade = await hre.ethers.getContractFactory("EscrowTrade");
  const escrowContract = EscrowTrade.attach(ESCROW_CONTRACT_ADDRESS);

  // --- Check Seller's Balance Before ---
  const tradeDetails = await escrowContract.getTradeDetails();
  const sellerAddress = tradeDetails[1]; // Index 1 is the seller address
  const provider = hre.ethers.provider;
  
  const balanceBefore = await provider.getBalance(sellerAddress);
  console.log(`\nSeller (${sellerAddress}) balance before: ${hre.ethers.formatEther(balanceBefore)} ETH`);
  
  try {
    console.log("Attempting to call confirmDelivery()...");
    
    // Call the confirmDelivery function from the buyer's account
    const tx = await escrowContract.connect(buyer).confirmDelivery({
        gasLimit: 500000 // Optional: Set a gas limit
    });

    console.log("Transaction sent. Waiting for confirmation...");
    console.log("Transaction Hash:", tx.hash);

    // Wait for the transaction to be mined
    await tx.wait();

    console.log("\n✅ Delivery confirmed successfully!");
    
    // --- Check Seller's Balance After ---
    const balanceAfter = await provider.getBalance(sellerAddress);
    console.log(`Seller (${sellerAddress}) balance after: ${hre.ethers.formatEther(balanceAfter)} ETH`);
    
    console.log("\nCheck the transaction details on the explorer:");
    console.log(`https://amoy.polygonscan.com/tx/${tx.hash}`);

  } catch (error) {
    console.error("\n❌ Error confirming delivery:", error.reason || error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});