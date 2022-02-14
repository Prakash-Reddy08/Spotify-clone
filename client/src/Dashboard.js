import React from 'react'
import { useState, useEffect } from 'react';
import { Container, Form } from 'react-bootstrap';
import useAuth from './useAuth'
import SpotifyWebApi from 'spotify-web-api-node';
import TrackSearchResult from './TrackSearchResult';
import Player from './Player';
import axios from 'axios';

const spotifyApi = new SpotifyWebApi({
    clientId: process.env.REACT_APP_CLIENT_ID
})
const Dashboard = ({ code }) => {
    const accessToken = useAuth(code);
    console.log(accessToken);
    const [search, setSearch] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [playingTrack, setPlayingTrack] = useState();
    const [lyrics, setLyrics] = useState('');
    const chooseTrack = (track) => {
        setPlayingTrack(track);
        setSearch('');
        setLyrics('')
    }

    useEffect(() => {
        if (!playingTrack) return;
        axios.get(`${process.env.REACT_APP_SERVER_URL}/lyrics`, {
            params: {
                track: playingTrack.title,
                artist: playingTrack.artist
            }
        }).then((res) => {
            setLyrics(res.data.lyrics)
        })
    }, [playingTrack])

    useEffect(() => {
        if (!accessToken) return;
        spotifyApi.setAccessToken(accessToken);
    }, [accessToken])
    let cancle = false;
    useEffect(() => {
        if (!search) return setSearchResults([]);
        if (!accessToken) return;
        spotifyApi.searchTracks(search).then((res) => {
            if (cancle) return;
            setSearchResults(res.body.tracks.items.map(track => {
                const smallestAlbumImage = track.album.images.reduce(
                    (smallest, image) => {
                        if (image.height < smallest.height) return image
                        return smallest
                    },
                    track.album.images[0]
                )
                return {
                    artist: track.artists[0].name,
                    title: track.name,
                    uri: track.uri,
                    albumUrl: smallestAlbumImage.url,
                }
            })
            )
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
        return () => cancle = true;
    }, [search, accessToken])
    return (
        <Container className="d-flex flex-column py-2" style={{ height: "100vh" }}>
            <Form.Control type='search' placeholder="Search Songe/Artist"
                value={search} onChange={e => setSearch(e.target.value)} />
            <div className="flex-grow-1 my-2" style={{ overflowY: "auto" }}>
                {searchResults.map(track => (
                    <TrackSearchResult
                        track={track}
                        key={track.uri}
                        chooseTrack={chooseTrack}
                    />
                ))}
                {searchResults.length === 0 && (
                    <div className="text-center" style={{ whiteSpace: "pre" }}>
                        {lyrics}
                    </div>
                )}
            </div>
            <div>
                <Player accessToken={accessToken}
                    trackUri={playingTrack?.uri}
                />
            </div>
        </Container>
    )
}

export default Dashboard