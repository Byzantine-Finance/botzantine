import dotenv from "dotenv";

dotenv.config();

const clusterLockUrl = "https://api.obol.tech/lock/configHash/";

// Fetch the deposit data from the cluster locks by config hash
export const getDepositData = async (configHashes) => {
  try {
    if (!configHashes || configHashes.length === 0) {
      throw new Error("No config hashes provided");
    }

    // Fetch cluster locks from Obol API
    const clusterLocks = [];
    const successfulHashes = [];
    const lockHashes = [];
    for (const configHash of configHashes) {
      const lock = await fetchClusterLock(configHash);
      if (lock) {
        clusterLocks.push(lock);
        successfulHashes.push(configHash); // Store the successful configHash
        lockHashes.push(lock.lock_hash);
      }
    }

    const extractedData = extractDataFromLocks(
      clusterLocks,
      successfulHashes,
      lockHashes
    ); // Pass successfulHashes

    return extractedData;
  } catch (error) {
    console.error("Error in getDepositData:", error.message);
    return null;
  }
};

// Fetch the cluster lock by config hash
const fetchClusterLock = async (configHash) => {
  try {
    const response = await fetch(clusterLockUrl + configHash);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(
      `Cluster lock not found for config hash ${configHash} -> It means that the DKG has not been ran yet`
    );
    return null;
  }
};

// Extract the deposit data from the cluster locks object
const extractDataFromLocks = (locks, successfulHashes, lockHashes) => {
  const extractedData = [];

  locks.forEach((lock, index) => {
    if (lock && lock.distributed_validators) {
      lock.distributed_validators.forEach((validator, vIndex) => {
        if (validator.deposit_data) {
          extractedData.push({
            pubkey: validator.deposit_data.pubkey,
            signature: validator.deposit_data.signature,
            deposit_data_root: validator.deposit_data.deposit_data_root,
            configHash: successfulHashes[index],
            lockHash: lockHashes[index],
          });
        } else {
          console.log(`No deposit_data found for validator ${vIndex}`);
        }
      });
    } else {
      console.log(`No distributed_validators found for lock ${index}`);
    }
  });
  return extractedData;
};
