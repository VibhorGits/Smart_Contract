// scripts/checkState.js - REFACTORED

const hre = require("hardhat");

async function main() {
    // --- Configuration ---
    const ESCROW_CONTRACT_ADDRESS = "0x433EF8fbF39f79f0bb71Bfae7873a81937Fe8FFA";

    console.log(`Checking status for Escrow Contract: ${ESCROW_CONTRACT_ADDRESS}\n`);

    const EscrowTrade = await hre.ethers.getContractFactory("EscrowTrade");
    const escrowContract = EscrowTrade.attach(ESCROW_CONTRACT_ADDRESS);

    // --- UPDATED: New states array to match the smart contract enum ---
    const states = [
        "AWAITING_SELLER_CONFIRMATION",
        "AWAITING_DELIVERY",
        "COMPLETE",
        "DISPUTED",
        "AWAITING_PHASE_2"
    ];

    try {
        // --- UPDATED: The getTradeDetails() function now returns more data ---
        // Note: You may need to add this updated getTradeDetails function to your contract
        // if it was removed in a previous step.
        const [
            buyer,
            seller,
            amount,
            stateIndex,
            tradeDetails, // The struct itself
            votesForBuyer,
            votesForSeller,
            chiefArbitrator
        ] = await escrowContract.getTradeDetails();

        console.log("---------- Trade Details ----------");
        console.log(`  - Status:         ${states[Number(stateIndex)]} (${Number(stateIndex)})`);
        console.log(`  - Buyer:          ${buyer}`);
        console.log(`  - Seller:         ${seller}`);
        console.log(`  - Chief Arbitrator: ${chiefArbitrator}`);
        console.log("-----------------------------------");

        console.log("\n---------- Item Details -----------");
        console.log(`  - Item:           ${tradeDetails.item}`);
        console.log(`  - Units:          ${tradeDetails.units.toString()}`);
        console.log(`  - Price per Unit: ${hre.ethers.formatEther(tradeDetails.pricePerUnit)} ETH`);
        console.log(`  - Total Value:    ${hre.ethers.formatEther(amount)} ETH`);
        console.log("-----------------------------------");


        // Only show voting details if the dispute has started
        if (Number(stateIndex) >= states.indexOf("DISPUTED")) {
            console.log("\n---------- Voting Details ---------");
            console.log(`  - Votes for Buyer:  ${votesForBuyer.toString()}`);
            console.log(`  - Votes for Seller: ${votesForSeller.toString()}`);
            console.log("-----------------------------------");
        }

    } catch (error) {
        console.error("\n❌ Error fetching trade details:", error.reason || error.message);
        console.error("Please ensure the contract address is correct and it has been deployed to the 'amoy' network.");
        console.error("You may also need to add the updated getTradeDetails() function to your EscrowTrade.sol contract.");
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});