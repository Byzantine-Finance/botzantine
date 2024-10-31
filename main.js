import { Worker } from "node:worker_threads";
import { 
  supabaseClient,
  getWhitelistedDVInActivation,
  getDKGTimestamp
} from "./supabase/supabaseSdk.js";
import { obolClient } from "./obol/obolSdk.js";

// const dvActivationTime = 24 * 60 * 60 * 1000; // 24h in milliseconds
const dvActivationTime = 2000; // 2 seconds

const main = async () => {

  // Create the clients required for the program
  const supabaseClientInst = supabaseClient();
  const obolClientInst = await obolClient();

  await checkDVActivation(supabaseClientInst);

  // Create the workers
  const newDvWorker = new Worker("./workers/newDvWorker.js");
  const newDkgWorker = new Worker("./workers/newDkgWorker.js");

  // Print the new clusters information
  newDvWorker.on('message', (message) => {
    console.log(message);
  });

  // Activate the DV when the deposit data is available
  newDkgWorker.on('message', async (message) => {
    if (message.message === 'NEW DEPOSIT DATA AVAILABLE') {      
      setTimeout(async () => {
        try {
          await activateDV(message.data);
        } catch (error) {
          console.error('Error in activating the DV:', error);
        }
      }, dvActivationTime);
    }
  });

  /*while (true) {
    // ------- Fetch and store data -------
    await trackDvStatus();

    // ------- Detect new auction -------
    if (await detectNewAuction()) {
      await actionsForNewAuction();
    }

    // ------- Testing individual functions -------
    // await messageNewDKG(); // Call the new function
    // let config_hash =
    //   "0xce8834a1b4cf776f090d4411fa919a774b38b59fb8fdb40788f985d3f8";
    // await messageNewDKG();
    // await messageNewCluster(config_hash, operators);
    // await addNewClusterDB(tx_hash, config_hash, operators);

    // ------- Troll to spam messages to Alexandre -------
    // const message = `Here is a present for you <@${ALEXCANDRE_ID}>, a new notification!`;
    // const channel = await client.channels.fetch(LOGS_CHANNEL_ID);
    // console.log("Sending message to channel");
    // if (channel) {
    //   await channel.send(message);
    // }

    // ------- Delay before next fetch -------
    console.log(`Waiting for ${DELAY / 1000} seconds before next fetch...`);
    await scheduler.wait(DELAY);
  }*/
};

// Backup function in case the program has to be reloaded
const checkDVActivation = async (supabaseClientInst) => {

  const configHashes = await getWhitelistedDVInActivation(supabaseClientInst);
  if (!configHashes || configHashes.length === 0) {
    console.log("No DV waiting for activation");
    return;
  }

  // For each config hash, verify if the activation is still to be done
  const currentDate = new Date();
  for (const configHash of configHashes) {
    const dkgTimestamp = await getDKGTimestamp(supabaseClientInst, configHash);
    if (!dkgTimestamp) {
      console.error("No DKG timestamp found for config hash: ", configHash);
      continue;
    }
    
    // Calculate the time elapsed since the DKG was performed
    const dkgDate = new Date(dkgTimestamp);
    const timeDifference = currentDate - dkgDate;
    if (timeDifference < dvActivationTime) {
      setTimeout(async () => {
        try {
          await activateDV(message.data);
        } catch (error) {
          console.error('Error in activating the DV:', error);
        }
      }, timeDifference);
    } else {
      console.log("No missing DVs to activate");
    }
  }
}

const activateDV = async (depositData) => {
  console.log("Activating the DV ", depositData);
}

main().catch((error) => {
  console.error("An error occurred:", error);
});
