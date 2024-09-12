import dotenv from "dotenv";

dotenv.config();

// Fetch the deposit data from the cluster locks by lock response
export const getDepositDataByLockHash = async (lockResponse) => {
  try {
    const extractedData = [];

    if (lockResponse.distributed_validators) {
      lockResponse.distributed_validators.forEach((validator, vIndex) => {
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
      console.log("No distributed_validators found");
    }

    return extractedData;
  } catch (error) {
    console.error("Error in getDepositData:", error.message);
    return null;
  }
};