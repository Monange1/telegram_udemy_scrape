document.addEventListener('DOMContentLoaded', () => {
    const scrapeButton = document.getElementById('scrapeButton');
    const courseCountInput = document.getElementById('courseCount');
    const courseList = document.getElementById('courseList');
    const loading = document.getElementById('loading');

    if (!scrapeButton) {
        console.error('Scrape button not found!');
        return;
    }

    scrapeButton.onclick = async () => {
        alert('Button clicked!'); // Test if button click works
        
        const count = courseCountInput.value;
        console.log('Count:', count);

        try {
            loading.classList.remove('hidden');
            
            const response = await fetch(`/api/courses/${count}`);
            console.log('Response:', response);
            
            const data = await response.json();
            console.log('Data:', data);

            // Simple display of results
            courseList.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
            
        } catch (error) {
            console.error('Error:', error);
            courseList.innerHTML = `<p>Error: ${error.message}</p>`;
        } finally {
            loading.classList.add('hidden');
        }
    };
}); 