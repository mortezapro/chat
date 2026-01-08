import { useMemo } from 'react';
import { getChatName } from '@/utils/chatHelpers';

export const useFilteredChats = (chats, chatFilter, chatSearchQuery, searchQuery, user) => {
  return useMemo(() => {
    return chats.filter(chat => {
      if (!chat) return false;

      let matches = true;

      if (chatFilter === 'private') {
        matches = matches && chat.type === 'private';
      } else if (chatFilter === 'groups') {
        matches = matches && chat.type === 'group';
      } else if (chatFilter === 'channels') {
        matches = matches && chat.type === 'channel';
      }

      const searchTerm = (chatSearchQuery || searchQuery).toLowerCase();
      if (searchTerm) {
        const chatName = getChatName(chat, user).toLowerCase();
        const participantMatch = chat.participants?.some(p =>
          (p.firstName || '').toLowerCase().includes(searchTerm) ||
          (p.lastName || '').toLowerCase().includes(searchTerm) ||
          (p.username || '').toLowerCase().includes(searchTerm)
        );
        matches = matches && (chatName.includes(searchTerm) || participantMatch);
      }

      return matches;
    });
  }, [chats, chatFilter, chatSearchQuery, searchQuery, user]);
};

