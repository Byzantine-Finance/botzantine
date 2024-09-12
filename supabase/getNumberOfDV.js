import supabase from "./supabaseClient.js";

// Count the number of lines in the whitelisted_clusters table
export const getNumberOfDV = async () => {
  const { count, error } = await supabase
    .from("whitelisted_clusters")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("Error fetching number of DV:", error.message);
    return null;
  }
  return count;
};
