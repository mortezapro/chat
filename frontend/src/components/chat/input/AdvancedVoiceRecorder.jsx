import { useState, useRef, useEffect } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Tooltip,
  Slider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { Mic, Stop, PlayArrow, Pause, Send, Speed, TextFields } from '@mui/icons-material';

const AdvancedVoiceRecorder = ({ onRecordComplete, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [waveform, setWaveform] = useState([]);
  const [transcript, setTranscript] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);
  const [editStart, setEditStart] = useState(null);
  const [editEnd, setEditEnd] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const intervalRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const updateTime = () => setCurrentTime(audio.currentTime);
      audio.addEventListener('timeupdate', updateTime);
      return () => audio.removeEventListener('timeupdate', updateTime);
    }
  }, [audioUrl]);

  const generateWaveform = async (audioBuffer) => {
    const samples = 100;
    const blockSize = Math.floor(audioBuffer.length / samples);
    const waveformData = [];

    for (let i = 0; i < samples; i++) {
      const sum = audioBuffer.getChannelData(0).slice(i * blockSize, (i + 1) * blockSize)
        .reduce((acc, val) => acc + Math.abs(val), 0);
      waveformData.push(sum / blockSize);
    }

    const max = Math.max(...waveformData);
    return waveformData.map(val => (val / max) * 100);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      source.connect(analyserRef.current);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        const arrayBuffer = await blob.arrayBuffer();
        const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
        const waveformData = await generateWaveform(audioBuffer);
        setWaveform(waveformData);

        setIsRecording(false);
        setDuration(0);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }

        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
          transcribeAudio();
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      const updateWaveform = () => {
        if (analyserRef.current && isRecording) {
          const bufferLength = analyserRef.current.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          analyserRef.current.getByteFrequencyData(dataArray);
          
          const samples = 50;
          const blockSize = Math.floor(bufferLength / samples);
          const waveformData = [];
          
          for (let i = 0; i < samples; i++) {
            const sum = Array.from(dataArray.slice(i * blockSize, (i + 1) * blockSize))
              .reduce((acc, val) => acc + val, 0);
            waveformData.push((sum / blockSize / 255) * 100);
          }
          
          setWaveform(waveformData);
        }
      };

      intervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
        updateWaveform();
      }, 100);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('خطا در دسترسی به میکروفون');
    }
  };

  const transcribeAudio = async () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'fa-IR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setTranscript(transcript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
      };

      recognition.start();
    } catch (error) {
      console.error('Error in speech recognition:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  const playPreview = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleSend = () => {
    if (recordedBlob && onRecordComplete) {
      onRecordComplete(recordedBlob, transcript);
    }
    handleCancel();
  };

  const handleCancel = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setRecordedBlob(null);
    setAudioUrl(null);
    setWaveform([]);
    setTranscript('');
    setIsRecording(false);
    setIsPlaying(false);
    setDuration(0);
    setCurrentTime(0);
    if (onCancel) {
      onCancel();
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
        p: 2,
        bgcolor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        gap: 2
      }}
    >
      {waveform.length > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, height: 60, px: 1 }}>
          {waveform.map((height, index) => (
            <Box
              key={index}
              sx={{
                flex: 1,
                height: `${height}%`,
                minHeight: 2,
                bgcolor: isRecording ? 'error.main' : 'primary.main',
                borderRadius: 1,
                transition: 'height 0.1s'
              }}
            />
          ))}
        </Box>
      )}

      {!recordedBlob ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {!isRecording ? (
            <Tooltip title="شروع ضبط صدا">
              <IconButton
                color="error"
                onClick={startRecording}
                sx={{ cursor: 'pointer' }}
              >
                <Mic />
              </IconButton>
            </Tooltip>
          ) : (
            <Tooltip title="توقف ضبط">
              <IconButton
                color="error"
                onClick={stopRecording}
                sx={{ cursor: 'pointer' }}
              >
                <Stop />
              </IconButton>
            </Tooltip>
          )}
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="error" sx={{ textAlign: 'center' }}>
              {formatTime(duration)}
            </Typography>
          </Box>
        </Box>
      ) : (
        <>
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            onPause={() => setIsPlaying(false)}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Tooltip title={isPlaying ? 'توقف' : 'پخش'}>
              <IconButton
                color="primary"
                onClick={playPreview}
                sx={{ cursor: 'pointer' }}
              >
                {isPlaying ? <Pause /> : <PlayArrow />}
              </IconButton>
            </Tooltip>
            
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="caption" sx={{ minWidth: 50 }}>
                  {formatTime(currentTime)}
                </Typography>
                <Slider
                  size="small"
                  value={audioRef.current?.currentTime || 0}
                  max={audioRef.current?.duration || 0}
                  onChange={(e, value) => {
                    if (audioRef.current) {
                      audioRef.current.currentTime = value;
                    }
                  }}
                  sx={{ flex: 1 }}
                />
                <Typography variant="caption" sx={{ minWidth: 50 }}>
                  {formatTime(audioRef.current?.duration || 0)}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Speed sx={{ fontSize: 16 }} />
                <Slider
                  size="small"
                  value={playbackSpeed}
                  min={0.5}
                  max={2}
                  step={0.1}
                  onChange={(e, value) => setPlaybackSpeed(value)}
                  sx={{ flex: 1 }}
                />
                <Typography variant="caption" sx={{ minWidth: 40 }}>
                  {playbackSpeed.toFixed(1)}x
                </Typography>
              </Box>
            </Box>

            {transcript && (
              <Tooltip title="متن پیام">
                <IconButton
                  onClick={() => setShowTranscript(true)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TextFields />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title="ارسال">
              <IconButton
                color="primary"
                onClick={handleSend}
                sx={{ cursor: 'pointer' }}
              >
                <Send />
              </IconButton>
            </Tooltip>
          </Box>
        </>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={handleCancel} size="small">
          لغو
        </Button>
      </Box>

      <Dialog open={showTranscript} onClose={() => setShowTranscript(false)}>
        <DialogTitle>متن پیام صوتی</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="متن پیام صوتی..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTranscript(false)}>بستن</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdvancedVoiceRecorder;


