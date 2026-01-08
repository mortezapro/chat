import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Avatar,
  Paper,
  Grid
} from '@mui/material';
import {
  Close,
  Videocam,
  VideocamOff,
  Mic,
  MicOff,
  CallEnd,
  ScreenShare,
  StopScreenShare
} from '@mui/icons-material';
import { useAuthStore } from '@/stores/authStore';
import { webrtcService } from '@/services/webrtc';

const CallDialog = ({ 
  open, 
  onClose, 
  callType, 
  targetUser, 
  chatId, 
  isIncoming = false,
  callData = null 
}) => {
  const { user } = useAuthStore();
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState(new Map());
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === 'video');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callStatus, setCallStatus] = useState(isIncoming ? 'ringing' : 'connecting');
  const localVideoRef = useRef(null);
  const remoteVideosRef = useRef(new Map());

  useEffect(() => {
    if (open) {
      webrtcService.onRemoteStream = (stream, userId) => {
        setRemoteStreams(prev => {
          const newMap = new Map(prev);
          newMap.set(userId, stream);
          return newMap;
        });
        
        setTimeout(() => {
          const videoElement = remoteVideosRef.current.get(userId);
          if (videoElement && stream) {
            videoElement.srcObject = stream;
          }
        }, 100);
      };

      webrtcService.onCallEnded = () => {
        handleEndCall();
      };

      if (!isIncoming) {
        startCall();
      }
    }

    return () => {
      if (!open) {
        handleEndCall();
      }
    };
  }, [open, isIncoming]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const startCall = async () => {
    try {
      setCallStatus('connecting');
      const stream = callType === 'video'
        ? await webrtcService.startCall(targetUser?._id || targetUser, chatId, true)
        : await webrtcService.startCall(targetUser?._id || targetUser, chatId, false);
      setLocalStream(stream);
      setCallStatus('ringing');
    } catch (error) {
      console.error('Error starting call:', error);
      setCallStatus('failed');
    }
  };

  const acceptCall = async () => {
    try {
      setCallStatus('connected');
      const stream = await webrtcService.acceptCall(callData);
      setLocalStream(stream);
    } catch (error) {
      console.error('Error accepting call:', error);
      setCallStatus('failed');
    }
  };

  const rejectCall = () => {
    if (callData) {
      webrtcService.rejectCall(callData);
    }
    handleEndCall();
  };

  const handleEndCall = () => {
    webrtcService.endCall();
    setLocalStream(null);
    setRemoteStreams(new Map());
    setCallStatus('ended');
    onClose();
  };

  const toggleVideo = () => {
    webrtcService.toggleVideo();
    setIsVideoEnabled(!isVideoEnabled);
  };

  const toggleAudio = () => {
    webrtcService.toggleAudio();
    setIsAudioEnabled(!isAudioEnabled);
  };

  const handleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        webrtcService.stopScreenShare();
        setIsScreenSharing(false);
      } else {
        await webrtcService.shareScreen();
        setIsScreenSharing(true);
      }
    } catch (error) {
      console.error('Error sharing screen:', error);
    }
  };

  const getUserName = (userData) => {
    if (!userData) return 'کاربر';
    return userData.firstName && userData.lastName
      ? `${userData.firstName} ${userData.lastName}`
      : userData.username || 'کاربر';
  };

  return (
    <Dialog
      open={open}
      onClose={handleEndCall}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'background.default',
          minHeight: 500
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            {callType === 'video' ? 'تماس تصویری' : 'تماس صوتی'}
          </Typography>
          <IconButton onClick={handleEndCall} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ position: 'relative', minHeight: 400 }}>
          {callType === 'video' && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={remoteStreams.size > 0 ? 6 : 12}>
                <Paper
                  sx={{
                    position: 'relative',
                    bgcolor: 'black',
                    borderRadius: 2,
                    overflow: 'hidden',
                    aspectRatio: '16/9',
                    minHeight: 300
                  }}
                >
                  {localStream && (
                    <Box
                      component="video"
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  )}
                  {!localStream && (
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: 'white'
                      }}
                    >
                      <Avatar sx={{ width: 80, height: 80, mb: 2 }}>
                        {user?.firstName?.[0] || user?.username?.[0] || 'U'}
                      </Avatar>
                      <Typography variant="h6">{getUserName(user)}</Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
              {Array.from(remoteStreams.entries()).map(([userId]) => (
                <Grid item xs={12} md={6} key={userId}>
                  <Paper
                    sx={{
                      position: 'relative',
                      bgcolor: 'black',
                      borderRadius: 2,
                      overflow: 'hidden',
                      aspectRatio: '16/9',
                      minHeight: 300
                    }}
                  >
                    <Box
                      component="video"
                      ref={(el) => {
                        if (el) remoteVideosRef.current.set(userId, el);
                      }}
                      autoPlay
                      playsInline
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}

          {callType === 'audio' && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 400,
                gap: 3
              }}
            >
              <Avatar
                src={targetUser?.avatar}
                sx={{ width: 120, height: 120 }}
              >
                {targetUser?.firstName?.[0] || targetUser?.username?.[0] || 'U'}
              </Avatar>
              <Typography variant="h5">
                {getUserName(targetUser)}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {callStatus === 'ringing' && 'در حال تماس...'}
                {callStatus === 'connecting' && 'در حال اتصال...'}
                {callStatus === 'connected' && 'متصل'}
              </Typography>
            </Box>
          )}

          <Box
            sx={{
              position: 'absolute',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: 2,
              bgcolor: 'rgba(0,0,0,0.7)',
              borderRadius: 3,
              p: 1.5
            }}
          >
            {callType === 'video' && (
              <IconButton
                onClick={toggleVideo}
                sx={{
                  bgcolor: isVideoEnabled ? 'primary.main' : 'error.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: isVideoEnabled ? 'primary.dark' : 'error.dark'
                  }
                }}
              >
                {isVideoEnabled ? <Videocam /> : <VideocamOff />}
              </IconButton>
            )}
            <IconButton
              onClick={toggleAudio}
              sx={{
                bgcolor: isAudioEnabled ? 'primary.main' : 'error.main',
                color: 'white',
                '&:hover': {
                  bgcolor: isAudioEnabled ? 'primary.dark' : 'error.dark'
                }
              }}
            >
              {isAudioEnabled ? <Mic /> : <MicOff />}
            </IconButton>
            {callType === 'video' && callStatus === 'connected' && (
              <IconButton
                onClick={handleScreenShare}
                sx={{
                  bgcolor: isScreenSharing ? 'primary.main' : 'rgba(255,255,255,0.2)',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'primary.dark'
                  }
                }}
              >
                {isScreenSharing ? <StopScreenShare /> : <ScreenShare />}
              </IconButton>
            )}
            <IconButton
              onClick={handleEndCall}
              sx={{
                bgcolor: 'error.main',
                color: 'white',
                '&:hover': {
                  bgcolor: 'error.dark'
                }
              }}
            >
              <CallEnd />
            </IconButton>
          </Box>
        </Box>
      </DialogContent>
      {isIncoming && callStatus === 'ringing' && (
        <DialogActions>
          <Button onClick={rejectCall} color="error" variant="contained">
            رد تماس
          </Button>
          <Button onClick={acceptCall} color="primary" variant="contained">
            پذیرش
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default CallDialog;

