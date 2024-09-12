import dotenv from "dotenv";
import { NodeIrys } from "@irys/sdk";
// import { Query } from "@irys/query";
import axios from "axios";

dotenv.config();

const IRYS_NETWORK = "devnet";
const IRYS_GATEWAY = "https://gateway.irys.xyz";

// Irys (Arweave bundler) setup
const getIrys = async () => {
  const irys = new NodeIrys({
    network: IRYS_NETWORK,
    token: "ethereum",
    key: process.env.SEPOLIA_PRIVATE_KEY,
    config: { providerUrl: process.env.SEPOLIA_URL },
  });
  await irys.ready();
  return irys;
};

// Irys operations
const uploadToArweave = async (data, tags) => {
  const irys = await getIrys();
  const receipt = await irys.upload(JSON.stringify(data), { tags });
  return receipt.id;
};

const getDataFromArweave = async (transactionId) => {
  try {
    const { data } = await axios.get(`${IRYS_GATEWAY}/${transactionId}`);
    return data;
  } catch (error) {
    console.error("Error fetching data from Irys:", error);
    return null;
  }
};

// Function called by main.js to upload data to Arweave
const uploadDataToArweave = async (depositData) => { 
  try {
    const transactionId = await uploadToArweave(depositData, [
      { name: "dkg", value: "deposit_data" },
    ]);
    const dataSetUrl = `${IRYS_GATEWAY}/${transactionId}`;
    console.log(`New deposit data set uploaded ==> ${dataSetUrl}`);
    return dataSetUrl;
  } catch (error) {
    console.error("Error uploading deposit data:", error);
    throw error;
  }
};

export { uploadDataToArweave, getDataFromArweave };
