import dotenv from "dotenv";
import { NodeIrys } from "@irys/sdk";
// import { Query } from "@irys/query";
import axios from "axios";

dotenv.config();

// Constants
const IRYS_NETWORK = "devnet";
const JSONBIN_URL = "https://api.jsonbin.io/v3/b/66ddb8e5e41b4d34e42c0909";
const IRYS_GATEWAY = "https://gateway.irys.xyz";

// Irys setup
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

// JSONbin operations (can be another storage solution)
const getJsonbinHeaders = () => ({
  "Content-Type": "application/json",
  "X-Master-Key": process.env.X_MASTER_KEY,
});

const updateUrlsStorage = async (newUrl) => {
  try {
    const headers = getJsonbinHeaders();
    const { data } = await axios.get(JSONBIN_URL);
    const urlList = [...(data.record.urls || []), newUrl];
    await axios.put(JSONBIN_URL, { urls: urlList }, { headers });
    console.log("JSONbin storage updated with new Irys URL");
  } catch (error) {
    console.error("Error updating JSONbin:", error.response?.data || error.message);
    throw error;
  }
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

const uploadDepositData = async (depositData) => {
  try {
    const transactionId = await uploadToArweave(depositData, [
      { name: "dkg", value: "deposit_data" },
    ]);
    const dataSetUrl = `${IRYS_GATEWAY}/${transactionId}`;
    console.log(`New deposit data set uploaded ==> ${dataSetUrl}`);
    await updateUrlsStorage(dataSetUrl);
    return { dataSetTransactionId: transactionId };
  } catch (error) {
    console.error("Error uploading deposit data:", error);
    throw error;
  }
};

const uploadDataToArweave = async (depositDataSets) => {
  // Ensure depositDataSets is an array
  if (!Array.isArray(depositDataSets)) {
    depositDataSets = [depositDataSets];
  }

  try {
    const results = [];

    for (const depositData of depositDataSets) {
      const { dataSetTransactionId } = await uploadDepositData(depositData);
      console.log("Transaction ID:", dataSetTransactionId);

      const dataSet = await getDataFromArweave(dataSetTransactionId);
    //   console.log("Uploaded data set:", dataSet);

      results.push({ dataSetTransactionId, dataSet });
    }

    const { data } = await axios.get(JSONBIN_URL, {
      headers: getJsonbinHeaders(),
    });
    console.log("Updated URL list in JSONbin:", data.record.urls);

    return results;
  } catch (error) {
    console.error("Error in uploadDataToArweave function:", error);
    throw error;
  }
};

export {
  uploadDataToArweave,
  uploadDepositData,
  getDataFromArweave,
};
