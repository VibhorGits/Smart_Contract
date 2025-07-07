// scripts/checkState.js

const hre = require("hardhat");

async function main() {
  // --- Configuration ---
  // !!! IMPORTANT: Replace this with the address of the EscrowTrade contract
  // you want to check.
  const ESCROW_CONTRACT_ADDRESS = "0x6b63c80BDA97b2E696c22bb93F31810f86879c51"; 

  console.log(`Checking status for Escrow Contract: ${ESCROW_CONTRACT_ADDRESS}\n`);

  // Get the contract factory to interact with the EscrowTrade contract
  const EscrowTrade = await hre.ethers.getContractFactory("EscrowTrade");
  const escrowContract = EscrowTrade.attach(ESCROW_CONTRACT_ADDRESS);

  // Define the human-readable states corresponding to the enum in the contract
  const states = ["AWAITING_DELIVERY", "COMPLETE", "DISPUTED"];

  try {
    // Call the getTradeDetails() view function
    const details = await escrowContract.getTradeDetails();
    
    const buyer = details[0];
    const seller = details[1];
    const amount = details[2];
    const stateIndex = Number(details[3]); // Convert BigInt to Number for array index

    console.log("---------- Trade Details ----------");
    console.log(`  - Buyer:     ${buyer}`);
    console.log(`  - Seller:    ${seller}`);
    console.log(`  - Amount:    ${hre.ethers.formatEther(amount)} ETH`);
    console.log(`  - Status:    ${states[stateIndex]} (${stateIndex})`);
    console.log("-----------------------------------");

  } catch (error) {
    console.error("\n❌ Error fetching trade details:", error.reason || error.message);
    console.error("Please ensure the contract address is correct and it has been deployed to the 'amoy' network.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});