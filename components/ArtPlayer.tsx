
import React, { useEffect, useRef } from 'react';
import Artplayer from 'artplayer';
import Hls from 'hls.js';

interface ArtPlayerProps {
  url: string;
  subtitles?: { url: string; label: string }[];
  headers?: Record<string, string>;
  className?: string;
}

const ArtPlayer: React.FC<ArtPlayerProps> = ({ url, subtitles = [], headers = {}, className = '' }) => {
  const artRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Artplayer | null>(null);

  useEffect(() => {
    if (!artRef.current) return;

    if (playerRef.current) {
      playerRef.current.destroy(false);
      playerRef.current = null;
    }

    const art = new Artplayer({
      container: artRef.current,
      url: url,
      autoplay: true, // Enable autoplay
      type: url.includes('.m3u8') || url.includes('playlist') ? 'm3u8' : 'auto',
      customType: {
        m3u8: function (video, url) {
          if (Hls.isSupported()) {
            const hlsConfig: any = {
              xhrSetup: (xhr: XMLHttpRequest, url: string) => {
                if (headers) {
                   Object.entries(headers).forEach(([key, value]) => {
                     if (key.toLowerCase() !== 'referer' && key.toLowerCase() !== 'user-agent') {
                       try {
                         xhr.setRequestHeader(key, String(value));
                       } catch (e) {
                         console.warn(`Failed to set header ${key}`, e);
                       }
                     }
                   });
                }
              }
            };
            
            const hls = new Hls(hlsConfig);
            hls.loadSource(url);
            hls.attachMedia(video);
            
            art.on('destroy', () => hls.destroy());
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = url;
          }
        },
      },
      settings: [
        {
          html: 'Subtitle',
          type: 'selector',
          selector: subtitles.map((sub, index) => ({
            html: sub.label,
            url: sub.url,
            default: index === 0,
          })),
          onSelect: function (item) {
            art.subtitle.url = item.url;
            return item.html;
          },
        },
      ],
      autoSize: false,
      playbackRate: true,
      aspectRatio: true,
      setting: true,
      hotkey: true,
      pip: true,
      mutex: true,
      fullscreen: true,
      fullscreenWeb: true,
      subtitleOffset: true,
      miniProgressBar: true,
      lock: true,
      fastForward: true,
      autoOrientation: true,
      theme: '#e50914',
      plugins: [],
    });

    playerRef.current = art;

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy(false);
        playerRef.current = null;
      }
    };
  }, [url, subtitles, headers]);

  return (
    <div 
      ref={artRef} 
      className={`w-full h-full bg-black ${className}`}
      style={{ minHeight: '400px' }} 
    ></div>
  );
};

export default ArtPlayer;
