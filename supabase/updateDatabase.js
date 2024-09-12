import supabase from "./supabaseClient.js";

const updateDatabase = async (updates, configHash) => {
  try {
    const { error } = await supabase
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

export { updateDatabase };
