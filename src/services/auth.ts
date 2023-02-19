import {
    getAuth,
    connectAuthEmulator,
    GoogleAuthProvider,
    TwitterAuthProvider,
    signInWithCustomToken,
    signInWithPopup,
    signOut,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import type { IUser } from "@/types";
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '@/services/firebase';
import { useAuthStore } from "@/stores/auth";
import { useWalletStore } from "@/stores/wallet";
import { switchNetwork } from "@/web3/network";
import type { Chain } from "../../functions/common";
import { GOERLI, SUPPORTED_CHAINS} from "../../functions/common";
import { initHexlAccount, nameHashWithVersion } from "@/web3/account";
import { useChainStore } from '@/stores/chain';
import { initTokenList } from "@/web3/tokens";
import { useAccountStore } from '@/stores/account';
import { useTokenStore } from '@/stores/token';

const auth = getAuth(app)
if (process.env.FUNCTIONS_EMULATOR === "true") {
    connectAuthEmulator(auth, "http://localhost:9099");
}
const functions = getFunctions()

export async function genOTP(email: string) {
    const genOTPCall = httpsCallable(functions, 'genOTP');
    await genOTPCall({email: email});
}

export async function validateOTP(email: string, otp: string) {
    const validateOTPCall = httpsCallable(functions, 'validateOTP');
    const result = await validateOTPCall({email: email, otp: otp});
    const resultData = result.data as any;
    if (resultData.code !== 200) {
        return {code: resultData.code, message: resultData.message}
    }
    console.log(resultData);

    try {
        const userCredential = await signInWithCustomToken(auth, resultData.token);
        const cred = userCredential.user;
        const idToken = await getIdTokenAndSetClaimsIfNecessary(cred);
        const user : IUser = {
            provider: "mailto",
            identityType: "mailto",
            authType: "otp",
            uid: cred.uid,
            providerUid: email,
            handle: email,
            displayName: email,
            nameHash: nameHashWithVersion("mailto", email),
            idToken,
        };
        useAuthStore().signIn(user);
        await init();
        return {code: 200};
    } catch (error) {
        console.log(error);
    }

}

export async function getIdTokenAndSetClaimsIfNecessary(user: User, refresh: boolean = false) {
    let idToken = await user.getIdToken(refresh)
    const idTokenResult = await user.getIdTokenResult()
    if (!idTokenResult.claims['https://hasura.io/jwt/claims']) {
        const refreshToken = httpsCallable(functions, 'refreshToken')
        try {
            await refreshToken()
            idToken = await user.getIdToken(true)
        } catch (error: any) {
            console.error(
                "Unable to refresh token, which doesn't have Hasura claim.",
            )
            signOutFirebase()
            throw(error)
        }
    }
    return idToken
}

export async function refreshToken() {
    const idToken = await getIdTokenAndSetClaimsIfNecessary(auth.currentUser!, true);
    const store = useAuthStore();
    store.refreshIdToken(idToken);
}

export async function googleSocialLogin() {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider)
        const idToken = await getIdTokenAndSetClaimsIfNecessary(result.user)
        const user : IUser = {
            provider: "google.com",
            identityType: "email",
            authType: "oauth",
            uid: result.user.uid,
            providerUid: result.user.uid, // TODO: ensure this is google uid
            handle: result.user.email!,
            displayName: result.user.displayName || undefined,
            photoURL: result.user.photoURL || undefined,
            nameHash: nameHashWithVersion("mailto", result.user.email!),
            idToken
        };
        useAuthStore().signIn(user);
        await init();
        await switchNetwork(GOERLI);
    } catch (error: any) {
        if (error.code == 'auth/popup-closed-by-user') {
            return
        }
    }
}

export async function twitterSocialLogin() {
    const provider = new TwitterAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const idToken = await getIdTokenAndSetClaimsIfNecessary(result.user);
        const providerUid = result.user.providerData[0].uid;
        const user : IUser = {
            provider: "twitter.com",
            identityType: "twitter.com",
            authType: "oauth",
            uid: result.user.uid,
            providerUid,
            handle: result.user.reloadUserInfo.screenName,
            displayName: result.user.displayName || undefined,
            photoURL: result.user.photoURL || undefined,
            nameHash: nameHashWithVersion("twitter.com", providerUid),
            idToken,
        };
        useAuthStore().signIn(user);
        await init();
    } catch (error) {
        console.log(error);
    }
}

export function signOutFirebase() {
    useWalletStore().disconnectWallet();
    useAuthStore().signOut();
    useAccountStore().reset();
    useTokenStore().reset();
    useChainStore().reset();
    return signOut(auth);
}

export async function init() {
    const user = useAuthStore().user!;
    await Promise.all(
        SUPPORTED_CHAINS.map((chain: Chain) => initHexlAccount(chain, user.nameHash))
    );
    await Promise.all(
        SUPPORTED_CHAINS.map((chain: Chain) => initTokenList(chain))
    );
    await switchNetwork(GOERLI);
}