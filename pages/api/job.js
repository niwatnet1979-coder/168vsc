import { DataManager } from '../../lib/dataManager'

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const { id } = req.query

    if (!id) {
        return res.status(400).json({ error: 'Job ID is required' })
    }

    try {
        const job = await DataManager.getJobById(id)

        if (!job) {
            return res.status(404).json({ error: 'Job not found' })
        }

        return res.status(200).json(job)
    } catch (error) {
        console.error('[API /api/job] Error:', error)
        return res.status(500).json({ error: 'Internal server error', details: error.message })
    }
}
