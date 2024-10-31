import { Worker } from "node:worker_threads";
import { 
  supabaseClient,
  getWhitelistedDVInActivation,
  getDKGTimestamp,
  getClusterId,
  getVaultAddress,
  updateDatabase
} from "./supabase/supabaseSdk.js";
import { 
  obolClient,
  getObolClusterLock
} from "./obol/obolSdk.js";
import { ethers } from "ethers";
import { strategyVaultETHImplementationAbi } from "./ABI/strategyVaultETHImplementation.js";
import dotenv from "dotenv";
dotenv.config();

// const dvActivationTime = 24 * 60 * 60 * 1000; // 24h in milliseconds
const dvActivationTime = 2000; // 2 seconds

// Create the clients required for the program
const supabaseClientInst = supabaseClient();
const obolClientInst = await obolClient();

// Connecting to ethereum
const provider = new ethers.JsonRpcProvider(process.env.HOLESKY_RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const main = async () => {

  // Check if DVs need to be activated
  // Edge case occurs when DKG is performed but the program has restarted before the DV activation
  await checkDVActivation(supabaseClientInst, obolClientInst);

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
        await activateDV(message.configHash, message.depositData, message.clusterId, message.vaultAddress);
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
const checkDVActivation = async (supabaseClientInst, obolClientInst) => {

  const configHashes = await getWhitelistedDVInActivation(supabaseClientInst);
  if (!configHashes || configHashes.length === 0) {
    console.log("No DV waiting for activation");
    return;
  }

  // For each config hash, verify if the activation is still to be done
  const currentDate = new Date();
  for (const configHash of configHashes) {

    // Get the arguments needed for the activation
    let lock;
    let clusterId;
    let vaultAddress;
    try {
      lock = await getObolClusterLock(obolClientInst, configHash);
      clusterId = await getClusterId(supabaseClientInst, configHash);
      vaultAddress = await getVaultAddress(supabaseClientInst, configHash);
    } catch (error) {
      console.error('Error in getting the cluster lock or cluster ID in back up function:', error);
      continue;
    }

    // Get the DKG timestamp
    const dkgTimestamp = await getDKGTimestamp(supabaseClientInst, configHash);
    if (!dkgTimestamp) {
      console.error("No DKG timestamp found for config hash: ", configHash);
      continue;
    }
    
    // Calculate the time elapsed since the DKG was performed
    const dkgDate = new Date(dkgTimestamp);
    const timeDifference = currentDate - dkgDate;
    if (timeDifference < dvActivationTime) { // If program has been stopped during less than dvActivationTime
      setTimeout(async () => {
        await activateDV(configHash, lock.distributed_validators[0].deposit_data, clusterId, vaultAddress);
      }, timeDifference);
    } else { // Program has been stopped for more than dvActivationTime
      await activateDV(configHash, lock.distributed_validators[0].deposit_data, clusterId, vaultAddress);
    }
  }
}

const activateDV = async (configHash, depositData, clusterId, vaultAddress) => {
  // Get the relevant deposit data
  const pubKey = depositData.pubkey;
  const signature = depositData.signature;
  const depositDataRoot = depositData.deposit_data_root;

  // Create vault contract instance
  const vaultContract = new ethers.Contract(vaultAddress, strategyVaultETHImplementationAbi, signer);

  try {
    // Simulate the transaction
    const result = await vaultContract.activateCluster.call(
      "activateCluster",
      ethers.hexlify(pubKey),
      ethers.hexlify(signature),
      "0x" + depositDataRoot,
      clusterId
    );
    console.log("Beacon deposit simulation is successful: ", result);

    // // Execute the transaction
    // const tx = await vaultContract.activateCluster(
    //   ethers.hexlify(pubKey),
    //   ethers.hexlify(signature),
    //   "0x" + depositDataRoot,
    //   clusterId
    // );
    // await tx.wait();
    // console.log("Beacon deposit transaction is successful: ", tx.hash);

    // Update the database
    const updates = {
      dv_status: "3_DV_effective",
    };
    await updateDatabase(supabaseClientInst, updates, configHash);

    console.log("DV activated successfully");

  } catch (error) {
    console.error('Error when calling stratVaultETH.activateCluster: ', error);
  }
}

main().catch((error) => {
  console.error("An error occurred:", error);
});
