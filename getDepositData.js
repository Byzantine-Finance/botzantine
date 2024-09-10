import dotenv from "dotenv";

dotenv.config();

const clusterLockUrl = process.env.CLUSTER_LOCK_API_URL;

// Fetch the cluster locks by config hash
export const getDepositData = async (configHashes) => {
  try {
    if (!configHashes || configHashes.length === 0) {
      throw new Error("No config hashes provided");
    }

    // Fetch cluster locks from Obol API
    const clusterLocks = await Promise.all(configHashes.map(fetchClusterLock));

    console.log("Fetched cluster locks by config hash:", clusterLocks);

    const extractedData = extractDataFromLocks(
      clusterLocks.filter((lock) => lock !== null)
    );

    return extractedData;
  } catch (error) {
    console.error("Error in getDepositData:", error.message);
    return null;
  }
};

const fetchClusterLock = async (configHash) => {
  try {
    const response = await fetch(`${clusterLockUrl}/${configHash}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(
      `Error fetching cluster lock for config hash ${configHash}:`,
      error.message
    );
    return null;
  }
};

const extractDataFromLocks = (locks) => {
  const extractedData = [];

  locks.forEach((lock, index) => {
    if (lock && lock.distributed_validators) {
      lock.distributed_validators.forEach((validator, vIndex) => {
        if (validator.deposit_data) {
          extractedData.push({
            pubkey: validator.deposit_data.pubkey,
            signature: validator.deposit_data.signature,
            deposit_data_root: validator.deposit_data.deposit_data_root,
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
