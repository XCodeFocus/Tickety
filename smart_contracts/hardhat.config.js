require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  defaultNetwork: "sepolia",
  solidity: "0.8.27",
  networks: {
    hardhat: {
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/490da61771b24797ab5aff58cd205bd1`,
      accounts: ["8f3cd6d651de9738080dc42e9edf7f86479530a974d975b45ccb5baf78ba9810"],
    }
  },
  mocha: {
    timeout: 40000
  }
};