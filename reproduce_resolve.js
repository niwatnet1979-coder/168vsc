
const url = 'https://maps.app.goo.gl/Hbco4f8wYCqtkZbz9';

async function testResolve() {
    console.log(`Testing resolution for: ${url}`);
    try {
        const response = await fetch(url, {
            method: 'HEAD',
            redirect: 'follow',
        });
        console.log('Status:', response.status);
        console.log('Final URL:', response.url);
    } catch (e) {
        console.error('Error:', e);
    }
}

testResolve();
