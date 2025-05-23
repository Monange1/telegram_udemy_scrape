const express = require('express');
const path = require('path');
const { scrapeCourses } = require('./scraper');
const { automateEnrollment } = require('./automator');

const app = express();
const PORT = 4000;

// Basic middleware
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Explicit route for scripts.js
app.get('/scripts.js', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/scripts.js'));
});

// API routes
app.get('/api/courses/:count', async (req, res) => {
    try {
        console.log('Scraping request received for', req.params.count, 'courses');
        const courses = await scrapeCourses(parseInt(req.params.count));
        res.json(courses);
    } catch (error) {
        console.error('Scraping error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add enrollment endpoint
app.post('/api/enroll', async (req, res) => {
    try {
        const { courseUrl } = req.body;
        console.log('Starting enrollment for:', courseUrl);
        
        // Start the automation process
        automateEnrollment(courseUrl)
            .then(() => console.log('Enrollment completed successfully'))
            .catch(error => console.error('Enrollment failed:', error));
        
        // Respond immediately since the browser will open in a new window
        res.json({ message: 'Enrollment process started' });
    } catch (error) {
        console.error('Enrollment error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
}); 