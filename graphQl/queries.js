export const GetNewCreatedDVs = `query GetCreatedDVs($timestamp: BigInt!) {
    clusterCreateds(
        where: { timestamp_gt: $timestamp }
        orderBy: timestamp
        orderDirection: desc
    ) {
        id
        timestamp
        txHash
        splitAddress
        eigenPodAddr
        winners {
            nodeOp {
                nodeOpAddr
            }
        }
        vault {
            id
        }
    }
}`;