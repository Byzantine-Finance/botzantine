import { getWhitelistedClusters } from "./getWhitelistedClusters.js";
import { getDepositData } from "./getDepositData.js";
import { scheduler } from "node:timers/promises";
import { uploadDataToArweave } from "./uploadDataToArweave.js";
import { updateDatabase } from "./updateDatabase.js";
import { client } from "./discord.js";
import { DELAY } from "./constants/index.js";
import {} from "./obol/createCluster.js";

// Discord
import { messageNewDKG } from "./discord/messageNewDKG.js";
import { messageNewCluster } from "./discord/messageNewCluster.js";

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

const operators = [
  "0x1234567890abcdef1234567890abcdef12345678",
  "0x9876543210fedcba9876543210fedcba98765432",
  "0xabcdef1234567890abcdef1234567890abcdef1",
  "0xfedcba9876543210fedcba9876543210fedcba98",
];
const configHash =
  "0xce8834a1b4cf776f090d4411fa919a774b38b59fb8fdb40788f9fceb1385d3f8";

const main = async () => {
  while (true) {
    await fetchAndStoreData();
    await messageNewDKG(); // Call the new function
    await messageNewCluster(operators, configHash);
    console.log(`Waiting for ${DELAY / 1000} seconds before next fetch...`);
    await scheduler.wait(DELAY);
  }
};

main().catch((error) => {
  console.error("An error occurred:", error);
});
