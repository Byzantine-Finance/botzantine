import { getDepositData } from "./obol/getDepositData.js";
import { scheduler } from "node:timers/promises";
import { uploadDataToArweave } from "./irys/uploadDataToArweave.js";
import { DELAY, ALEXCANDRE_ID, LOGS_CHANNEL_ID } from "./constants/index.js";
import { createCluster } from "./obol/createCluster.js";

// Supabase
import { addNewClusterDB } from "./supabase/addNewClusterDB.js";
import { getWhitelistedClusters } from "./supabase/getWhitelistedClusters.js";
import { updateDatabase } from "./supabase/updateDatabase.js";
import { getNumberOfDV } from "./supabase/getNumberOfDV.js";
import { updateDBwithChannelId } from "./supabase/updateDBwithChannelId.js";

// Discord
import { client } from "./discord/discord.js";
import { messageNewDKG } from "./discord/messageNewDKG.js";
import { messageNewCluster } from "./discord/messageNewCluster.js";
import { createPrivateChannel } from "./discord/createPrivateChannel.js";
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

const clusterDefinition = {
  config_hash: configHash,
  operators: operators,
};

const detectNewAuction = async () => {
  // Check if a new auction is triggered
  // Return true if a new auction is triggered, false otherwise
  return true;
};

const actionsForNewAuction = async () => {
  console.log(">>> Actions for new auction:");
  let address_split_address = "0x0"; // await getAddressSplitContract(); // <-- Il faut que le contract soit deploy first
  let eigen_pod_address = "0x0"; // await getEigenPodContract(); // <-- Pareil

  let number_dv = await getNumberOfDV();

  let tx_hash =
    "0x43b44c88bd352997c79d73d1894d9bdefd1807e2134e563797b7c0e260123752"; //TODO: get the tx hash

  let config_hash =
    "0xfr0mde7ec7ecf776f090d4411fa919a774b38b59fb8fdb40788f985d3f8"; //todo, remove this

  //TODO: uncomment, but only at the end, when we have the real config hash
  // let config_hash = createCluster(
  //   address_split_address,
  //   eigen_pod_address,
  //   operators,
  //   number_dv
  // );
  // console.log("> New cluster created:", config_hash);

  await addNewClusterDB(tx_hash, config_hash, operators);
  console.log("> New cluster added to database");

  await messageNewCluster(config_hash, operators);
  console.log("> New cluster message sent to Discord");

  const channel = await createPrivateChannel(config_hash, operators, number_dv);
  console.log("> Private channel created for the new cluster", channel.id);
  await updateDBwithChannelId(config_hash, channel.id);
};

const main = async () => {
  await scheduler.wait(2000);
  while (true) {
    // ------- Fetch and store data -------
    await fetchAndStoreData();

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
  }
};

main().catch((error) => {
  console.error("An error occurred:", error);
});
