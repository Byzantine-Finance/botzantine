import supabase from "./supabaseClient.js";

// Fetch the list of whitelisted clusters from database and return a list of config hashes
export const getWhitelistedClusters = async () => {
  try {
    // Fetch config_hashes where dv_status is 1_Cluster_proposed
    const { data, error } = await supabase
      .from("whitelisted_clusters")
      .select("config_hash")
      .eq("dv_status", "1_Cluster_proposed");

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
