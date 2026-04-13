const express = require('express');
const acodePlugin = require('../lib/acode-plugin');

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

module.exports = router;
