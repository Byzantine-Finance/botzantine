import { Client } from "@obolnetwork/obol-sdk";
import { ethers } from "ethers";
import dotenv from "dotenv";
dotenv.config();

// Returns an authorized Obol client
export const obolClient = async () => {

    // use byzantine private key
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
    const signer = wallet.connect(null);
    console.log("Cluster Creator Address: ", signer.address);
    
    const client = new Client(
      { baseUrl: "https://api.obol.tech", chainId: process.env.CHAIN_ID },
      signer
    );

    // signer accepts Obol latest terms and conditions
    try {
        const isAuthorised = await client.acceptObolLatestTermsAndConditions();
        console.log("Obol client authorised: ", isAuthorised);
    } catch (err) {
        console.log("Error authorising Obol client: ", err);
    }

    return client;
}

// Function to create an Obol cluster
export const createObolCluster = async (
  client,
  eigenPodAddress,
  operators,
  numberDV
) => {

  // Create the cluster config
  const clusterConfig = {
    name: "Byzantine DV" + numberDV,
    operators,
    validators: [
      {
        fee_recipient_address: eigenPodAddress,
        withdrawal_address: eigenPodAddress,
      },
    ],
  };

  try {
   const configHash = await client.createClusterDefinition(clusterConfig);
   return configHash;
  } catch (err) {
   console.error("Error creating cluster: ", err);
  }

};

// Returns the partial / complete cluster definition of a cluster's config hash
export const getObolClusterDefinition = async (client, configHash) => {
  try {
    const clusterDefinition = await client.getClusterDefinition(configHash);
    return clusterDefinition;
  } catch (err) {
    console.log("Error getting cluster definition: ", err);
  }
};

// Returns the cluster lock hash of a cluster's config hash
export const getObolClusterLock = async (client, configHash) => {
  try {
    const lockFile = await client.getClusterLock(configHash);
    return lockFile;
  } catch (err) {
    console.log(`Error getting cluster lock. The DKG for cluster for config hash ${configHash} has not been ran yet: `, err);
  }
};

// Validates a cluster lock
const validateObolClusterLock = async (client, clusterLock) => {
  try {
    const isValidLock = await client.validateClusterLock(clusterLock);
    return isValidLock;
  } catch (err) {
    console.log(`Cluster lock ${clusterLock} is not valid: `, err);
  }
};