const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const FormData = require('form-data');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// FUNGSI SCRAPER SPOTIFY
// ==========================================
async function spotidown(url) {
    try {
        if (!url.includes('open.spotify.com')) throw new Error('Invalid url.');
        
        const inst = axios.create({
            baseURL: 'https://spotidown.app',
            headers: {
                'accept': '*/*',
                'accept-encoding': 'gzip, deflate, br',
                'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                'origin': 'https://spotidown.app',
                'referer': 'https://spotidown.app/en2',
                'sec-ch-ua': '"Chromium";v="137", "Not(A:Brand";v="24"',
                'sec-ch-ua-mobile': '?1',
                'sec-ch-ua-platform': '"Android"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-origin',
                'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'
            },
        });
        
        const { data: rc } = await axios.post('https://rynekoo-recaptcha.hf.space/action', {
            mode: 'v3',
            url: 'https://spotidown.app/en2',
            siteKey: '6LcXkaUqAAAAAGvO0z9Mg54lpG22HE4gkl3XYFTK'
        });
        
        if (!rc?.data?.token) throw new Error('Failed to get recaptcha token.');
        
        const { data: html, headers } = await inst.get('/en2');
        inst.defaults.headers.common['cookie'] = headers['set-cookie'].map(c => c.split(';')[0]).join('; ');
        
        const $ = cheerio.load(html);
        const hiddenField = $('form[name="spotifyurl"] input[type="hidden"]').filter((_, el) => $(el).attr('name')?.startsWith('_')).first();
        const tokenName = hiddenField.attr('name');
        const tokenValue = hiddenField.attr('value');
        
        if (!tokenName || !tokenValue) throw new Error('Failed to get hidden token field.');
        
        const actionForm = new FormData();
        actionForm.append('url', url);
        actionForm.append('g-recaptcha-response', rc.data.token);
        actionForm.append(tokenName, tokenValue);
        const { data: action } = await inst.post('/action', actionForm, {
            headers: actionForm.getHeaders()
        });
        
        if (action.error) throw new Error(action.message);
        const $action = cheerio.load(action.data);
        const tracks = [];
        
        $action('form[name="submitspurl"]').each((_, form) => {
            const $form = $action(form);
            tracks.push({
                data: $form.find('input[name="data"]').val(),
                base: $form.find('input[name="base"]').val(),
                token: $form.find('input[name="token"]').val(),
            });
        });
        
        const trackResults = [];
        let albumInfo = null;
        
        for (const track of tracks) {
            const trackForm = new FormData();
            trackForm.append('data', track.data);
            trackForm.append('base', track.base);
            trackForm.append('token', track.token);
            const { data } = await inst.post('/action/track', trackForm, {
                headers: trackForm.getHeaders()
            });
            
            if (data.error) throw new Error(data.message);
            
            const $track = cheerio.load(data.data);
            const trackData = JSON.parse(Buffer.from(track.data, 'base64').toString('utf8'));
            
            if (!albumInfo) {
                albumInfo = {
                    title: trackData.album || '',
                    artist: trackData.artist || '',
                    cover: trackData.cover || ''
                };
            }
            
            let downloadUrl = '';
            $track('a.abutton[id="popup"]').each((_, el) => {
                if (downloadUrl) return;
                const label = $track(el).find('span span').first().text().trim();
                if (label === 'Download Mp3') {
                    downloadUrl = $track(el).attr('href');
                }
            });
            
            trackResults.push({
                id: trackData.tid || '',
                title: trackData.name || '',
                artist: trackData.artist || '',
                duration: trackData.duration || '',
                cover: trackData.cover || '',
                download_url: downloadUrl
            });
        }
        
        return {
            album_info: albumInfo || {},
            tracks: trackResults
        };
    } catch (error) {
        throw new Error(error.message);
    }
}

// ==========================================
// ENDPOINT: DOWNLOADER
// ==========================================

// 1. Spotify Downloader (Baru)
app.get('/api/downloader/spotify', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ status: false, message: "Parameter 'url' diperlukan!" });
    
    try {
        const result = await spotidown(url);
        res.json({
            status: true,
            creator: "Ranzz",
            data: result
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            creator: "Ranzz",
            message: "Gagal memproses URL Spotify: " + error.message
        });
    }
});

// 2. TikTok Downloader (Telah Diperbarui ke API Asli)
app.get('/api/downloader/tiktok', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ status: false, message: "Parameter 'url' diperlukan!" });
    
    try {
        // Menggunakan public API TikWM untuk memproses URL TikTok (Gratis, Tanpa API Key)
        const response = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
        
        if (response.data && response.data.code === 0) {
            const result = response.data.data;
            res.json({
                status: true,
                creator: "Ranzz",
                data: {
                    title: result.title || "Tidak ada judul",
                    author: result.author?.nickname || "Tidak diketahui",
                    cover: result.cover,
                    no_watermark: result.play,
                    watermark: result.wmplay,
                    audio: result.music
                }
            });
        } else {
            throw new Error(response.data?.msg || "Gagal mengambil data dari TikTok");
        }
    } catch (error) {
        res.status(500).json({
            status: false,
            creator: "Ranzz",
            message: "Gagal memproses URL TikTok: " + error.message
        });
    }
});

// ==========================================
// ENDPOINT: ARTIFICIAL INTELLIGENCE
// ==========================================
app.post('/api/ai/chat', async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ status: false, message: "Pesan tidak boleh kosong!" });
    
    // Simulasi delay seolah-olah AI sedang memproses (1.5 detik)
    await new Promise(resolve => setTimeout(resolve, 1500));

    res.json({
        status: true,
        creator: "Ranzz",
        response: `Ini adalah balasan simulasi AI untuk pesan: "${message}". (Backend dapat dihubungkan ke OpenAI/Gemini di kemudian hari)`
    });
});

// Penanganan 404 API Route
app.use('/api', (req, res) => {
    res.status(404).json({ status: false, message: "Endpoint tidak ditemukan." });
});

// Wajib untuk Vercel Serverless Function
module.exports = app;
