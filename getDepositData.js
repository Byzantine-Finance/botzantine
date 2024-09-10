import dotenv from "dotenv";

dotenv.config();

const clusterLockUrl =
  process.env.CLUSTER_LOCK_API_URL || "https://api.obol.tech/v1/lock";

// Fetch the cluster locks by config hash
export async function getDepositData(configHashes) {
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
    // console.log("Extracted deposit data:", JSON.stringify(extractedData, null, 2));

    return extractedData;
  } catch (error) {
    console.error("Error in getDepositData:", error.message);
    return null;
  }
}

async function fetchClusterLock(configHash) {
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
}

function extractDataFromLocks(locks) {
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
}
getDepositData().then((result) => {
  if (result) {
    console.log("Successfully fetched and processed deposit data");
  } else {
    console.log("Failed to fetch or process deposit data");
  }
});
