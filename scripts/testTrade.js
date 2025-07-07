// scripts/testTrade.js - FINAL VERSION

const hre = require("hardhat");

async function main() {
  const signers = await hre.ethers.getSigners();
  const requiredSigners = 3;

  if (signers.length < requiredSigners) {
    console.error(`Error: Script requires ${requiredSigners} configured accounts, but only found ${signers.length}.`);
    console.error("Please ensure PRIVATE_KEY, PRIVATE_KEY_VOTER_2, and PRIVATE_KEY_VOTER_3 are all set in your .env file.");
    return;
  }

  const deployer = signers[0];
  const voter2 = signers[1];
  const voter3 = signers[2];

  console.log("Using deployer/buyer account:", deployer.address);

  // --- Configuration ---
  const FACTORY_ADDRESS = "0x8619b66d5e3c2F62b4975d10b6806FBA21152B7e"; // <--- Make sure this is up to date
  const TEST_SELLER_ADDRESS = "0x432ca82afdf6139a32ca3571a3f5ad249de47995";
  const AMOUNT_TO_ESCROW_ETH = "0.001";
  
  // --- NEW: Define the Chief Arbitrator ---
  // For testing, we'll assign the deployer/buyer this role as well.
  // In a real dApp, this would be a separate, highly trusted address.
  const CHIEF_ARBITRATOR_ADDRESS = deployer.address;

  // Dynamically create the voter list from our configured signers
  const VOTER_ADDRESSES = [
    deployer.address,
    voter2.address,
    voter3.address
  ];

  const EscrowTradeFactory = await hre.ethers.getContractFactory("EscrowTradeFactory");
  const factory = EscrowTradeFactory.attach(FACTORY_ADDRESS);

  console.log(`\nAttempting to create a trade with ${AMOUNT_TO_ESCROW_ETH} ETH...`);
  console.log(`Seller: ${TEST_SELLER_ADDRESS}`);
  console.log(`Voters: ${VOTER_ADDRESSES.join(', ')}`);
  console.log(`Chief Arbitrator: ${CHIEF_ARBITRATOR_ADDRESS}`);

  try {
    // Pass the chief arbitrator address to the createTrade function
    const transactionResponse = await factory.createTrade(
      TEST_SELLER_ADDRESS,
      VOTER_ADDRESSES,
      CHIEF_ARBITRATOR_ADDRESS, // New argument
      {
        value: hre.ethers.parseEther(AMOUNT_TO_ESCROW_ETH),
        gasLimit: 1800000 
      }
    );

    console.log("Transaction sent. Waiting for confirmation...");
    const receipt = await transactionResponse.wait();
    const tradeCreatedEvent = receipt.logs.find(log => factory.interface.parseLog(log)?.name === "TradeCreated");

    if (tradeCreatedEvent) {
      const parsedLog = factory.interface.parseLog(tradeCreatedEvent);
      const newEscrowAddress = parsedLog.args.escrowContractAddress;
      console.log(`\n✅ New EscrowTrade contract created at address: ${newEscrowAddress}`);
    } else {
      console.error("TradeCreated event not found.");
    }

  } catch (error) {
    console.error("Error creating trade:", error.reason || error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});