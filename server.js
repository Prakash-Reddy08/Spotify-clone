const express = require("express");
require('dotenv').config();
const cors = require('cors');
const lyricsFinder = require('lyrics-finder');
const path = require('path')
//** third party library
const SpotifyWebApi = require("spotify-web-api-node");
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT;

app.post('/refresh', (req, res) => {
    const refreshToken = req.body.refreshToken;
    const spotifyApi = new SpotifyWebApi({
        redirectUri: process.env.REDIRECT_URI,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken
    });
    spotifyApi
        .refreshAccessToken()
        .then(data => {
            res.json({
                accessToken: data.body.access_token,
                expiresIn: data.body.expires_in,
            })
        })
        .catch(err => {
            res.sendStatus(400)
        })
})

app.post('/login', (req, res) => {
    const { code } = req.body;
    const spotifyApi = new SpotifyWebApi({
        redirectUri: process.env.REDIRECT_URI,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
    })
    spotifyApi.authorizationCodeGrant(code).then((data) => {
        const { access_token, refresh_token, expires_in } = data.body;
        res.status(200).json({
            accessToken: access_token,
            refreshToken: refresh_token,
            expiresIn: expires_in
        })
    }).catch((err) => {

        res.sendStatus(400).json({ err });
    })
});
app.get('/lyrics', async (req, res) => {
    const lyrics = await lyricsFinder(req.query.artist, req.query.track) || "No Lyrics Found"
    res.json({ lyrics })
})

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'client/build')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'))
    })
}
else {
    app.get('/', (req, res) => {
        res.send('api running');
    })
}
app.listen(PORT || 3001, () => {
    console.log('server started');
})