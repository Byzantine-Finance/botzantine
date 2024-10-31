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

/*================ Write Database ================*/

// Add a newly created cluster to the database
export const addNewClusterDB = async (client, id, tx_hash, config_hash, operators, vault_addr, dv_created_at) => {
  try {
    const { data, error } = await client
      .from("whitelisted_clusters")
      .insert([{ id, tx_hash, config_hash, operators, vault_addr, dv_created_at }]);

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

export const updateDatabase = async (client, updates, configHash) => {
  try {
    const { error } = await client
      .from("whitelisted_clusters")
      .update(updates)
      .eq("config_hash", configHash);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error updating whitelisted_clusters table: ", error.message);
    return null;
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

/*================ Read Database ================*/

// Count the number of lines in the whitelisted_clusters table
export const getNumberOfDV = async (client) => {
  try {
    const { count, error } = await client
      .from("whitelisted_clusters")
      .select("*", { count: "exact", head: true });
  
    if (error) {
      throw error;
    }
    return count;
  } catch (error) {
    console.error("Error fetching number of DV:", error.message);
    return null;
  }
};

export const getDKGTimestamp = async (client, configHash) => {
  try {
    const { data, error } = await client
      .from("whitelisted_clusters")
      .select("dkg_detected_at")
      .eq("config_hash", configHash)
      .single();

    if (error) {
      throw error;
    }
    return data.dkg_detected_at;
  } catch (error) {
    console.error("Error fetching DKG timestamp:", error.message);
    return null;
  }
}

// Get the timestamp of the last row in whitelisted_clusters
export const getLastDVTimestamp = async (client) => {
  try {
    const { data, error } = await client
      .from("whitelisted_clusters")
      .select("dv_created_at")
      .order("dv_created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      throw error;
    }
    return data.dv_created_at;
  } catch (error) {
    console.error("Error fetching last DV timestamp:", error.message);
    return null;
  }
};


// Fetch the list of whitelisted clusters in creation (waiting for DKG) from database and return a list of config hashes
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

// Fetch the list of whitelisted clusters in activation (waiting for Beacon Chain deposit) from database and return a list of config hashes
export const getWhitelistedDVInActivation = async (client) => {
  try {
    // Fetch config_hashes where dv_status is 2_DKG_performed
    const { data, error } = await client
      .from("whitelisted_clusters")
      .select("config_hash")
      .eq("dv_status", "2_DKG_performed");

    if (error) {
      throw error;
    }

    const configHashes = data.map((cluster) => cluster.config_hash);
    return configHashes;
  } catch (error) {
    console.error("Error fetching cluster waiting for activation:", error.message);
    return null;
  }
};
