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

// ==========================================
// ALIGHT MOTION FULL FEATURES (DARI CLI)
// ==========================================

// 1. AlightMotion Login (Kirim Magic Link ke Email)
router.post('/alightmotion/login', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ status: false, message: "Parameter 'email' diperlukan!" });
    
    try {
        const am = new AlightMotion({ email });
        const result = await am.login();
        res.json({ 
            status: true, 
            creator: "Ranzz", 
            message: "Magic link berhasil dikirim! Silakan periksa kotak masuk email Anda.",
            data: result 
        });
    } catch (error) {
        res.status(500).json({ status: false, creator: "Ranzz", message: error.message });
    }
});

// 2. AlightMotion Verify Link (Verifikasi Magic Link)
router.post('/alightmotion/verify', async (req, res) => {
    const { email, url } = req.body; // url ini adalah magic link dari email
    if (!email || !url) return res.status(400).json({ status: false, message: "Parameter 'email' dan 'url' (magic link) diperlukan!" });
    
    try {
        const am = new AlightMotion({ email });
        const result = await am.verifyLink(url);
        res.json({ status: true, creator: "Ranzz", data: result });
    } catch (error) {
        res.status(500).json({ status: false, creator: "Ranzz", message: error.message });
    }
});

// 3. AlightMotion Refresh Token
router.post('/alightmotion/refresh', async (req, res) => {
    const { refresh_token } = req.body;
    if (!refresh_token) return res.status(400).json({ status: false, message: "Parameter 'refresh_token' diperlukan!" });
    
    try {
        const am = new AlightMotion();
        const result = await am.refreshTokens(refresh_token);
        res.json({ status: true, creator: "Ranzz", data: result });
    } catch (error) {
        res.status(500).json({ status: false, creator: "Ranzz", message: error.message });
    }
});

// 4. AlightMotion Account Info
router.post('/alightmotion/account', async (req, res) => {
    const { token } = req.body; // idToken
    if (!token) return res.status(400).json({ status: false, message: "Parameter 'token' (idToken) diperlukan!" });
    
    try {
        const am = new AlightMotion();
        am.initialize = true;
        am.token = token; // Set token manual untuk bypass login flow
        
        const result = await am.accountInfo();
        res.json({ status: true, creator: "Ranzz", data: result });
    } catch (error) {
        res.status(500).json({ status: false, creator: "Ranzz", message: error.message });
    }
});

// 5. AlightMotion Preset Download (File ZIP)
router.post('/alightmotion/download', async (req, res) => {
    const { url, token } = req.body; // url preset dan idToken
    if (!url || !token) return res.status(400).json({ status: false, message: "Parameter 'url' dan 'token' (idToken) diperlukan!" });
    
    try {
        const am = new AlightMotion();
        am.initialize = true;
        am.token = token;
        
        const buffer = await am.getPresetDownload(url);
        
        // Mengirimkan response berupa file mentah (ZIP) agar otomatis terunduh/bisa disimpan
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename="alight_preset.zip"');
        res.send(Buffer.from(buffer));
    } catch (error) {
        res.status(500).json({ status: false, creator: "Ranzz", message: error.message });
    }
});

module.exports = router;
