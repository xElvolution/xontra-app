import "@nomicfoundation/hardhat-toolbox";

export default {
  solidity: {
    compilers: [
      { version: "0.4.18", settings: { optimizer: { enabled: true, runs: 200 } } },
      { version: "0.4.26", settings: { optimizer: { enabled: true, runs: 200 } } },
      { version: "0.5.16", settings: { optimizer: { enabled: true, runs: 200 } } },
      { version: "0.6.6",  settings: { optimizer: { enabled: true, runs: 200 } } },
      { version: "0.8.20", settings: { optimizer: { enabled: true, runs: 200 } } },
    ],
  },
  networks: {
    somniaMainnet: {
      url: process.env.SOMNIA_RPC_URL || "https://api.infra.mainnet.somnia.network/",
      chainId: 5031,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    somniaTestnet: {
      url: process.env.SOMNIA_TESTNET_RPC_URL || "https://dream-rpc.somnia.network/",
      chainId: 50312,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {
      somniaMainnet: process.env.SOMNIA_API_KEY || "",
      somniaTestnet: process.env.SOMNIA_TESTNET_API_KEY || "",
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

