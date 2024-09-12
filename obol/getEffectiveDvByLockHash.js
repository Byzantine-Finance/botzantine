import dotenv from "dotenv";
dotenv.config();

const clusterEffectivenessUrl = "https://api.obol.tech/effectiveness/";

// Fetch the DV cluster effectiveness object by lock hash
export const getEffectiveDvByLockHash = async (lockHash) => {
  try {
    const response = await fetch(clusterEffectivenessUrl + lockHash);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(
      `Effectiveness not found for lock hash ${lockHash} -> It means that the DKG is not yet effective`
    );
    return null;
  }
};
