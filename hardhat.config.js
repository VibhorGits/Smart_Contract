require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config(); // Ensure dotenv is loaded

// Load environment variables
const {
  PRIVATE_KEY,
  PRIVATE_KEY_VOTER_2,
  PRIVATE_KEY_VOTER_3,
  ALCHEMY_AMOY_URL,
  POLYGONSCAN_API_KEY
} = process.env;

// Create a list of accounts, filtering out any that are not set
const accounts = [
  PRIVATE_KEY,
  PRIVATE_KEY_VOTER_2,
  PRIVATE_KEY_VOTER_3,
].filter(Boolean); // .filter(Boolean) removes any undefined keys

if (accounts.length < 3) {
  console.warn("Warning: For full testing, please define PRIVATE_KEY, PRIVATE_KEY_VOTER_2, and PRIVATE_KEY_VOTER_3 in your .env file.");
}

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.19",
  networks: {
    amoy: {
      url: ALCHEMY_AMOY_URL,
      accounts: accounts,
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