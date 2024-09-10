import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Fetch the list of whitelisted clusters from supabase and return a list of config hashes
export const getWhitelistedClusters = async () => {
  try {
    const { data, error } = await supabase.from("whitelisted_clusters").select("config_hash");

    if (error) {
      throw error;
    }

    const configHashes = data.map(cluster => cluster.config_hash);
    return configHashes;
  } catch (error) {
    console.error("Error fetching whitelisted clusters:", error.message);
    return null;
  }
};
