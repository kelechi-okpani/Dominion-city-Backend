import 'dotenv/config';
import { ApifyClient } from 'apify-client';
import cron from 'node-cron';
import { InstagramMediaModel } from '../modules/instagram/instagram-model.js';

// 1. Define the shape of the data coming from the scraper
interface ApifyInstagramResult {
    id: string;
    caption?: string;
    type: 'Image' | 'Video' | 'Sidecar';
    displayUrl: string;
    videoUrl?: string;
    url: string;
    timestamp: string;
}

const client = new ApifyClient({ token: process.env.APIFY_TOKEN });

// 2. Export the function properly
export const syncInstagramFeed = async () => {
    console.log('🔄 [Instagram] Starting sync process...');
    
    const input = {
        "directUrls": [process.env.MAIN_ABUJA_IG_URL],
        "resultsLimit": 100,
        "resultsType": "posts"
    };

    try {
        const run = await client.actor("apify/instagram-scraper").call(input);
        
        // Cast the results
        const dataset = await client.dataset(run.defaultDatasetId).listItems();
        const items = dataset.items as unknown as ApifyInstagramResult[];

        const operations = items.map((item) => {
            const isVideo = item.type === 'Video' || (item.type === 'Sidecar' && !!item.videoUrl);
            
            return {
                updateOne: {
                    filter: { instagramId: item.id },
                    update: {
                        $set: {
                            caption: item.caption || "",
                            mediaType: item.type,
                            mediaUrl: isVideo ? (item.videoUrl as string) : item.displayUrl,
                            permalink: item.url,
                            thumbnailUrl: item.displayUrl,
                            timestamp: new Date(item.timestamp), 
                            lastSyncedAt: new Date()
                        }
                    },
                    upsert: true
                }
            };
        });

        if (operations.length > 0) {
            await InstagramMediaModel.bulkWrite(operations as any); 
            console.log(`✅ [Instagram] Successfully synced ${items.length} posts.`);
        }
    } catch (error) {
        console.error('❌ [Instagram] Sync failed:', error);
    }
};

/**
 * SCHEDULED JOB (Call Later)
 * Runs every Monday at 11:00 AM
 */
cron.schedule('0 10 * * 1', () => {
    console.log('⏰ [Cron] Starting scheduled Monday 10 AM sync...');
    syncInstagramFeed();
});
