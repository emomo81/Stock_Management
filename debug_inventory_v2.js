const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5001,
    path: '/api/inventory',
    method: 'GET',
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
    res.setEncoding('utf8');
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
        try {
            const parsedData = JSON.parse(rawData);
            console.log(`DATA TYPE: ${typeof parsedData}`);
            console.log(`IS ARRAY: ${Array.isArray(parsedData)}`);
            if (Array.isArray(parsedData)) {
                console.log(`LENGTH: ${parsedData.length}`);
                if (parsedData.length > 0) {
                    console.log('SAMPLE ITEM:', JSON.stringify(parsedData[0], null, 2));
                    // Check fields
                    const item = parsedData[0];
                    console.log(`Has Name: ${!!item.name}`);
                    console.log(`Has SKU: ${!!item.sku}`);
                }
            } else {
                console.log('FULL RESPONSE:', rawData);
            }
        } catch (e) {
            console.error(e.message);
            console.log('RAW RESPONSE:', rawData);
        }
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.end();
