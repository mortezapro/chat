import { useState, useRef, useEffect } from 'react';
import { Box, IconButton, LinearProgress, Typography, Tooltip } from '@mui/material';
import { Mic, Stop, PlayArrow, Pause, Delete, Send } from '@mui/icons-material';

const VoiceRecorder = ({ onRecordComplete, onCancel }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [recordedBlob, setRecordedBlob] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const mediaRecorderRef = useRef(null);
    const audioRef = useRef(null);
    const streamRef = useRef(null);
    const chunksRef = useRef([]);
    const intervalRef = useRef(null);

    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

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

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setRecordedBlob(blob);
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);
                setIsRecording(false);
                setDuration(0);
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
            setDuration(0);

            intervalRef.current = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);
        } catch (error) {
            console.error('Error starting recording:', error);
            alert('خطا در دسترسی به میکروفون');
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
            onRecordComplete(recordedBlob);
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
        setRecordedBlob(null);
        setAudioUrl(null);
        setIsRecording(false);
        setIsPlaying(false);
        setDuration(0);
        if (onCancel) {
            onCancel();
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
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
                alignItems: 'center',
                gap: 2
            }}
        >
            {!recordedBlob ? (
                <>
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
                        <>
                            <Tooltip title="توقف ضبط">
                                <IconButton
                                    color="error"
                                    onClick={stopRecording}
                                    sx={{ cursor: 'pointer' }}
                                >
                                    <Stop />
                                </IconButton>
                            </Tooltip>
                            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: '100%' }}>
                                    <LinearProgress
                                        variant="indeterminate"
                                        sx={{ height: 4, borderRadius: 2 }}
                                    />
                                </Box>
                                <Typography variant="body2" color="error" sx={{ minWidth: 50 }}>
                                    {formatTime(duration)}
                                </Typography>
                            </Box>
                        </>
                    )}
                </>
            ) : (
                <>
                    <audio
                        ref={audioRef}
                        src={audioUrl}
                        onEnded={() => setIsPlaying(false)}
                        onPause={() => setIsPlaying(false)}
                    />
                    <Tooltip title={isPlaying ? 'توقف' : 'پخش'}>
                        <IconButton
                            color="primary"
                            onClick={playPreview}
                            sx={{ cursor: 'pointer' }}
                        >
                            {isPlaying ? <Pause /> : <PlayArrow />}
                        </IconButton>
                    </Tooltip>
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: '100%' }}>
                            <LinearProgress
                                variant="determinate"
                                value={audioRef.current ? (audioRef.current.currentTime / audioRef.current.duration) * 100 : 0}
                                sx={{ height: 4, borderRadius: 2 }}
                            />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 50 }}>
                            {formatTime(duration)}
                        </Typography>
                    </Box>
                    <Tooltip title="ارسال">
                        <IconButton
                            color="primary"
                            onClick={handleSend}
                            sx={{ cursor: 'pointer' }}
                        >
                            <Send />
                        </IconButton>
                    </Tooltip>
                </>
            )}
            <Tooltip title="لغو">
                <IconButton
                    onClick={handleCancel}
                    sx={{ cursor: 'pointer' }}
                >
                    <Delete />
                </IconButton>
            </Tooltip>
        </Box>
    );
};

export default VoiceRecorder;

