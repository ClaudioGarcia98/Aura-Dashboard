import { useRef } from 'react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useYouTubeVolume } from '../../hooks/useYouTubeVolume';
import { youtubeEmbedOrigin } from '../../services/youtube';

export default function EmbeddedTrailer({ videoId, title }) {
    const iframeRef = useRef(null);
    const volume = useSettingsStore(state => state.volume);
    const onLoad = useYouTubeVolume(iframeRef, videoId, volume);
    return <div className="anime-card-trailer" onClick={event => event.stopPropagation()}>
        <iframe
            ref={iframeRef}
            title={title}
            src={`https://www.youtube.com/embed/${encodeURIComponent(videoId)}?mute=1&enablejsapi=1&modestbranding=1&rel=0&playsinline=1&origin=${encodeURIComponent(youtubeEmbedOrigin())}`}
            onLoad={onLoad}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
        />
    </div>;
}
