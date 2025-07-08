// scripts/testTrade.js - UPDATED FOR SELLER CONFIRMATION

const hre = require("hardhat");

async function main() {
    const signers = await hre.ethers.getSigners();
    const requiredSigners = 3;

    if (signers.length < requiredSigners) {
        console.error(`Error: Script requires ${requiredSigners} accounts, but found ${signers.length}. Check your hardhat.config.js`);
        return;
    }

    const deployer = signers[0]; // Buyer
    const voter2 = signers[1];
    const voter3 = signers[2];

    console.log("Using deployer/buyer account:", deployer.address);

    // --- Configuration ---
    const FACTORY_ADDRESS = "0xcb079EFDE8F38cf6260eEc88eAD7b7F6AE053aAE"; // <-- IMPORTANT: Update this
    const TEST_SELLER_ADDRESS = "0x2c10135C7750Ea687392A9185c337733f285dF40";
    const CHIEF_ARBITRATOR_ADDRESS = deployer.address; // For testing simplicity

    // --- NEW: Define Trade Details ---
    const tradeDetails = {
        item: "10x High-Quality Graphics Cards",
        units: 10,
        pricePerUnit: hre.ethers.parseEther("0.1") // Price per card is 0.01 ETH
    };

    // --- NEW: Calculate Total Amount ---
    const totalAmount = BigInt(tradeDetails.units) * tradeDetails.pricePerUnit;

    const VOTER_ADDRESSES = [deployer.address, voter2.address, voter3.address];

    const EscrowTradeFactory = await hre.ethers.getContractFactory("EscrowTradeFactory");
    const factory = EscrowTradeFactory.attach(FACTORY_ADDRESS);

    console.log(`\nAttempting to create a trade for: "${tradeDetails.item}"`);
    console.log(`Total Value: ${hre.ethers.formatEther(totalAmount)} ETH`);

    try {
        const transactionResponse = await factory.createTrade(
            TEST_SELLER_ADDRESS,
            tradeDetails, // Pass the struct
            VOTER_ADDRESSES,
            CHIEF_ARBITRATOR_ADDRESS,
            {
                value: totalAmount, // Send the calculated amount
                gasLimit: 20000000
            }
        );

        console.log("Transaction sent. Waiting for confirmation...");
        const receipt = await transactionResponse.wait();
        const tradeCreatedEvent = receipt.logs.find(log => factory.interface.parseLog(log)?.name === "TradeCreated");

        if (tradeCreatedEvent) {
            const parsedLog = factory.interface.parseLog(tradeCreatedEvent);
            const newEscrowAddress = parsedLog.args.escrowContractAddress;
            console.log(`\n✅ New EscrowTrade contract created at address: ${newEscrowAddress}`);
            console.log("   The trade is now AWAITING_SELLER_CONFIRMATION.");
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