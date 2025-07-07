// scripts/resolvePhase2.js

const hre = require("hardhat");

async function main() {
  // --- Configuration ---
  const ESCROW_CONTRACT_ADDRESS = "0x6b63c80BDA97b2E696c22bb93F31810f86879c51";
  
  // The Chief Arbitrator's final decision
  // Set to `true` to refund the buyer, `false` to pay the seller.
  const REFUND_BUYER = true; 

  // For testing, we designated the first account as the Chief Arbitrator
  const [chiefArbitrator] = await hre.ethers.getSigners();

  console.log(`Using Chief Arbitrator account: ${chiefArbitrator.address}`);
  console.log(`Resolving dispute for Escrow Contract: ${ESCROW_CONTRACT_ADDRESS}`);

  const EscrowTrade = await hre.ethers.getContractFactory("EscrowTrade");
  const escrowContract = EscrowTrade.attach(ESCROW_CONTRACT_ADDRESS);

  try {
    const decision = REFUND_BUYER ? "REFUND BUYER" : "PAY SELLER";
    console.log(`\nAttempting to resolve dispute with final decision: ${decision}`);

    // Connect as the arbitrator and call the resolvePhase2Dispute function
    const tx = await escrowContract.connect(chiefArbitrator).resolvePhase2Dispute(REFUND_BUYER, {
        gasLimit: 500000
    });

    console.log("Transaction sent. Waiting for confirmation...");
    const receipt = await tx.wait();
    console.log("✅ Dispute resolved successfully via Phase 2!");

    // Check for the event to confirm the outcome
    const resolvedEvent = receipt.logs.find(log => escrowContract.interface.parseLog(log)?.name === "DisputeResolved");
    if (resolvedEvent) {
        const args = escrowContract.interface.parseLog(resolvedEvent).args;
        console.log("\n--- Final Outcome ---");
        console.log(`Winner: ${args.winner}`);
    }
    
    console.log(`\nTransaction Hash: ${tx.hash}`);

  } catch (error) {
    console.error("\n❌ Error resolving Phase 2 dispute:", error.reason || error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});