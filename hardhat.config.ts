import * as dotenv from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "./tasks/accounts";

dotenv.config();

const GAS_LIMIT = 30000000;

// https://hardhat.org/config/
const config: HardhatUserConfig = {
  solidity: {
    version: "0.7.2",
    settings: {
      // why this works for deploying on testnet?
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  // paths: {
  //   artifacts: "build/contracts",
  // },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true, // for deploying maci
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${process.env.INFURA_API_KEY}`,
      chainId: 4,
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    kovan: {
      url: `https://kovan.infura.io/v3/${process.env.INFURA_API_KEY}`,
      chainId: 42,
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  typechain: {
    outDir: "typechain/",
    target: "ethers-v5",
    alwaysGenerateOverloads: false,
    externalArtifacts: ["precompiled/*.json"],
  },
};

export default config;
