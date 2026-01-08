import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Alert, Skeleton } from '@mui/material';
import { MessageListSkeleton } from '@/components/common/LoadingSkeleton';
import { useAuthStore } from '@/stores/authStore';
import { useChat, useChatSocket } from '@/hooks/chat/useChat';
import { useChatMessages } from '@/hooks/chat/useChatMessages';
import { useChatActions } from '@/hooks/chat/useChatActions';
import { ChatHeader } from '@/components/chat/header/ChatHeader';
import { ChatContent } from '@/components/chat/ChatContent';
import { ChatDialogs } from '@/components/chat/ChatDialogs';
import { webrtcService } from '@/services/webrtc';
import { getSocket } from '@/services/socket';

const ChatPage = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [quotedMessage, setQuotedMessage] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [selectedMessageForPoll, setSelectedMessageForPoll] = useState(null);

  const [dialogs, setDialogs] = useState({
    groupSettings: false,
    channelSettings: false,
    channelStats: false,
    advancedSearch: false,
    summary: false,
    fontSettings: false,
    themeSettings: false,
    fileGallery: false,
    poll: false,
    call: false,
    focusMode: false,
    blockUser: false,
    callData: null,
    incomingCall: null
  });

  const { chat, error: chatError, refetch: refetchChat } = useChat(chatId, user, navigate);
  const {
    messages,
    loading,
    hasMore,
    typingUsers,
    loadMoreMessages,
    addMessage,
    updateMessage,
    deleteMessage,
    refetch: refetchMessages
  } = useChatMessages(chatId, chat?.type, user);

  const {
    sendMessage,
    sendVoice,
    sendFile,
    sendLocation,
    handleTyping
  } = useChatActions(chatId);

  useChatSocket(
    chatId,
    user,
    navigate,
    addMessage,
    updateMessage,
    deleteMessage
  );

  useEffect(() => {
    if (!chatId || !user?.id) return;

    const socket = getSocket();
    if (socket) {
      webrtcService.initialize(socket, user.id);

      webrtcService.onIncomingCall = (data) => {
        setIncomingCall(data);
        setDialogs(prev => ({ ...prev, call: true, incomingCall: data }));
      };
    }

    return () => {
      webrtcService.onIncomingCall = null;
    };
  }, [chatId, user?.id]);

  const handleReply = useCallback((message, type = 'reply') => {
    if (type === 'quote') {
      setQuotedMessage(message);
    } else {
      setReplyTo(message);
    }
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyTo(null);
    setQuotedMessage(null);
  }, []);

  const handleMessageSelect = useCallback((message) => {
    const element = document.getElementById(`message-${message._id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.style.backgroundColor = 'rgba(25, 118, 210, 0.1)';
      setTimeout(() => {
        element.style.backgroundColor = '';
      }, 2000);
    }
  }, []);

  const handleCloseDialog = useCallback((dialogName) => {
    setDialogs(prev => {
      const newDialogs = { ...prev, [dialogName]: false };
      if (dialogName === 'call') {
        newDialogs.callData = null;
        newDialogs.incomingCall = null;
      }
      if (dialogName === 'summary') {
        setSelectedMessages([]);
      }
      if (dialogName === 'poll') {
        setSelectedMessageForPoll(null);
      }
      return newDialogs;
    });
  }, []);

  const handleOpenDialog = useCallback((dialogName, data = null) => {
    setDialogs(prev => ({ ...prev, [dialogName]: true, ...(data && { [dialogName + 'Data']: data }) }));
  }, []);

  const handleSummaryClick = useCallback(() => {
    handleOpenDialog('summary');
  }, [handleOpenDialog]);

  const handleFocusModeClick = useCallback(() => {
    handleOpenDialog('focusMode');
  }, [handleOpenDialog]);

  const handleBlockClick = useCallback(() => {
    if (!chat || chat.type !== 'private') return;
    handleOpenDialog('blockUser');
  }, [chat, handleOpenDialog]);

  if (loading && !chat) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Skeleton variant="text" width={200} height={32} />
        </Box>
        <MessageListSkeleton />
      </Box>
    );
  }

  if (chatError && !chat) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{chatError}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ChatHeader
        chat={chat}
        user={user}
        menuAnchor={menuAnchor}
        onMenuClick={(e) => setMenuAnchor(e.currentTarget)}
        onMenuClose={() => setMenuAnchor(null)}
        onAdvancedSearchClick={() => handleOpenDialog('advancedSearch')}
        onSummaryClick={handleSummaryClick}
        onFocusModeClick={handleFocusModeClick}
        onBlockClick={handleBlockClick}
        onGroupSettingsClick={() => handleOpenDialog('groupSettings')}
        onChannelSettingsClick={() => handleOpenDialog('channelSettings')}
        onChannelStatsClick={() => handleOpenDialog('channelStats')}
        onFontSettingsClick={() => handleOpenDialog('fontSettings')}
        onThemeSettingsClick={() => handleOpenDialog('themeSettings')}
        onFileGalleryClick={() => handleOpenDialog('fileGallery')}
        onPollClick={() => handleOpenDialog('poll')}
        onInfoClick={() => {
          if (chat?.type === 'group') {
            handleOpenDialog('groupSettings');
          }
        }}
      />

      <ChatContent
        messages={messages}
        onLoadMore={loadMoreMessages}
        hasMore={hasMore}
        onReply={handleReply}
        chatType={chat?.type}
        onUpdate={refetchMessages}
        chat={chat}
        onQuote={setQuotedMessage}
        typingUsers={typingUsers}
        replyTo={replyTo}
        onCancelReply={handleCancelReply}
        onSendMessage={sendMessage}
        onTyping={handleTyping}
        onSendVoice={sendVoice}
        onSendFile={sendFile}
        onSendLocation={sendLocation}
        quotedMessage={quotedMessage}
        onCancelQuote={() => setQuotedMessage(null)}
      />

      <ChatDialogs
        chat={chat}
        chatId={chatId}
        dialogs={{
          ...dialogs,
          selectedMessages,
          selectedMessageForPoll,
          incomingCall,
          onBlocked: () => navigate('/')
        }}
        onCloseDialog={handleCloseDialog}
        onChatUpdate={refetchChat}
        onMessagesUpdate={() => {
          refetchChat();
          refetchMessages();
        }}
        onMessageSelect={handleMessageSelect}
        user={user}
      />
    </Box>
  );
};

export default ChatPage;
