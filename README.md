-----

# TrustTrade dApp - Execution Guide

This guide walks you through the entire trade lifecycle simulation, from initial creation to dispute resolution, using the provided project scripts.

-----

## Step 1: Project Setup

To get started, follow these steps:

1.  **Clone the repository and navigate:**

    ```bash
    git clone <your-repository-url> # Replace with your actual repository URL
    cd escrow-dapp # Assuming 'escrow-dapp' is your Hardhat project directory
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up environment variables:** Create a `.env` file in your project's root directory and populate it with your private keys and Alchemy URL.

4.  **Compile contracts:**

    ```bash
    npx hardhat compile
    ```

5.  **Deploy the Factory Contract:**

    ```bash
    npx hardhat run scripts/deploy.js --network amoy
    ```

6.  **Update Factory Address:** After deployment, copy the deployed factory address from the console output. Then, paste this address into the `FACTORY_ADDRESS` constant within `scripts/testTrade.js`.

-----

## Step 2: Running a Trade Lifecycle

Now that your project is set up, you can simulate a full trade lifecycle:

1.  **Create a new trade:**

    ```bash
    npx hardhat run scripts/testTrade.js --network amoy
    ```

    **Important:** Copy the newly generated `EscrowTrade` contract address from the console output. You'll need it for the subsequent steps.

2.  **Seller confirms the trade:**
    Paste the `EscrowTrade` contract address (copied in the previous step) into `scripts/confirmTrade.js` before running:

    ```bash
    npx hardhat run scripts/confirmTrade.js --network amoy
    ```

3.  **Buyer raises a dispute:**
    Paste the `EscrowTrade` contract address into `scripts/raiseDispute.js` before running:

    ```bash
    npx hardhat run scripts/raiseDispute.js --network amoy
    ```

4.  **Community voters cast their votes (Phase 1):**
    Paste the `EscrowTrade` contract address into `scripts/castVote.js` before running:

    ```bash
    npx hardhat run scripts/castVote.js --network amoy
    ```

5.  **Tally the votes:**
    Paste the `EscrowTrade` contract address into `scripts/tallyVotes.js` before running:

    ```bash
    npx hardhat run scripts/tallyVotes.js --network amoy
    ```

6.  **Resolve the dispute via the Chief Arbitrator (Phase 2):**
    *This step is only necessary if the vote tallying (previous step) resulted in an escalation.*
    Paste the `EscrowTrade` contract address into `scripts/resolvePhase2.js` before running:

    ```bash
    npx hardhat run scripts/resolvePhase2.js --network amoy
    ```
