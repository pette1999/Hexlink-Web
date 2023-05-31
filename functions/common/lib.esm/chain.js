import { ethers } from "ethers";
export const GOERLI = {
    chainId: "5",
    name: "goerli",
    fullName: "Goerli Test Network",
    rpcUrls: ["https://goerli.infura.io/v3/"],
    nativeCurrency: {
        name: "Goerli Ethereum",
        symbol: "gETH",
        decimals: 18,
    },
    blockExplorerUrls: ["https://goerli.etherscan.io"],
    logoUrl: "https://i.postimg.cc/qqFqP08S/ethPNG.png",
};
export const POLYGON = {
    chainId: "137",
    rpcUrls: ["https://polygon-mainnet.infura.io/v3/"],
    name: "polygon",
    fullName: "Polygon Network",
    nativeCurrency: {
        name: "MATIC",
        symbol: "MATIC",
        decimals: 18,
    },
    blockExplorerUrls: ["https://polygonscan.com"],
    logoUrl: "https://token.metaswap.codefi.network/assets/networkLogos/polygon.svg",
};
export const MUMBAI = {
    chainId: "80001",
    rpcUrls: ["https://polygon-mumbai.infura.io/v3/"],
    name: "mumbai",
    fullName: "Polygon Test Network",
    nativeCurrency: {
        name: "MATIC",
        symbol: "MATIC",
        decimals: 18,
    },
    blockExplorerUrls: ["https://mumbai.polygonscan.com/"],
    logoUrl: "https://token.metaswap.codefi.network/assets/networkLogos/polygon.svg",
};
export const GALILEO = {
    chainId: "3334",
    rpcUrls: ["https://galileo.web3q.io:8545"],
    name: "galileo",
    fullName: "Web3Q Galileo Test Network",
    nativeCurrency: {
        name: "W3Q",
        symbol: "W3Q",
        decimals: 18,
    },
    blockExplorerUrls: ["https://explorer.galileo.web3q.io/"],
    logoUrl: "",
};
export const ARBITRUM_TESTNET = {
    chainId: "421613",
    rpcUrls: ["https://endpoints.omniatech.io/v1/arbitrum/goerli/public"],
    name: "arbitrum_testnet",
    fullName: "Arbitrum Test Network",
    nativeCurrency: {
        name: "Arbitrum Ethereum",
        symbol: "aETH",
        decimals: 18,
    },
    blockExplorerUrls: ["https://goerli-rollup-explorer.arbitrum.io"],
    logoUrl: "https://i.postimg.cc/020dzv9j/nova.png",
};
export const ARBITRUM_NOVA = {
    chainId: "42170",
    rpcUrls: ["https://nova.arbitrum.io/rpc"],
    name: "arbitrum_nova",
    fullName: "Arbitrum Nova",
    nativeCurrency: {
        name: "Ethereum",
        symbol: "ETH",
        decimals: 18,
    },
    blockExplorerUrls: ["https://nova-explorer.arbitrum.io/"],
    logoUrl: "https://i.postimg.cc/020dzv9j/nova.png",
};
export const ARBITRUM = {
    chainId: "42161",
    rpcUrls: ["https://arb1.arbitrum.io/rpc"],
    name: "arbitrum",
    fullName: "Arbitrum One",
    nativeCurrency: {
        name: "Arbitrum Ethereum",
        symbol: "AETH",
        decimals: 18,
    },
    blockExplorerUrls: ["https://explorer.arbitrum.io/"],
    logoUrl: "https://i.postimg.cc/mkJcpr2T/arbilogo.png",
};
export const OK_TESTNET = {
    chainId: "65",
    rpcUrls: ["https://exchaintestrpc.okex.org"],
    name: "OKT",
    fullName: "OKT",
    nativeCurrency: {
        name: "OKT",
        symbol: "OKT",
        decimals: 18,
    },
    blockExplorerUrls: ["https://www.oklink.com/okc-test"],
    logoUrl: "https://static.oklink.com/cdn/assets/imgs/221/C267A35E6CF3829C.png",
};
export const SUPPORTED_CHAINS = [GOERLI, MUMBAI, ARBITRUM, ARBITRUM_TESTNET, OK_TESTNET];
export async function getChainFromProvider(provider) {
    const network = await provider.getNetwork();
    return getChain(network.chainId);
}
export function getChain(chain) {
    chain = chain.toString();
    if (chain === "goerli" || chain === "5") {
        return GOERLI;
    }
    else if (chain === "polygon" || chain === "137") {
        return POLYGON;
    }
    else if (chain === "mumbai" || chain == "80001") {
        return MUMBAI;
    }
    else if (chain === "galileo" || chain == "3334") {
        return GALILEO;
    }
    else if (chain === "arbitrum_nova" || chain == "42170") {
        return ARBITRUM_NOVA;
    }
    else if (chain === "arbitrum_testnet" || chain == "421613") {
        return ARBITRUM_TESTNET;
    }
    else if (chain === "arbitrum" || chain == "42161") {
        return ARBITRUM;
    }
    else if (chain === "OKT" || chain == "65") {
        return OK_TESTNET;
    }
    throw new Error("Unsupported chain");
}
export function refunder(_chain) {
    return ethers.constants.AddressZero;
}
