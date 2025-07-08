// scripts/confirmTrade.js

const hre = require("hardhat");

async function main() {
    // --- Configuration ---
    const ESCROW_CONTRACT_ADDRESS = "0x433EF8fbF39f79f0bb71Bfae7873a81937Fe8FFA";

    const signers = await hre.ethers.getSigners();
    const sellerSigner = signers.find(s => s.address === "0x2c10135C7750Ea687392A9185c337733f285dF40"); // Find the seller's signer object

    if (!sellerSigner) {
        console.error("Error: Seller account not found in hardhat.config.js.");
        console.error("Please ensure the private key for the seller is configured.");
        return;
    }

    console.log(`Using seller account: ${sellerSigner.address}`);
    console.log(`Confirming trade for Escrow Contract: ${ESCROW_CONTRACT_ADDRESS}`);

    const EscrowTrade = await hre.ethers.getContractFactory("EscrowTrade");
    const escrowContract = EscrowTrade.attach(ESCROW_CONTRACT_ADDRESS);

    try {
        // Connect as the seller and call the confirmTradeDetails function
        const tx = await escrowContract.connect(sellerSigner).confirmTradeDetails({
            gasLimit: 500000
        });

        console.log("Transaction sent. Waiting for confirmation...");
        await tx.wait();

        console.log("\n✅ Trade confirmed by seller!");
        console.log("   The trade is now AWAITING_DELIVERY.");
        console.log(`   Transaction Hash: ${tx.hash}`);

    } catch (error) {
        console.error("\n❌ Error confirming trade:", error.reason || error.message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});