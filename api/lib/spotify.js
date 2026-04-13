const axios = require('axios');
const cheerio = require('cheerio');
const FormData = require('form-data');

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
        const { data: action } = await inst.post('/action', actionForm, { headers: actionForm.getHeaders() });
        
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
            const { data } = await inst.post('/action/track', trackForm, { headers: trackForm.getHeaders() });
            
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
                if (label === 'Download Mp3') downloadUrl = $track(el).attr('href');
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
        
        return { album_info: albumInfo || {}, tracks: trackResults };
    } catch (error) {
        throw new Error(error.message);
    }
}

module.exports = spotidown;
