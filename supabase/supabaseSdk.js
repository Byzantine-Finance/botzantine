import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

// Returns a supabase client
export const supabaseClient = () => {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
}

// Count the number of lines in the whitelisted_clusters table
export const getNumberOfDV = async (client) => {
  const { count, error } = await client
    .from("whitelisted_clusters")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("Error fetching number of DV:", error.message);
    return null;
  }
  return count;
};

// Get the timestamp of the last row in whitelisted_clusters
export const getLastDVTimestamp = async (client) => {
  const { data, error } = await client
    .from("whitelisted_clusters")
    .select("timestamp")
    .order("timestamp", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error("Error fetching last timestamp:", error.message);
    return null;
  }
  return data.timestamp;
};

// Add a newly created cluster to the database
export const addNewClusterDB = async (client, tx_hash, config_hash, operators, timestamp) => {
  try {
    const { data, error } = await client
      .from("whitelisted_clusters")
      .insert([{ tx_hash, config_hash, operators, timestamp }]);

    if (error) {
      console.error("Error adding new cluster to database:", error.message);
      return null;
    }
    return data;
  } catch (error) {
    console.error("Error adding new cluster to database:", error.message);
    return null;
  }
};

// Fetch the list of whitelisted clusters from database and return a list of config hashes
export const getWhitelistedDVInCreation = async (client) => {
  try {
    // Fetch config_hashes where dv_status is 1_Cluster_proposed
    const { data, error } = await client
      .from("whitelisted_clusters")
      .select("config_hash")
      .eq("dv_status", "1_Cluster_proposed");

    if (error) {
      throw error;
    }

    const configHashes = data.map((cluster) => cluster.config_hash);
    return configHashes;
  } catch (error) {
    console.error("Error fetching cluster waiting for DKG:", error.message);
    return null;
  }
};

export const updateDatabase = async (client, updates, configHash) => {
  try {
    const { error } = await client
      .from("whitelisted_clusters")
      .update(updates)
      .eq("config_hash", configHash);

    if (error) {
      console.error("Error updating deposit_data_url:", error.message);
    }
  } catch (error) {
    console.error(
      "Error storing the url:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// Update the DB with the channel ID
export const updateDBwithChannelId = async (client, config_hash, channelId) => {
  const { data, error } = await client
    .from("whitelisted_clusters")
    .update({ channel_id: channelId })
    .eq("config_hash", config_hash);

  if (error) {
    console.error("Error updating DB with channel ID:", error.message);
    return null;
  }
  return data;
};
