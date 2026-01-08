import { Box } from '@mui/material';
import MessageList from './message/MessageList';
import TypingIndicator from './message/TypingIndicator';
import MessageInput from './input/MessageInput';
import { useThemeSettings } from '@/components/theme/ThemeProvider';

export const ChatContent = ({
  messages,
  onLoadMore,
  hasMore,
  onReply,
  chatType,
  onUpdate,
  chat,
  onQuote,
  typingUsers,
  replyTo,
  onCancelReply,
  onSendMessage,
  onTyping,
  onSendVoice,
  onSendFile,
  onSendLocation,
  quotedMessage,
  onCancelQuote
}) => {
  const themeSettings = useThemeSettings();
  const chatBackground = themeSettings?.chatBackground || null;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          backgroundImage: chatBackground
            ? `url(${chatBackground})`
            : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          position: 'relative',
          '&::before': chatBackground ? {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(255, 255, 255, 0.7)',
            zIndex: 0
          } : {}
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1, flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <MessageList
            messages={messages}
            onLoadMore={onLoadMore}
            hasMore={hasMore}
            onReply={onReply}
            chatType={chatType}
            onUpdate={onUpdate}
            chat={chat}
            onQuote={onQuote}
          />
        </Box>
      </Box>

      <TypingIndicator typingUsers={typingUsers} chat={chat} />

      <Box sx={{ borderTop: 1, borderColor: 'divider', position: 'relative', zIndex: 1, bgcolor: 'background.paper' }}>
        <MessageInput
          onSend={onSendMessage}
          onTyping={onTyping}
          replyTo={replyTo}
          onCancelReply={onCancelReply}
          onSendVoice={onSendVoice}
          onSendFile={onSendFile}
          onSendLocation={onSendLocation}
          chat={chat}
          quotedMessage={quotedMessage}
          onCancelQuote={onCancelQuote}
        />
      </Box>
    </Box>
  );
};

