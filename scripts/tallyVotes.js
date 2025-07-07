// scripts/tallyVotes.js

const hre = require("hardhat");

async function main() {
  // --- Configuration ---
  const ESCROW_CONTRACT_ADDRESS = "0x6b63c80BDA97b2E696c22bb93F31810f86879c51";

  const [caller] = await hre.ethers.getSigners();
  
  console.log(`Using account: ${caller.address} to tally votes...`);
  console.log(`On Escrow Contract: ${ESCROW_CONTRACT_ADDRESS}`);

  const EscrowTrade = await hre.ethers.getContractFactory("EscrowTrade");
  const escrowContract = EscrowTrade.attach(ESCROW_CONTRACT_ADDRESS);
  
  const states = ["AWAITING_DELIVERY", "COMPLETE", "DISPUTED", "AWAITING_PHASE_2"];

  try {
    console.log("\nAttempting to call tallyVotesAndResolve()...");
    
    const tx = await escrowContract.tallyVotesAndResolve({ gasLimit: 500000 });

    console.log("Transaction sent. Waiting for confirmation...");
    const receipt = await tx.wait();
    console.log("✅ Tally transaction confirmed!");

    // Check for our custom events to see the outcome
    const resolvedEvent = receipt.logs.find(log => escrowContract.interface.parseLog(log)?.name === "DisputeResolved");
    const escalatedEvent = receipt.logs.find(log => escrowContract.interface.parseLog(log)?.name === "DisputeEscalatedToPhase2");

    if (resolvedEvent) {
        const args = escrowContract.interface.parseLog(resolvedEvent).args;
        console.log("\n--- Dispute Resolved ---");
        console.log(`Winner: ${args.winner}`);
        console.log(`Refunded Buyer: ${args.refundedBuyer}`);
    } else if (escalatedEvent) {
        console.log("\n--- Dispute Escalated ---");
        console.log("The vote margin was too close. Escalated to Phase 2.");
    }

    const finalState = await escrowContract.currentState();
    console.log(`\nFinal contract state: ${states[Number(finalState)]}`);


  } catch (error) {
    console.error("\n❌ Error tallying votes:", error.reason || error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});