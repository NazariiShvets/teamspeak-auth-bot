export interface WN8Service {
    /**
     * Get the recent WN8 stats for a given account ID
     * Recent WN8 stats are the WN8 stats for the last 1000 battles
     * 
     * @param args - The account ID to get the recent WN8 stats for
     * @returns The recent WN8 stats for the given account ID
     */
    getRecentWN8StatsByAccountID(args: { accountId: string }): Promise<number>;

    /**
     * Get the overall WN8 stats for a given account ID
     * Overall WN8 stats are the WN8 stats for all battles
     * 
     * @param args - The account ID to get the overall WN8 stats for
     * @returns The overall WN8 stats for the given account ID
     */
    getOverallWN8StatsByAccountID(args: { accountId: string }): Promise<{ wn8: number, battlesCount: number }>;
}