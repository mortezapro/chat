import { useState, useRef, useEffect } from 'react';
import { Box, TextField, IconButton, Tooltip, Menu, MenuItem, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Button, Select, FormControl, InputLabel, Popover, Typography } from '@mui/material';
import { Send, EmojiEmotions, AttachFile, Mic, LocationOn, MoreVert, NotificationsOff, Schedule, Label, AccessTime } from '@mui/icons-material';
import EmojiPicker from 'emoji-picker-react';
import { useTheme } from '@mui/material/styles';
import ReplyMessage from '../message/ReplyMessage';
import QuoteMessage from '../message/QuoteMessage';
import MentionAutocomplete from './MentionAutocomplete';
import AdvancedVoiceRecorder from './AdvancedVoiceRecorder';
import { useDropzone } from 'react-dropzone';
import { useAuthStore } from '@/stores/authStore';

const MessageInput = ({ onSend, onTyping, replyTo, quotedMessage: propQuotedMessage, onCancelReply, onCancelQuote, onSendVoice, onSendFile, onSendLocation, chat }) => {
  const theme = useTheme();
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerAnchor, setEmojiPickerAnchor] = useState(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [isSilent, setIsSilent] = useState(false);
  const [notificationDelay, setNotificationDelay] = useState(null);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [optionsMenuAnchor, setOptionsMenuAnchor] = useState(null);
  const [delayDialogOpen, setDelayDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [quotedMessage, setQuotedMessage] = useState(propQuotedMessage || null);
  const [mentionState, setMentionState] = useState({ open: false, query: '', position: null });

  useEffect(() => {
    if (propQuotedMessage) {
      setQuotedMessage(propQuotedMessage);
    }
  }, [propQuotedMessage]);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (replyTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyTo]);

  const handleMessageChange = (e) => {
    const value = e.target.value;
    setMessage(value);
    
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      const spaceIndex = textAfterAt.indexOf(' ');
      
      if (spaceIndex === -1 || textAfterAt.length === 0) {
        const query = spaceIndex === -1 ? textAfterAt : textAfterAt.substring(0, spaceIndex);
        
        if (chat && (chat.type === 'group' || chat.type === 'channel')) {
          const inputRect = e.target.getBoundingClientRect();
          setMentionState({
            open: true,
            query: query,
            position: {
              top: inputRect.top - 300,
              left: inputRect.left
            }
          });
        }
      } else {
        setMentionState({ open: false, query: '', position: null });
      }
    } else {
      setMentionState({ open: false, query: '', position: null });
    }
    
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

  const handleMentionSelect = (mentionText) => {
    const cursorPosition = inputRef.current.selectionStart;
    const textBeforeCursor = message.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    const textAfterCursor = message.substring(cursorPosition);
    
    const newMessage = 
      message.substring(0, lastAtIndex) + 
      mentionText + 
      textAfterCursor;
    
    setMessage(newMessage);
    setMentionState({ open: false, query: '', position: null });
    
    setTimeout(() => {
      if (inputRef.current) {
        const newPosition = lastAtIndex + mentionText.length;
        inputRef.current.setSelectionRange(newPosition, newPosition);
        inputRef.current.focus();
      }
    }, 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      const sendData = {
        content: message.trim(),
        replyTo: replyTo?._id,
        quotedMessage: quotedMessage?._id,
        isSilent,
        notificationDelay: notificationDelay ? parseInt(notificationDelay) : null,
        tags: tags.length > 0 ? tags : undefined,
        scheduledAt: scheduledAt || undefined
      };
      onSend(sendData);
      setMessage('');
      setTags([]);
      setIsSilent(false);
      setNotificationDelay(null);
      setScheduledAt('');
      setQuotedMessage(null);
      setMentionState({ open: false, query: '', position: null });
      setShowEmojiPicker(false);
      setEmojiPickerAnchor(null);
      if (onTyping) {
        onTyping(false);
      }
      if (onCancelReply) {
        onCancelReply();
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };


  const handleEmojiClick = (emojiData) => {
    setMessage((prev) => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && onSendFile) {
      onSendFile(file, replyTo?._id);
    }
    e.target.value = '';
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0 && onSendFile) {
        onSendFile(acceptedFiles[0], replyTo?._id);
      }
    },
    noClick: true,
    noKeyboard: true
  });

  if (showVoiceRecorder) {
    return (
      <AdvancedVoiceRecorder
        onRecordComplete={(blob, transcript) => {
          if (onSendVoice) {
            onSendVoice(blob, replyTo?._id, transcript);
          }
          setShowVoiceRecorder(false);
        }}
        onCancel={() => setShowVoiceRecorder(false)}
      />
    );
  }

  return (
    <Box sx={{ position: 'relative' }} {...getRootProps()}>
      <input {...getInputProps()} />
      {replyTo && (
        <Box sx={{ px: 2, pt: 2 }}>
          <ReplyMessage replyTo={replyTo} onCancel={onCancelReply} />
        </Box>
      )}
      {quotedMessage && (
        <Box sx={{ px: 2, pt: 2 }}>
          <QuoteMessage quotedMessage={quotedMessage} onCancel={() => {
            setQuotedMessage(null);
            if (onCancelQuote) onCancelQuote();
          }} />
        </Box>
      )}
      {isDragActive && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'primary.main',
            opacity: 0.1,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px dashed',
            borderColor: 'primary.main'
          }}
        >
          <Typography variant="h6" color="primary">
            فایل را اینجا رها کنید
          </Typography>
        </Box>
      )}
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ 
          p: 2, 
          display: 'flex', 
          gap: 1, 
          alignItems: 'flex-end',
          bgcolor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
          backdropFilter: 'blur(10px)',
          position: 'sticky',
          bottom: 0,
          zIndex: 10
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
          accept="image/*,video/*,audio/*"
        />
        <Tooltip title="افزودن فایل">
          <IconButton
            color="default"
            sx={{ cursor: 'pointer' }}
            onClick={() => fileInputRef.current?.click()}
          >
            <AttachFile />
          </IconButton>
        </Tooltip>
        <Tooltip title="ضبط صدا">
          <IconButton
            color="default"
            sx={{ cursor: 'pointer' }}
            onClick={() => setShowVoiceRecorder(true)}
          >
            <Mic />
          </IconButton>
        </Tooltip>
        <Tooltip title="اشتراک موقعیت">
          <IconButton
            color="default"
            sx={{ cursor: 'pointer' }}
            onClick={() => setShowLocationPicker(true)}
          >
            <LocationOn />
          </IconButton>
        </Tooltip>
        <Tooltip title="گزینه‌های بیشتر">
          <IconButton
            color="default"
            sx={{ cursor: 'pointer' }}
            onClick={(e) => setOptionsMenuAnchor(e.currentTarget)}
          >
            <MoreVert />
          </IconButton>
        </Tooltip>
        
        <Box sx={{ flex: 1, position: 'relative' }}>
          {tags.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
              {tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  size="small"
                  onDelete={() => setTags(tags.filter((_, i) => i !== index))}
                  icon={<Label fontSize="small" />}
                />
              ))}
            </Box>
          )}
          <TextField
            inputRef={inputRef}
            fullWidth
            placeholder="پیام خود را بنویسید... (Enter برای ارسال، Shift+Enter برای خط جدید)"
            value={message}
            onChange={handleMessageChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (message.trim() && onTyping) {
                onTyping(true);
              }
            }}
            size="small"
            multiline
            maxRows={4}
            autoFocus
            className="modern-input"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                bgcolor: 'background.default',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: 'action.hover'
                },
                '&.Mui-focused': {
                  bgcolor: 'background.paper',
                  boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)'
                }
              },
              '& .MuiInputBase-input': {
                direction: 'rtl',
                textAlign: 'right'
              }
            }}
          />
          {mentionState.open && (
            <MentionAutocomplete
              open={mentionState.open}
              position={mentionState.position}
              query={mentionState.query}
              chat={chat}
              onSelect={handleMentionSelect}
              onClose={() => setMentionState({ open: false, query: '', position: null })}
            />
          )}
        </Box>

        <Tooltip title="ایموجی">
          <IconButton
            color={showEmojiPicker ? 'primary' : 'default'}
            onClick={(e) => {
              setEmojiPickerAnchor(e.currentTarget);
              setShowEmojiPicker(!showEmojiPicker);
            }}
            sx={{ cursor: 'pointer' }}
          >
            <EmojiEmotions />
          </IconButton>
        </Tooltip>

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
              width={350}
              height={400}
            />
          </Box>
        </Popover>

        <IconButton
          type="submit"
          color="primary"
          disabled={!message.trim()}
          sx={{ 
            cursor: 'pointer',
            bgcolor: 'primary.main',
            color: 'white',
            width: 40,
            height: 40,
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: 'primary.dark',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
            },
            '&:disabled': {
              bgcolor: 'action.disabledBackground',
              color: 'action.disabled'
            }
          }}
        >
          <Send />
        </IconButton>
      </Box>

      <Menu
        anchorEl={optionsMenuAnchor}
        open={Boolean(optionsMenuAnchor)}
        onClose={() => setOptionsMenuAnchor(null)}
      >
        <MenuItem onClick={() => {
          setIsSilent(!isSilent);
          setOptionsMenuAnchor(null);
        }}>
          <NotificationsOff sx={{ mr: 1 }} />
          {isSilent ? 'فعال کردن نوتیفیکیشن' : 'ارسال بدون نوتیفیکیشن'}
        </MenuItem>
        <MenuItem onClick={() => {
          setDelayDialogOpen(true);
          setOptionsMenuAnchor(null);
        }}>
          <Schedule sx={{ mr: 1 }} />
          نوتیفیکیشن با تأخیر
        </MenuItem>
        <MenuItem onClick={() => {
          setScheduleDialogOpen(true);
          setOptionsMenuAnchor(null);
        }}>
          <AccessTime sx={{ mr: 1 }} />
          برنامه‌ریزی پست
        </MenuItem>
        <MenuItem onClick={() => {
          const tag = prompt('تگ را وارد کنید:');
          if (tag) {
            setTagInput(tag);
            handleAddTag();
          }
          setOptionsMenuAnchor(null);
        }}>
          <Label sx={{ mr: 1 }} />
          افزودن تگ
        </MenuItem>
      </Menu>

      <Dialog open={delayDialogOpen} onClose={() => setDelayDialogOpen(false)}>
        <DialogTitle>تأخیر نوتیفیکیشن</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>زمان تأخیر</InputLabel>
            <Select
              value={notificationDelay || ''}
              onChange={(e) => setNotificationDelay(e.target.value)}
              label="زمان تأخیر"
            >
              <MenuItem value="">بدون تأخیر</MenuItem>
              <MenuItem value="300">۵ دقیقه</MenuItem>
              <MenuItem value="600">۱۰ دقیقه</MenuItem>
              <MenuItem value="900">۱۵ دقیقه</MenuItem>
              <MenuItem value="1800">۳۰ دقیقه</MenuItem>
              <MenuItem value="3600">یک ساعت</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setNotificationDelay(null);
            setDelayDialogOpen(false);
          }}>انصراف</Button>
          <Button onClick={() => setDelayDialogOpen(false)} variant="contained">
            تأیید
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={scheduleDialogOpen} onClose={() => setScheduleDialogOpen(false)}>
        <DialogTitle>برنامه‌ریزی پست</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="زمان ارسال"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ mt: 2 }}
          />
          {scheduledAt && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              پست در تاریخ {new Date(scheduledAt).toLocaleString('fa-IR')} ارسال خواهد شد
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setScheduledAt('');
            setScheduleDialogOpen(false);
          }}>انصراف</Button>
          <Button onClick={() => setScheduleDialogOpen(false)} variant="contained">
            تأیید
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MessageInput;

