import { useState, useRef, useEffect } from 'react';
import { Box, IconButton, TextField, Paper, Popover } from '@mui/material';
import { Send, Mic, AttachFile, EmojiEmotions, LocationOn } from '@mui/icons-material';
import EmojiPicker from 'emoji-picker-react';
import { useTheme } from '@mui/material/styles';
import VoiceRecorder from '@/components/chat/input/VoiceRecorder';
import LocationPicker from '@/components/chat/input/LocationPicker';
import ReplyMessage from '@/components/chat/message/ReplyMessage';
import QuoteMessage from '@/components/chat/message/QuoteMessage';

const MobileMessageInput = ({ 
  onSend, 
  onTyping, 
  replyTo, 
  onCancelReply,
  quotedMessage,
  onCancelQuote,
  onSendVoice,
  onSendFile,
  onSendLocation,
  chat
}) => {
  const theme = useTheme();
  const [message, setMessage] = useState('');
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerAnchor, setEmojiPickerAnchor] = useState(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (replyTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyTo]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && onSend) {
      const sendData = typeof onSend === 'function' && onSend.length > 1
        ? message.trim()
        : {
            content: message.trim(),
            replyTo: replyTo?._id || replyTo?.id || replyTo,
            quotedMessage: quotedMessage?._id || quotedMessage?.id || quotedMessage
          };
      
      if (typeof sendData === 'string') {
        const replyToId = replyTo?._id || replyTo?.id || replyTo;
        onSend(sendData, replyToId);
      } else {
        onSend(sendData);
      }
      
      setMessage('');
      if (onTyping) {
        onTyping(false);
      }
      if (onCancelReply) {
        onCancelReply();
      }
      if (onCancelQuote) {
        onCancelQuote();
      }
      setShowEmojiPicker(false);
      setEmojiPickerAnchor(null);
    }
  };

  const handleEmojiClick = (emojiData) => {
    setMessage((prev) => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  const handleChange = (e) => {
    setMessage(e.target.value);
    if (onTyping) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      onTyping(true);
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 1000);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file && onSendFile) {
      const replyToId = replyTo?._id || replyTo?.id || replyTo;
      onSendFile(file, replyToId);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  if (showVoiceRecorder) {
    return (
      <VoiceRecorder
        onRecordComplete={(blob) => {
          if (onSendVoice && blob) {
            const replyToId = replyTo?._id || replyTo?.id || replyTo;
            onSendVoice(blob, replyToId);
          }
          setShowVoiceRecorder(false);
        }}
        onCancel={() => setShowVoiceRecorder(false)}
      />
    );
  }

  return (
    <Box sx={{ bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider' }}>
      {replyTo && (
        <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
          <ReplyMessage replyTo={replyTo} onCancel={onCancelReply} />
        </Box>
      )}
      {quotedMessage && (
        <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
          <QuoteMessage quotedMessage={quotedMessage} onCancel={onCancelQuote} />
        </Box>
      )}
      
      <Paper
        component="form"
        onSubmit={handleSubmit}
        sx={{
          p: 1,
          mx: 1,
          mb: 1,
          display: 'flex',
          alignItems: 'flex-end',
          gap: 0.5,
          borderRadius: 4,
          bgcolor: 'background.default'
        }}
        elevation={0}
      >
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
          accept="image/*,video/*,audio/*"
        />
        
        <IconButton
          size="small"
          onClick={() => fileInputRef.current?.click()}
          sx={{ color: 'text.secondary' }}
        >
          <AttachFile />
        </IconButton>

        <IconButton
          size="small"
          onClick={() => setShowLocationPicker(true)}
          sx={{ color: 'text.secondary' }}
        >
          <LocationOn />
        </IconButton>

        <TextField
          inputRef={inputRef}
          fullWidth
          placeholder="پیام..."
          value={message}
          onChange={handleChange}
          onFocus={() => {
            if (message.trim() && onTyping) {
              onTyping(true);
            }
          }}
          size="small"
          multiline
          maxRows={4}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              bgcolor: 'background.paper',
              '& fieldset': {
                border: 'none'
              }
            }
          }}
        />

        <IconButton
          size="small"
          onClick={(e) => {
            setEmojiPickerAnchor(e.currentTarget);
            setShowEmojiPicker(!showEmojiPicker);
          }}
          sx={{ color: showEmojiPicker ? 'primary.main' : 'text.secondary' }}
        >
          <EmojiEmotions />
        </IconButton>

        {message.trim() ? (
          <IconButton
            type="submit"
            color="primary"
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              width: 36,
              height: 36,
              '&:hover': {
                bgcolor: 'primary.dark'
              }
            }}
          >
            <Send sx={{ fontSize: 20 }} />
          </IconButton>
        ) : (
          <IconButton
            onClick={() => setShowVoiceRecorder(true)}
            color="primary"
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              width: 36,
              height: 36,
              '&:hover': {
                bgcolor: 'primary.dark'
              }
            }}
          >
            <Mic sx={{ fontSize: 20 }} />
          </IconButton>
        )}
      </Paper>

      <Popover
        open={showEmojiPicker}
        anchorEl={emojiPickerAnchor}
        onClose={() => {
          setShowEmojiPicker(false);
          setEmojiPickerAnchor(null);
        }}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 1 }}>
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            autoFocusSearch={false}
            theme={theme.palette.mode === 'dark' ? 'dark' : 'light'}
            width={300}
            height={350}
          />
        </Box>
      </Popover>

      <LocationPicker
        open={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onLocationSelect={(location) => {
          if (onSendLocation && location) {
            const replyToId = replyTo?._id || replyTo?.id || replyTo;
            onSendLocation(location, replyToId);
          }
        }}
      />
    </Box>
  );
};

export default MobileMessageInput;

