// Multithreading
import { parentPort } from "node:worker_threads";
// Supabase
import { 
  supabaseClient,
  getWhitelistedDVInCreation,
  updateDatabase
} from '../supabase/supabaseSdk.js';
// Obol
import { 
  obolClient,
  getObolClusterLock
} from '../obol/obolSdk.js';
// Dotenv
import dotenv from "dotenv";
dotenv.config();

/*========= Thread config (run only once) =========*/

// Create a supabase client
const supabaseClientInst = supabaseClient();
// Create an Obol client
const obolClientInst = await obolClient();

/*================ Thread logic ================*/

// Check if a DKG has been performed
const newDkgHandler = async () => {
  
  // Get all the config hashes of the DV needing to perform the DKG
  let configHashes;
  try {
    configHashes = await getWhitelistedDVInCreation(supabaseClientInst);
    if (!configHashes || configHashes.length === 0) {
      console.log("All the DVs have already performed the DKG");
      return;
    }
  } catch (error) {
    console.error("Error in getting the DV in creation: ", error);
    return;
  }
  
  // For each config hash, verify if the DKG has been performed and the deposit data is available
  for (const configHash of configHashes) {
    try {
      const lock = await getObolClusterLock(obolClientInst, configHash);
      if (lock !== undefined) {
        // Update the status and lock_hash in database
        const updates = {
          lock_hash: lock.lock_hash,
          validator_addresses: lock.distributed_validators.map(validator => validator.distributed_public_key),
          dv_status: "2_DKG_performed",
          dkg_detected_at: new Date().toISOString(),
        };
        await updateDatabase(supabaseClientInst, updates, configHash);
        parentPort.postMessage({
          message: 'NEW DEPOSIT DATA AVAILABLE',
          data: lock.distributed_validators[0].deposit_data
        });
      }
    } catch (error) {
      console.error("No cluster lock found. DKG not ran: ", error);
      continue;
    }
  }

};

// Check for new DV every `ETH_BLOCK_TIME`
setInterval(() => {
  (async () => {
      await newDkgHandler();
  })();
}, 20000);