// Multithreading
import { parentPort, workerData } from "node:worker_threads";
// Supabase
import { 
  supabaseClient,
  getLastDVTimestamp,
  getNumberOfDV,
  addNewClusterDB,
  updateDBwithChannelId
} from '../supabase/supabaseSdk.js';
// Obol
import { 
  obolClient,
  createObolCluster,
  getObolClusterDefinition
} from '../obol/obolSdk.js';
// Discord
import { messageNewCluster } from "../discord/messageNewCluster.js";
import { createPrivateChannel } from "../discord/createPrivateChannel.js";
// GraphQL
import { request } from 'graphql-request';
import { GetNewCreatedDVs } from '../graphQl/queries.js';
// Dotenv
import dotenv from "dotenv";
dotenv.config();

/*========= Thread config (run only once) =========*/

// Ethereum block time in milliseconds
const ETH_BLOCK_TIME = 12000; // 12 seconds
// Auction subgraph endpoint
const subgraphEndpoint = process.env.THE_GRAPH_ENDPOINT;
// Create a supabase client
const supabaseClientInst = supabaseClient();
// Create an Obol client
const obolClientInst = await obolClient();

/*================ Thread logic ================*/

// Check if a new DV has been created
const newDVHandler = async () => {
  let data;
  try {
    // Get the last DV timestamp from the database
    const lastDVTimestamp = await getLastDVTimestamp(supabaseClientInst);

    // Get all the new DV created
    data = await querySubgraph(GetNewCreatedDVs, { "timestamp": lastDVTimestamp });

    // If no new DV created, terminates the handler for this interval
    if (!data || data.clusterCreateds.length === 0) {
      console.log("No new DV created");
      return;
    }
  } catch (error) {
    console.error("Error fetching DV data:", error);
    return;
  }

  // Create Obol Clusters for each new Auction triggered
  for (let i = 0; i < data.clusterCreateds.length; i++) {
    // Parse the winners addresses
    const operators = parseWinnersAddr(data.clusterCreateds[i].winners);

    let number_dv = await getNumberOfDV(supabaseClientInst);

    try {
      
      // Create the cluster
      let config_hash = await createObolCluster(
        obolClientInst, 
        data.clusterCreateds[i].eigenPodAddr, 
        operators, 
        number_dv
      );
      if (config_hash === undefined) {
        throw new Error("Failed to create Obol cluster: config_hash is undefined");
      }
      
      const parsedOpAddr = operators.map((op) => op.address);
      await addNewClusterDB(
        supabaseClientInst,
        data.clusterCreateds[i].id,
        data.clusterCreateds[i].txHash,
        config_hash,
        parsedOpAddr,
        data.clusterCreateds[i].vault.id,
        data.clusterCreateds[i].timestamp
      );
      console.log("> New cluster added to database");
  
      await messageNewCluster(config_hash, parsedOpAddr);
      console.log("> New cluster message sent to Discord");
  
      const channel = await createPrivateChannel(config_hash, parsedOpAddr, number_dv);
      console.log("> Private channel created for the new cluster: ", channel.id);
      await updateDBwithChannelId(config_hash, channel.id);

      parentPort.postMessage({
        message: 'NEW CLUSTERS CREATED',
        data: data
      });
  
    } catch (error) {
      console.error("Error in newDVHandler function:", error);
    }
  }
};

// Check for new DV every `ETH_BLOCK_TIME`
setInterval(() => {
  (async () => {
      await newDVHandler();
  })();
}, ETH_BLOCK_TIME);

/*================ Utils ================*/

// Query the subgraph with query and variables
const querySubgraph = async (query, variables) => {
  try {
    const data = await request(subgraphEndpoint, query, variables, { timeout: 10000 });
    return data;
  } catch (error) {
    console.error("Error querying subgraph:", error);
  }
}

const parseWinnersAddr = (winners) => {
  return winners.map(winner => ({
    address: winner.nodeOp.nodeOpAddr
  }));
}


