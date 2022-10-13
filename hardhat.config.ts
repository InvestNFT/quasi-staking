import "@nomiclabs/hardhat-waffle"
import "@nomiclabs/hardhat-ethers"
import "hardhat-gas-reporter"
import "@nomiclabs/hardhat-etherscan"

import { testPrivateKey, privateKey, etherscanApiKey, alchemyApiKey, alchemyApiKeyGoerli } from './secrets.json';

export default {
    networks: {
        localhost: {
            url: "http://127.0.0.1:8545",
            accounts: [testPrivateKey]
        },
        goerli: {
            url: `https://eth-goerli.alchemyapi.io/v2/${alchemyApiKeyGoerli}`,
            chainId: 5,
            accounts: [testPrivateKey]
        },
        ethereum: {
            url: `https://eth-mainnet.g.alchemy.com/v2/${alchemyApiKey}`,
            chainId: 1,
            accounts: [privateKey]
        },
    },
    solidity: {
        compilers: [
            {
                version: "0.5.16",
                settings: {
                    optimizer: {
                        enabled: true
                    }
                }
            }, 
            {
                version: "0.8.0",
                settings: {
                    optimizer: {
                        enabled: true
                    }
                }
            }, 
            {
                version: "0.8.10",
                settings: {
                    optimizer: {
                        enabled: true
                    }
                }
            },
        ]
    },
    etherscan: {
        apiKey: {
            mainnet: etherscanApiKey,
            goerli: etherscanApiKey,
        }
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts"
    },
    mocha: {
        timeout: 200000
    },
    gasReporter: {
        enabled: true,
        outputFile: './gas-report.txt',
        noColors: true,
        rst: true,
    }
}

