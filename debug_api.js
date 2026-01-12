const fetch = require('node-fetch');

async function checkApi() {
    try {
        const response = await fetch('http://localhost:5001/api/inventory');
        const data = await response.json();
        console.log(`Status: ${response.status}`);
        console.log(`Count: ${Array.isArray(data) ? data.length : 'Not Array'}`);
        if (Array.isArray(data) && data.length > 0) {
            console.log('First item:', data[0]);
        } else {
            console.log('Data:', data);
        }
    } catch (error) {
        console.error('Fetch failed:', error.message);
    }
}

checkApi();
