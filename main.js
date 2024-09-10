import { getWhitelistedClusters } from './getWhitelistedClusters.js';
import { getDepositData } from './getDepositData.js';
import { scheduler } from 'node:timers/promises';

const DELAY = "30000"; 

async function fetchAndProcessData() {
  try {
    console.log("Fetching whitelisted clusters...");
    const configHashes = await getWhitelistedClusters();
    
    if (!configHashes || configHashes.length === 0) {
      throw new Error("Failed to fetch config hashes or no hashes returned");
    }
    
    console.log("Whitelisted clusters config hashes:", configHashes);

    console.log("Fetching deposit data...");
    const depositData = await getDepositData(configHashes);
    
    if (depositData && depositData.length > 0) {
      console.log("Successfully fetched and processed deposit data:");
      console.log(JSON.stringify(depositData, null, 2));
    } else {
      console.log("No deposit data fetched or processed");
    }
  } catch (error) {
    console.error("Error in fetchAndProcessData function:", error.message);
  }
}

async function runBot() {
  while (true) {
    await fetchAndProcessData();
    console.log("Waiting for 30 seconds before next fetch...");
    await scheduler.wait(DELAY); 
  }
}

runBot().catch(error => {
  console.error("Bot crashed:", error);
});
