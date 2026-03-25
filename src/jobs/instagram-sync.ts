import 'dotenv/config';
import { ApifyClient } from 'apify-client';
import cron from 'node-cron';
import { InstagramMediaModel } from '../modules/instagram/instagram-model.js';

const client = new ApifyClient({ token: process.env.APIFY_TOKEN });

export const syncInstagramFeed = async (force = false) => {
    try {
        // 1. Check if we actually need to sync (unless 'force' is true)
        if (!force) {
            const lastPost = await InstagramMediaModel.findOne().sort({ lastSyncedAt: -1 });
            if (lastPost && lastPost.lastSyncedAt) {
                const hoursSinceLastSync = (Date.now() - new Date(lastPost.lastSyncedAt).getTime()) / (1000 * 60 * 60);
                
                // If synced less than 23 hours ago, skip to save credits
                if (hoursSinceLastSync < 23) {
                    console.log(`ℹ️ [Instagram] Skipping sync. Last update was ${hoursSinceLastSync.toFixed(1)} hours ago.`);
                    return;
                }
            }
        }

        console.log('🔄 [Instagram] Starting 24-hour sync process...');
        
        if (!process.env.MAIN_ABUJA_IG_URL || !process.env.APIFY_TOKEN) {
            console.error('❌ [Instagram] Missing APIFY_TOKEN or IG_URL');
            return;
        }

        const input = {
            "directUrls": [process.env.MAIN_ABUJA_IG_URL],
            "resultsLimit": 200,
            "resultsType": "posts"
        };

        const run = await client.actor("apify/instagram-scraper").call(input);
        const dataset = await client.dataset(run.defaultDatasetId).listItems();
        const items = dataset.items as any[];

        const operations = items.map((item) => ({
            updateOne: {
                filter: { instagramId: item.id },
                update: {
                    $set: {
                        caption: item.caption || "",
                        mediaType: item.type,
                        // Priority: Video URL -> Display URL
                        mediaUrl: item.videoUrl || item.displayUrl,
                        permalink: item.url,
                        thumbnailUrl: item.displayUrl,
                        timestamp: new Date(item.timestamp), 
                        lastSyncedAt: new Date()
                    }
                },
                upsert: true
            }
        }));

        if (operations.length > 0) {
            await InstagramMediaModel.bulkWrite(operations);
            console.log(`✅ [Instagram] Successfully synced ${items.length} posts.`);
        }
    } catch (error) {
        console.error('❌ [Instagram] Sync failed:', error);
    }
};

/**
 * 1. INITIAL ATTEMPT
 * Will only actually run if the DB data is older than 24 hours
 */
// syncInstagramFeed();

/**
 * 2. SCHEDULED JOB (Midnight daily)
 */
cron.schedule('0 0 * * *', () => {
    console.log('⏰ [Cron] Midnight trigger: Checking for updates...');
    syncInstagramFeed(true); // Force sync at midnight
});