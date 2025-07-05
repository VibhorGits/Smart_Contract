require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config(); // Ensure dotenv is loaded

// Load environment variables
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ALCHEMY_AMOY_URL = process.env.ALCHEMY_AMOY_URL;
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY;

// Optional: Add basic checks for critical environment variables
if (!PRIVATE_KEY) {
  console.error("Error: PRIVATE_KEY is not set in .env");
  process.exit(1);
}
if (!ALCHEMY_AMOY_URL) {
  console.error("Error: ALCHEMY_AMOY_URL is not set in .env");
  process.exit(1);
}
if (!POLYGONSCAN_API_KEY) {
  console.error("Error: POLYGONSCAN_API_KEY is not set in .env. Verification may fail.");
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.19",
  networks: {
    amoy: {
      url: ALCHEMY_AMOY_URL,
      accounts: [PRIVATE_KEY],
      chainId: 80002, // Chain ID for Polygon Amoy
    },
  },
  etherscan: {
    // --- IMPORTANT CHANGE HERE ---
    // Specify the Etherscan V2 API key at the top level
    apiKey: POLYGONSCAN_API_KEY, // <--- Use the single API key here
    
    customChains: [
      {
        network: "polygonAmoy", // This name is used with --network flag
        chainId: 80002, // Polygon Amoy Chain ID
        urls: {
          // --- IMPORTANT CHANGE HERE ---
          // Use the new Etherscan V2 API base URL without the chainid parameter
          // Hardhat-verify will now automatically append the chainid based on the chainId config
          apiURL: "https://api.etherscan.io/v2/api?chainid=80002",
          browserURL: "https://amoy.polygonscan.com/",
        },
      },
    ],
  },
};