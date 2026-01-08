import { useState, useEffect, useRef } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { PlayArrow, Pause, VolumeUp } from '@mui/icons-material';
import { getFileUrl } from '@/utils/chatHelpers';

export const AudioPlayer = ({ audioUrl, isOwn }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration);
      });
      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime);
      });
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });
    }
  }, []);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        bgcolor: isOwn ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)',
        borderRadius: 2,
        p: 1.5,
        minWidth: 200,
        maxWidth: 300
      }}
    >
      <audio ref={audioRef} src={getFileUrl(audioUrl)} />
      <IconButton
        size="small"
        onClick={togglePlay}
        sx={{
          bgcolor: isOwn ? 'rgba(255,255,255,0.3)' : 'primary.main',
          color: 'white',
          '&:hover': {
            bgcolor: isOwn ? 'rgba(255,255,255,0.4)' : 'primary.dark'
          }
        }}
      >
        {isPlaying ? <Pause /> : <PlayArrow />}
      </IconButton>
      <Box sx={{ flex: 1 }}>
        <Box
          sx={{
            width: '100%',
            height: 4,
            bgcolor: isOwn ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)',
            borderRadius: 2,
            overflow: 'hidden',
            cursor: 'pointer',
            position: 'relative'
          }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percentage = clickX / rect.width;
            if (audioRef.current) {
              audioRef.current.currentTime = percentage * duration;
            }
          }}
        >
          <Box
            sx={{
              width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
              height: '100%',
              bgcolor: isOwn ? 'white' : 'primary.main',
              transition: 'width 0.1s'
            }}
          />
        </Box>
        <Typography variant="caption" sx={{ fontSize: '0.7rem', opacity: 0.8, display: 'block', mt: 0.5 }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </Typography>
      </Box>
      <VolumeUp sx={{ fontSize: '1rem', opacity: 0.7 }} />
    </Box>
  );
};

