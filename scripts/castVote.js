// scripts/castVote.js

const hre = require("hardhat");

async function main() {
  const ESCROW_CONTRACT_ADDRESS = "0x6b63c80BDA97b2E696c22bb93F31810f86879c51";
  const signers = await hre.ethers.getSigners();
  const requiredSigners = 3; // We expect the buyer + 2 other voters

  // --- NEW: Better Error Checking ---
  if (signers.length < requiredSigners) {
    console.error(`Error: Script requires ${requiredSigners} configured accounts, but only found ${signers.length}.`);
    console.error("Please ensure PRIVATE_KEY, PRIVATE_KEY_VOTER_2, and PRIVATE_KEY_VOTER_3 are all set in your .env file.");
    return; // Exit the script gracefully
  }

  const VOTER_SIGNERS = signers.slice(0, requiredSigners);

  console.log(`Voting on Escrow Contract: ${ESCROW_CONTRACT_ADDRESS}`);

  const EscrowTrade = await hre.ethers.getContractFactory("EscrowTrade");
  const escrowContract = EscrowTrade.attach(ESCROW_CONTRACT_ADDRESS);

  const votingPromises = [];

  for (const voterSigner of VOTER_SIGNERS) {
    const voteForBuyer = Math.random() < 0.5;
    const voteDescription = voteForBuyer ? "REFUND BUYER" : "PAY SELLER";
    console.log(`- Preparing vote from ${voterSigner.address} for: ${voteDescription}`);

    const promise = escrowContract.connect(voterSigner).castVote(voteForBuyer, { gasLimit: 500000 })
      .then(tx => tx.wait())
      .then(() => console.log(`  ✅ Vote cast by ${voterSigner.address}`));
    
    votingPromises.push(promise);
  }

  try {
    console.log("\nSending all votes...");
    await Promise.all(votingPromises);
    console.log("\nAll votes have been successfully cast!");
  } catch (error) {
     console.error("\n❌ An error occurred during voting:", error.reason || error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});