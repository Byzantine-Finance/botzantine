import supabase from "./supabaseClient.js";

// Update the DB with the channel ID
export const updateDBwithChannelId = async (config_hash, channelId) => {
  const { data, error } = await supabase
    .from("whitelisted_clusters")
    .update({ channel_id: channelId })
    .eq("config_hash", config_hash);

  if (error) {
    console.error("Error updating DB with channel ID:", error.message);
    return null;
  }
  return data;
};
