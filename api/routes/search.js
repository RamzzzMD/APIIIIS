const express = require('express');
const acodePlugin = require('../lib/acode');
const AlightMotion = require('../lib/alightmotion'); // Import class AlightMotion

const router = express.Router();

// Acode Plugin Search
router.get('/acode', async (req, res) => {
    const { query } = req.query;
    try {
        let result;
        if (query) {
            result = await acodePlugin.search(query);
        } else {
            result = await acodePlugin.list();
        }
        res.json({ status: true, creator: "Ranzz", data: result });
    } catch (error) {
        res.status(500).json({ status: false, creator: "Ranzz", message: error.message });
    }
});

// Acode Plugin Detail
router.get('/acode-detail', async (req, res) => {
    const { id } = req.query;
    if (!id) return res.status(400).json({ status: false, message: "Parameter 'id' diperlukan!" });
    try {
        const result = await acodePlugin.detail(id);
        res.json({ status: true, creator: "Ranzz", data: result });
    } catch (error) {
        res.status(500).json({ status: false, creator: "Ranzz", message: error.message });
    }
});

// AlightMotion Preset Metadata (Tanpa Login)
router.get('/alightmotion', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ status: false, message: "Parameter 'url' diperlukan!" });
    try {
        const am = new AlightMotion();
        const result = await am.getPresetMetadata(url);
        res.json({ status: true, creator: "Ranzz", data: result });
    } catch (error) {
        res.status(500).json({ status: false, creator: "Ranzz", message: error.message });
    }
});

module.exports = router;
