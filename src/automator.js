const puppeteer = require('puppeteer');

async function automateEnrollment(courseUrl) {
    const browser = await puppeteer.launch({ 
        headless: false,
        defaultViewport: null,
        args: [
            '--start-maximized',
            '--force-device-scale-factor=0.8',
            '--disable-web-security',
            '--disable-gpu',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage'
        ]
    });

    try {
        const page = await browser.newPage();
        
        await page.setViewport(null);

        await page.evaluate(() => {
            document.body.style.zoom = "80%";
        });

        await page.setDefaultNavigationTimeout(30000);

        console.log('Opening Coursevania page:', courseUrl);
        await page.goto(courseUrl, { waitUntil: 'networkidle0' });
        console.log('Coursevania page loaded');

        await new Promise(resolve => setTimeout(resolve, 3000));

        try {
            await page.evaluate(() => {
                const buttons = document.querySelectorAll('button');
                buttons.forEach(button => {
                    if (button.textContent.includes('ALLOW')) {
                        button.click();
                    }
                });
            });
        } catch (error) {
            console.log('No notification popup found');
        }

        try {
            await page.evaluate(() => {
                const closeButtons = document.querySelectorAll('.modal-close, .popup-close, button.close');
                closeButtons.forEach(button => button.click());
            });
        } catch (error) {
            console.log('No popups found');
        }

        console.log('Looking for GET ON UDEMY button...');
        
        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
            await page.waitForSelector('.wp-block-button__link', {
                visible: true,
                timeout: 5000
            });

            const clicked = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('.wp-block-button__link'));
                const udemyButton = buttons.find(btn => 
                    btn.textContent.trim() === 'GET ON UDEMY' || 
                    btn.textContent.trim() === 'Get on Udemy'
                );
                
                if (udemyButton) {
                    udemyButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    udemyButton.click();
                    return true;
                }
                return false;
            });

            if (!clicked) {
                const buttonClicked = await page.evaluate(() => {
                    const courseDetails = document.querySelector('.course-details');
                    if (courseDetails) {
                        const button = courseDetails.querySelector('a.wp-block-button__link');
                        if (button) {
                            button.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            button.click();
                            return true;
                        }
                    }
                    return false;
                });

                if (!buttonClicked) {
                    console.log('Trying final fallback method...');
                    await page.evaluate(() => {
                        const allLinks = Array.from(document.querySelectorAll('a'));
                        const udemyLink = allLinks.find(link => 
                            link.textContent.trim() === 'GET ON UDEMY' &&
                            link.href.includes('udemy.com')
                        );
                        if (udemyLink) {
                            udemyLink.click();
                        }
                    });
                }
            }

            await new Promise(resolve => setTimeout(resolve, 3000));

            const pages = await browser.pages();
            const udemyPage = pages[pages.length - 1];
            
            if (!udemyPage) {
                throw new Error('Udemy page not found');
            }

            await udemyPage.bringToFront();
            console.log('Switched to Udemy page');

            const cartButtonSelectors = [
                'button[data-purpose="buy-this-course-button"]',
                'button[data-purpose="add-to-cart"]',
                'button[data-purpose="go-to-cart-button"]'
            ];

            let cartButtonFound = false;
            for (const selector of cartButtonSelectors) {
                try {
                    await udemyPage.waitForSelector(selector, { 
                        visible: true,
                        timeout: 5000 
                    });
                    
                    await udemyPage.evaluate((sel) => {
                        const button = document.querySelector(sel);
                        if (button) {
                            button.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            button.click();
                            return true;
                        }
                        return false;
                    }, selector);
                    
                    cartButtonFound = true;
                    console.log(`Clicked cart button with selector: ${selector}`);
                    break;
                } catch (error) {
                    console.log(`Cart button selector ${selector} not found, trying next...`);
                }
            }

            await page.close();
            console.log('Enrollment process completed');

        } catch (error) {
            console.error('Failed to handle Udemy page:', error);
            throw error;
        }

    } catch (error) {
        console.error('Automation error:', error);
        throw new Error(`Failed to enroll in course: ${error.message}`);
    }
}

module.exports = { automateEnrollment };