import { getWhitelistedClusters } from "./getWhitelistedClusters.js";
import { getDepositData } from "./getDepositData.js";
import { scheduler } from "node:timers/promises";
import { uploadDataToArweave } from "./uploadDataToArweave.js";
import { updateDatabase } from "./updateDatabase.js";
import { client } from "./discord.js";

const DELAY = 30000;

const fetchAndStoreData = async () => {
  try {
    // Fetch the list of whitelisted clusters and get the config hashes
    console.log("========================================");
    console.log("Fetching whitelisted clusters...");
    const configHashes = await getWhitelistedClusters();

    if (!configHashes || configHashes.length === 0) {
      throw new Error("Failed to fetch config hashes or no available clusters");
    }

    console.log("Whitelisted clusters config hashes:", configHashes);

    // Fetch the deposit data from the cluster locks by config hash
    console.log("Fetching deposit data...");
    const depositDataSets = await getDepositData(configHashes);
    console.log("Deposit data:", depositDataSets);

    if (depositDataSets && depositDataSets.length > 0) {
      console.log("-> Successfully fetched and processed deposit data:");
      console.log(JSON.stringify(depositDataSets, null, 2));

      // For each deposit data set
      for (const depositData of depositDataSets) {
        try {
          // Prepare data to upload, excluding configHash
          const { configHash, lockHash, ...dataToUpload } = depositData;
          const url = await uploadDataToArweave([dataToUpload]);

          const updates = {
            lock_hash: lockHash,
            is_deposit_data_stored: true,
            deposit_data_url: url,
          };
          // Store the updates in the database
          await updateDatabase(updates, configHash);
        } catch (uploadError) {
          console.error(
            `Error uploading for deposit data: ${depositData}`,
            uploadError
          );
        }
      }
    } else {
      console.log("-> No deposit data fetched or processed");
    }
  } catch (error) {
    console.error("Error in fetchAndStoreData function:", error.message);
  }
};

// The bot runs indefinitely every 30 seconds
const runBot = async () => {
  while (true) {
    await fetchAndStoreData();
    console.log(`Waiting for ${DELAY / 1000} seconds before next fetch...`);
    await scheduler.wait(DELAY);
  }
};

runBot().catch((error) => {
  console.error("Bot crashed:", error);
});
