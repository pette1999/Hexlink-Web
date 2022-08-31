import * as ethers from "ethers";
import type { Provider } from "@ethersproject/providers"
import { getFunctions, httpsCallable } from 'firebase/functions'

const functions = getFunctions();

let provider: Provider | null = null;

const BALANCE_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
];

export interface IMetadata {
    admin: {
        address: string,
        abi: any,
    },
    walletImpl: {
        address: string,
        abi: any,
    },
    token: {
        address: string,
        abi: any,
    },
    wallet: string,
    balance: number,
}

export interface IToken {
    symbol: string;
    contract?: string;
    decimals: number;
    name?: string;
}

export interface Transaction {
    hash: string,
    from: string,
    to: string,
    amount: number,
    state: "Executing" | "Success" | "Error",
}

export interface Token extends IToken {
    balance: number;
}

export function getProvider() {
    if (!provider) {
        provider = new ethers.providers.AlchemyProvider(
            import.meta.env.VITE_HARDHAT_NETWORK,
            import.meta.env.VITE_GOERLI_ALCHEMY_KEY
        );
    }
    return provider;
}

export async function getYawMetadata() : Promise<IMetadata> {
    const getMetadata = httpsCallable(functions, 'metadata')
    const result = await getMetadata();
    return result.data as IMetadata;
}

export async function isContract(address: string): Promise<boolean> {
    if (!ethers.utils.isAddress(address)) {
        return false;
    }
    try {
        const code = await getProvider().getCode(address);
        if (code !== '0x') return true;
    } catch (error) { }
    return false;
}

export async function getERC20Metadata(contract: string, ERC20: any) : Promise<IToken> {
    const erc20 = new ethers.Contract(contract, ERC20.abi, getProvider());
    return {
        contract,
        symbol: await erc20.symbol(),
        decimals: await erc20.decimals(),
    }
}

export async function getTokenBalance(contract: string, wallet: string) : Promise<ethers.BigNumber> {
    const token = new ethers.Contract(contract, BALANCE_ABI, getProvider());
    return await token.balanceOf(wallet);
}

export async function getBalances(tokens: IToken[], wallet: string) : Promise<Token[]> {
    let result: Token[] = [];
    const provider = getProvider();
    for (let t of tokens) {
        if (t.contract) {
            const abi = [
                "function balanceOf(address owner) view returns (uint256)",
            ];
            const token = new ethers.Contract(t.contract, abi, provider);
            const balance = await token.balanceOf(wallet);
            const normalized = normalizeBalance(balance, t.decimals);
            result.push({...t, balance: normalized});
        } else {
            const balance = await getProvider().getBalance(wallet);
            const normalized = normalizeBalance(balance, 18);
            result.push({...t, balance: normalized});
        }
    }
    return result;
}

export function normalizeBalance(balance: ethers.BigNumber, decimals: number) : number {
    const factor = ethers.BigNumber.from(10).pow(decimals);
    return Math.round(balance.div(factor).toNumber() * 100) / 100;
}

export function prettyPrintAddress(address: string) {
    if (address) {
        const len = address.length;
        return address.substring(0, 4) + "..." + address.substring(len - 4, len - 1)
    }
    return "N/A";
}

const genSalt = function(email: string) {
    return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(`mailto:${email}`));
};
  
export function genAddress(email: string | null | undefined, admin: string, initCode: any) {
    if (!email) {
        return "";
    }
    const salt = email ? genSalt(email) : ethers.constants.HashZero;
    return ethers.utils.getCreate2Address(
        admin,
        salt,
        ethers.utils.keccak256(initCode)
    );
};

export async function send(
    token: Token,
    recevier: string,
    amount: number
) : Promise<{txHash: string}> {
    if (token.contract) {
        const sendERC20 = httpsCallable(functions, 'sendERC20');
        const result = await sendERC20({tokenContract: token.contract, recevier, amount});
        return result.data as {txHash: string};
    } else {
        const sendETH = httpsCallable(functions, 'sendETH')
        const result = await sendETH({recevier, amount});
        return result.data as {txHash: string};
    }
}