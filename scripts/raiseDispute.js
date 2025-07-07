// scripts/raiseDispute.js

const hre = require("hardhat");

async function main() {
  // --- Configuration ---
  // !!! IMPORTANT: Replace this with the address of an EscrowTrade contract
  // that is still in the 'AWAITING_DELIVERY' state.
  const ESCROW_CONTRACT_ADDRESS = "0x6b63c80BDA97b2E696c22bb93F31810f86879c51"; 

  // The buyer is the account that created the trade.
  const [buyer] = await hre.ethers.getSigners();

  console.log("Using account:", buyer.address, "to raise a dispute...");
  console.log("Escrow Contract:", ESCROW_CONTRACT_ADDRESS);

  // Get the contract factory to interact with it
  const EscrowTrade = await hre.ethers.getContractFactory("EscrowTrade");
  const escrowContract = EscrowTrade.attach(ESCROW_CONTRACT_ADDRESS);

  try {
    // Check the state before raising the dispute
    let currentState = await escrowContract.currentState();
    if (Number(currentState) !== 0) { // 0 is AWAITING_DELIVERY
        console.error("❌ Error: Contract is not in 'AWAITING_DELIVERY' state. Cannot raise a dispute.");
        return;
    }

    console.log("\nAttempting to call raiseDispute()...");
    
    // Call the raiseDispute function from the buyer's account
    const tx = await escrowContract.connect(buyer).raiseDispute({
        gasLimit: 500000 // Optional: Set a gas limit
    });

    console.log("Transaction sent. Waiting for confirmation...");
    console.log("Transaction Hash:", tx.hash);

    // Wait for the transaction to be mined
    await tx.wait();

    console.log("\n✅ Dispute raised successfully!");
    
    // --- Verify the new state ---
    currentState = await escrowContract.currentState();
    console.log("New contract state is: DISPUTED (" + Number(currentState) + ")");
    
    console.log("\nCheck the transaction details on the explorer:");
    console.log(`https://amoy.polygonscan.com/tx/${tx.hash}`);

  } catch (error) {
    console.error("\n❌ Error raising dispute:", error.reason || error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});