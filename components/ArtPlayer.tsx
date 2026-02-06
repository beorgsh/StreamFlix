
import React, { useEffect, useRef } from 'react';
import Artplayer from 'artplayer';
import Hls from 'hls.js';

interface ArtPlayerProps {
  url: string;
  subtitles?: { url: string; label: string }[];
  headers?: Record<string, string>;
  className?: string;
  poster?: string;
  onError?: () => void;
}

const ArtPlayer: React.FC<ArtPlayerProps> = ({ url, subtitles = [], headers = {}, className = '', poster = '', onError }) => {
  const artRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Artplayer | null>(null);

  useEffect(() => {
    if (!artRef.current) return;

    // Clean up existing instance if any
    if (playerRef.current) {
      playerRef.current.destroy(false);
      playerRef.current = null;
    }

    const art = new Artplayer({
      container: artRef.current,
      url: url,
      poster: poster,
      autoplay: true,
      volume: 0.8,
      isLive: false,
      muted: false,
      autoSize: true,
      autoMini: true,
      screenshot: true,
      setting: true,
      loop: false,
      flip: true,
      playbackRate: true,
      aspectRatio: true,
      fullscreen: true,
      fullscreenWeb: true,
      subtitleOffset: true,
      miniProgressBar: true,
      mutex: true,
      backdrop: true,
      playsInline: true,
      autoPlayback: true,
      airplay: true,
      theme: '#e50914',
      type: (url.includes('.m3u8') || url.includes('playlist')) ? 'm3u8' : 'auto',
      customType: {
        m3u8: function (video, url) {
          if (Hls.isSupported()) {
            const hlsConfig: any = {
              debug: false,
              enableWorker: true,
              lowLatencyMode: true,
              backBufferLength: 90,
              manifestLoadingTimeOut: 15000,
              manifestLoadingMaxRetry: 3,
              levelLoadingTimeOut: 15000,
              levelLoadingMaxRetry: 3,
              fragLoadingTimeOut: 15000,
              fragLoadingMaxRetry: 3,
              xhrSetup: (xhr: XMLHttpRequest, url: string) => {
                if (headers) {
                   Object.entries(headers).forEach(([key, value]) => {
                     // Skip unsafe headers that browsers block or that cause CORS issues
                     const forbidden = ['referer', 'user-agent', 'host', 'date', 'connection', 'content-length', 'origin'];
                     if (!forbidden.includes(key.toLowerCase())) {
                       try {
                         xhr.setRequestHeader(key, String(value));
                       } catch (e) {
                         // ignore
                       }
                     }
                   });
                }
              }
            };
            
            const hls = new Hls(hlsConfig);
            hls.loadSource(url);
            hls.attachMedia(video);
            
            let retryCount = 0;

            // Error handling for HLS
            hls.on(Hls.Events.ERROR, function (event, data) {
                if (data.fatal) {
                  switch (data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                      retryCount++;
                      if (retryCount >= 3) {
                         console.error(`HLS: Fatal network error max retries (${retryCount}) reached. Giving up.`);
                         hls.destroy();
                         if (onError) onError();
                      } else {
                         console.warn(`HLS: Network error encountered, attempting recovery (${retryCount}/3)...`);
                         hls.startLoad();
                      }
                      break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                      console.warn("HLS: Media error encountered, attempting recovery...");
                      hls.recoverMediaError();
                      break;
                    default:
                      console.error("HLS: Unrecoverable fatal error.");
                      hls.destroy();
                      if (onError) onError();
                      break;
                  }
                }
            });

            art.on('destroy', () => hls.destroy());
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = url;
            // Native HLS error handling (Safari)
            video.onerror = () => {
                if (onError) onError();
            };
          } else {
            art.notice.show = 'Does not support playback of this format';
            if (onError) onError();
          }
        },
      },
      settings: [
        {
          html: 'Subtitle',
          width: 250,
          tooltip: subtitles.length > 0 ? subtitles[0].label : 'Off',
          selector: [
            {
              html: 'Off',
              url: '',
            },
            ...subtitles.map((sub) => ({
              html: sub.label,
              url: sub.url,
            })),
          ],
          onSelect: function (item, $dom) {
            art.subtitle.url = item.url;
            art.subtitle.show = !!item.url;
            return item.html;
          },
        },
      ],
      plugins: [],
    });

    // Handle subtitle default selection manually if needed
    if (subtitles.length > 0) {
        art.subtitle.url = subtitles[0].url;
        art.subtitle.show = true;
    }

    // Handle general ArtPlayer errors
    art.on('error', () => {
        if (onError) onError();
    });

    playerRef.current = art;

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy(false);
        playerRef.current = null;
      }
    };
  }, [url, subtitles, headers, poster]);

  return (
    <div 
      ref={artRef} 
      className={`w-full h-full bg-black ${className}`}
      style={{ minHeight: '400px' }} 
    ></div>
  );
};

export default ArtPlayer;
