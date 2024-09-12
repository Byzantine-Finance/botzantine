import { Client, validateClusterLock } from "@obolnetwork/obol-sdk";
import { EmbedBuilder } from "discord.js";
import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

//use my seed phrase
const privateKey = ethers.Wallet.fromPhrase(process.env.SEED_PHRASE).privateKey;
const wallet = new ethers.Wallet(privateKey);
const signer = wallet.connect(null);
console.log("Working witht the following address: ", signer.address);

const client = new Client(
  { baseUrl: "https://api.obol.tech", chainId: 17000 },
  signer
);

export const createCluster = async (
  addressSplitAddress,
  eigenPodAddress,
  operators,
  numberDV
) => {
  const clusterConfig = {
    name: "Byzantine DV" + numberDV,
    operators,
    validators: [
      {
        fee_recipient_address: addressSplitAddress,
        withdrawal_address: eigenPodAddress,
      },
    ],
  };
  try {
    const configHash = await client.createClusterDefinition(clusterConfig);
    return configHash;
  } catch (err) {
    console.error("Error creating cluster:", err);
  }
};
