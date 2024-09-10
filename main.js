import { getWhitelistedClusters } from "./getWhitelistedClusters.js";
import { getDepositData } from "./getDepositData.js";
import { scheduler } from "node:timers/promises";
import { uploadDataToArweave } from "./uploadDataToArweave.js";

const DELAY = "30000";

const fetchAndProcessData = async () => {
  try {
    console.log("Fetching whitelisted clusters...");
    const configHashes = await getWhitelistedClusters();

    if (!configHashes || configHashes.length === 0) {
      throw new Error("Failed to fetch config hashes or no hashes returned");
    }

    console.log("Whitelisted clusters config hashes:", configHashes);

    console.log("Fetching deposit data...");
    const depositDataSets = await getDepositData(configHashes);

    if (depositDataSets && depositDataSets.length > 0) {
      console.log("Successfully fetched and processed deposit data:");
      console.log(JSON.stringify(depositDataSets, null, 2));

      // Upload each deposit data set to Arweave separately to get one url per data set
      for (const depositData of depositDataSets) {
        try {
          await uploadDataToArweave([depositData]);
        } catch (uploadError) {
          console.error(
            `Error uploading for deposit data: ${depositData}`,
            uploadError
          );
        }
      }
    } else {
      console.log("No deposit data fetched or processed");
    }
  } catch (error) {
    console.error("Error in fetchAndProcessData function:", error.message);
  }
};

const runBot = async () => {
  while (true) {
    await fetchAndProcessData();
    console.log("Waiting for 30 seconds before next fetch...");
    await scheduler.wait(DELAY);
  }
};

runBot().catch((error) => {
  console.error("Bot crashed:", error);
});
