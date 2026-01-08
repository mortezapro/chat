import GroupSettingsDialog from './dialogs/GroupSettingsDialog';
import ChannelSettingsDialog from './dialogs/ChannelSettingsDialog';
import ChannelStatsDialog from './dialogs/ChannelStatsDialog';
import AdvancedSearchDialog from './dialogs/AdvancedSearchDialog';
import MessageSummaryDialog from './dialogs/MessageSummaryDialog';
import FontSettingsDialog from './dialogs/FontSettingsDialog';
import CallDialog from './dialogs/CallDialog';
import ThemeSettingsDialog from '@/components/theme/ThemeSettingsDialog';
import FileGallery from '@/components/files/FileGallery';
import PollDialog from './dialogs/PollDialog';
import FocusModeDialog from './dialogs/FocusModeDialog';
import { BlockUserDialog } from './BlockUserDialog';

export const ChatDialogs = ({
  chat,
  chatId,
  dialogs,
  onCloseDialog,
  onChatUpdate,
  onMessagesUpdate,
  onMessageSelect,
  user
}) => {
  return (
    <>
      {chat?.type === 'group' && (
        <GroupSettingsDialog
          open={dialogs.groupSettings}
          onClose={() => onCloseDialog('groupSettings')}
          chat={chat}
          onUpdate={onChatUpdate}
        />
      )}

      <AdvancedSearchDialog
        open={dialogs.advancedSearch}
        onClose={() => onCloseDialog('advancedSearch')}
        chatId={chatId}
        onMessageSelect={onMessageSelect}
      />

      <MessageSummaryDialog
        open={dialogs.summary}
        onClose={() => onCloseDialog('summary')}
        selectedMessages={dialogs.selectedMessages || []}
        chatId={chatId}
        onSuccess={onMessagesUpdate}
      />

      <FontSettingsDialog
        open={dialogs.fontSettings}
        onClose={() => onCloseDialog('fontSettings')}
        chatId={chatId}
      />

      <CallDialog
        open={dialogs.call}
        onClose={() => onCloseDialog('call')}
        callType={dialogs.callData?.type || dialogs.incomingCall?.isVideo ? 'video' : 'audio'}
        targetUser={dialogs.callData?.targetUser}
        chatId={chatId}
        isIncoming={!!dialogs.incomingCall}
        callData={dialogs.incomingCall || dialogs.callData}
      />

      <ThemeSettingsDialog
        open={dialogs.themeSettings}
        onClose={() => onCloseDialog('themeSettings')}
      />

      <FileGallery
        open={dialogs.fileGallery}
        onClose={() => onCloseDialog('fileGallery')}
        chatId={chatId}
      />

      <FocusModeDialog
        open={dialogs.focusMode}
        onClose={() => onCloseDialog('focusMode')}
      />

      {chat?.type === 'private' && (
        <BlockUserDialog
          open={dialogs.blockUser}
          onClose={() => onCloseDialog('blockUser')}
          userId={(() => {
            const otherParticipant = chat.participants?.find((p) => 
              (p._id || p)?.toString() !== (user?.id || user?._id)?.toString()
            );
            return otherParticipant?._id || otherParticipant?.id || otherParticipant;
          })()}
          userName={(() => {
            const otherParticipant = chat.participants?.find((p) => 
              (p._id || p)?.toString() !== (user?.id || user?._id)?.toString()
            );
            return otherParticipant?.firstName && otherParticipant?.lastName
              ? `${otherParticipant.firstName} ${otherParticipant.lastName}`
              : otherParticipant?.username || 'کاربر';
          })()}
          onBlocked={() => {
            onCloseDialog('blockUser');
            if (dialogs.onBlocked) dialogs.onBlocked();
          }}
        />
      )}

      {chat?.type === 'channel' && (
        <>
          <ChannelSettingsDialog
            open={dialogs.channelSettings}
            onClose={() => onCloseDialog('channelSettings')}
            chat={chat}
            onUpdate={onChatUpdate}
          />

          <ChannelStatsDialog
            open={dialogs.channelStats}
            onClose={() => onCloseDialog('channelStats')}
            chatId={chatId}
          />

          <PollDialog
            open={dialogs.poll}
            onClose={() => onCloseDialog('poll')}
            messageId={dialogs.selectedMessageForPoll?._id}
            onSuccess={onMessagesUpdate}
          />
        </>
      )}
    </>
  );
};

