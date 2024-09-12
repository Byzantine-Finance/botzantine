import supabase from "./supabaseClient.js";

// Fetch the list of whitelisted clusters from supabase and return a list of config hashes
export const getWhitelistedClusters = async () => {
  try {
    // Fetch config_hashes where is_deposit_data_stored is false
    const { data, error } = await supabase
      .from("whitelisted_clusters")
      .select("config_hash")
      .is("is_deposit_data_stored", false);

    if (error) {
      throw error;
    }

    const configHashes = data.map((cluster) => cluster.config_hash);
    return configHashes;
  } catch (error) {
    console.error("Error fetching whitelisted clusters:", error.message);
    return null;
  }
};
