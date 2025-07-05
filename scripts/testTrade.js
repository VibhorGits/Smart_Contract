const hre = require("hardhat");

async function main() {
  // Load environment variables (ensure PRIVATE_KEY is set in .env with Amoy MATIC)
  const [deployer] = await hre.ethers.getSigners(); // The account used for deployment (your PRIVATE_KEY)

  console.log("Interacting with EscrowTradeFactory using account:", deployer.address);

  // --- Configuration for the Test Trade ---
  const FACTORY_ADDRESS = "0xe30F3f2E54BdeAa2B11C68433A6DF5B7Ddeea2d3"; // <--- REPLACE with your ACTUAL deployed factory address
  const TEST_SELLER_ADDRESS = "0x432ca82afdf6139a32ca3571a3f5ad249de47995"; // <--- REPLACE with a test seller address (any valid Amoy address)
  const TEST_ARBITRATOR_ADDRESS = "0x073EeaDB82B8d7e0E83F1257E75B2930a4ca8e74"; // <--- REPLACE with a test arbitrator address (any valid Amoy address)
  const AMOUNT_TO_ESCROW_ETH = "0.001"; // Amount in ETH (e.g., 0.001 Amoy MATIC)

  // Get the EscrowTradeFactory contract instance
  const EscrowTradeFactory = await hre.ethers.getContractFactory("EscrowTradeFactory");
  const factory = EscrowTradeFactory.attach(FACTORY_ADDRESS); // Attach to the already deployed contract

  console.log(`\nAttempting to create a trade with ${AMOUNT_TO_ESCROW_ETH} ETH...`);
  console.log(`Seller: ${TEST_SELLER_ADDRESS}`);
  console.log(`Arbitrator: ${TEST_ARBITRATOR_ADDRESS}`);

  try {
    // Call the createTrade function on the factory
    // The buyer is msg.sender, which is the deployer account in this script
    const transactionResponse = await factory.createTrade(
      TEST_SELLER_ADDRESS,
      TEST_ARBITRATOR_ADDRESS,
      {
        value: hre.ethers.parseEther(AMOUNT_TO_ESCROW_ETH), // Convert ETH to Wei
        gasLimit: 500000 // Provide a gas limit for complex transactions if needed
      }
    );

    console.log("Transaction sent. Waiting for confirmation...");
    console.log("Transaction Hash:", transactionResponse.hash);

    const receipt = await transactionResponse.wait(); // Wait for the transaction to be mined

    console.log("Transaction confirmed!");
    console.log("Gas used:", receipt.gasUsed.toString());

    // Extract the new EscrowTrade contract address from the event
    // The TradeCreated event is emitted by the factory
    const tradeCreatedEvent = receipt.logs.find(log => factory.interface.parseLog(log)?.name === "TradeCreated");

    if (tradeCreatedEvent) {
      const parsedLog = factory.interface.parseLog(tradeCreatedEvent);
      const newEscrowAddress = parsedLog.args.escrowContractAddress;
      const tradeId = parsedLog.args.tradeId;
      console.log(`New EscrowTrade contract created at address: ${newEscrowAddress}`);
      console.log(`Trade ID: ${tradeId}`);
      console.log(`\nVerify the new EscrowTrade contract and its balance here:`);
      console.log(`https://amoy.polygonscan.com/address/${newEscrowAddress}`);
    } else {
      console.log("TradeCreated event not found in transaction receipt. New escrow address might not be logged.");
    }

  } catch (error) {
    console.error("Error creating trade:", error);
    // Log more details if it's a contract error
    if (error.reason) {
      console.error("Reason:", error.reason);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});