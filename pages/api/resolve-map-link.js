export default async function handler(req, res) {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        const response = await fetch(url, {
            method: 'HEAD',
            redirect: 'manual' // We want to see the redirect
        });

        // If it's a redirect, get the location
        if (response.status >= 300 && response.status < 400) {
            const location = response.headers.get('location');
            return res.status(200).json({ url: location });
        }

        // If it's 200, maybe it already resolved or fetch followed it (if manual not supported fully in this env)
        // But 'manual' should work in Node environment for fetch if using node-fetch or similar polyfill in Next.js
        // Actually, in newer Node, fetch is native.
        // Let's try to just fetch and let it follow redirects, then return the final URL.

        const responseFollow = await fetch(url);
        return res.status(200).json({ url: responseFollow.url });

    } catch (error) {
        console.error('Error resolving URL:', error);
        return res.status(500).json({ error: 'Failed to resolve URL' });
    }
}
