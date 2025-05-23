const axios = require('axios');
const cheerio = require('cheerio');

module.exports = {
    scrapeCourses: async function(count) {
        try {
            const channelUrl = 'https://t.me/s/coursevania';
            console.log(`Scraping ${count} courses from ${channelUrl}...`);
            
            const response = await axios.get(channelUrl);
            const $ = cheerio.load(response.data);
            const courses = [];

            // Get all messages and reverse them to start with the latest
            const messages = $('.tgme_widget_message_text').toArray().reverse();
            console.log(`Found ${messages.length} total messages`);

            // Select message containers
            for (const element of messages) {
                if (courses.length >= count) break;

                const messageText = $(element).text();
                console.log(`\nAnalyzing message:`, messageText.substring(0, 100) + '...');
                
                // Look for coursevania.com links
                const coursevaniaMatcher = messageText.match(/https:\/\/coursevania\.com\/courses\/[^\s\n]+/);
                if (!coursevaniaMatcher) {
                    console.log('No Coursevania link found in this message');
                    continue;
                }

                const coursevaniaUrl = coursevaniaMatcher[0].replace(/["\s].*$/, '');
                console.log('Found Coursevania URL:', coursevaniaUrl);

                try {
                    // Extract course name from the message
                    let courseName = 'Unnamed Course';
                    const lines = messageText.split('\n');
                    for (const line of lines) {
                        if (line.includes('FREE For Limited Enrolls') || line.includes('FREE For')) {
                            courseName = line.split(/FREE For (Limited )?Enrolls/)[0].trim();
                            break;
                        }
                    }

                    // Extract any coupon code if present
                    const couponMatch = messageText.match(/Code:?\s*([A-Z0-9]+)/i);
                    const couponCode = couponMatch ? couponMatch[1] : null;

                    // Create course object
                    const course = {
                        name: courseName,
                        url: coursevaniaUrl,
                        description: messageText.substring(0, 150).trim() + '...',
                        couponCode: couponCode,
                        timestamp: new Date().toISOString() // Add timestamp for reference
                    };

                    console.log('Adding course:', course.name);
                    courses.push(course);
                } catch (courseError) {
                    console.error('Error processing course:', courseError.message);
                    continue;
                }
            }

            console.log(`\nSuccessfully scraped ${courses.length} courses`);
            return courses;
        } catch (error) {
            console.error('Scraping error:', error.message);
            throw new Error(`Failed to scrape courses: ${error.message}`);
        }
    }
}; 