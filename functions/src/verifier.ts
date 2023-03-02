import * as functions from "firebase-functions";
import * as ethers from "ethers";
import {signWithKmsKey, getEthAddressFromPublicKey} from "./kms";
import {kmsConfig, KMS_KEY_TYPE} from "./config";
import {
  GenNameHashSuccess,
  genNameHash,
  toEthSignedMessageHash,
} from "./account";
import {Firebase} from "./firebase";

const TWITTER_PROVIDER_ID = "twitter.com";
const OAUTH_AUTH_TYPE = "oauth";

const secrets = functions.config().doppler || {};

export interface AuthProof {
  name: string,
  requestId: string,
  authType: string,
  identityType: string,
  issuedAt: number,
  signature: string
}

export const genTwitterOAuthProof = functions.https.onCall(
    async (data, context) => {
      Firebase.getInstance();
      const uid = context.auth?.uid;
      if (!uid) {
        return {code: 401, message: "Unauthorized Call"};
      }

      const result = await genNameHash(uid, data.version);
      if (result.code !== 200) {
        return result;
      }
      const {nameHash} = result as GenNameHashSuccess;

      const identityType = hash(TWITTER_PROVIDER_ID);
      const authType = hash(OAUTH_AUTH_TYPE);

      // reserve some time for current block
      const issuedAt = Math.round(Date.now() / 1000) - 30;
      const message = ethers.utils.keccak256(
          ethers.utils.defaultAbiCoder.encode(
              ["bytes32", "bytes32", "uint256", "bytes32", "bytes32"],
              [
                nameHash,
                data.requestId,
                issuedAt,
                identityType,
                authType,
              ]
          )
      );

      let encodedSig;
      if (process.env.FUNCTIONS_EMULATOR) {
        const validator = new ethers.Wallet(secrets.HARDHAT_VALIDATOR);
        const signature = await validator.signMessage(
            ethers.utils.arrayify(message)
        );
        encodedSig = ethers.utils.defaultAbiCoder.encode(
            ["address", "bytes"], [await validator.getAddress(), signature]
        );
      } else {
        const sig = await signWithKmsKey(
            KMS_KEY_TYPE[KMS_KEY_TYPE.operator],
            toEthSignedMessageHash(message)
        ) as string;
        const validatorAddr = kmsConfig().get(
            KMS_KEY_TYPE[KMS_KEY_TYPE.operator]
        )?.publicAddress;
        encodedSig = ethers.utils.defaultAbiCoder.encode(
            ["address", "bytes"], [validatorAddr, sig]
        );
      }

      const AuthProof: AuthProof = {
        name: nameHash,
        requestId: data.requestId,
        issuedAt: issuedAt,
        identityType: TWITTER_PROVIDER_ID,
        authType: OAUTH_AUTH_TYPE,
        signature: encodedSig,
      };
      return {code: 200, authProof: AuthProof};
    });

const hash = function(value: string) {
  return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(value));
};

export const calcEthAddress = functions.https.onCall(
    async (data, context) => {
      Firebase.getInstance();
      return getEthAddressFromPublicKey(data.keyId, data.keyType);
    }
);