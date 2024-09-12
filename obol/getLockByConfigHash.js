import dotenv from "dotenv";
dotenv.config();

const clusterLockUrl = "https://api.obol.tech/lock/configHash/";

// Fetch the cluster lock by config hash
export const getLockByConfigHash = async (configHash) => {
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