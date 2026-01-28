import User from '../models/User.js';

export const parseMentions = async (content, chatId) => {
  if (!content) return { mentions: [], isMentionAll: false };

  const mentionRegex = /@(\w+)/g;
  const matches = content.match(mentionRegex);
  
  if (!matches) {
    const isMentionAll = content.includes('@all');
    return { mentions: [], isMentionAll };
  }

  const usernames = matches.map(match => match.substring(1)).filter(u => u !== 'all');
  const isMentionAll = matches.some(match => match === '@all');

  const Chat = (await import('../models/Chat.js')).default;
  const chat = await Chat.findById(chatId).populate('participants', '_id username');
  
  if (!chat) {
    return { mentions: [], isMentionAll };
  }

  const participantIds = chat.participants.map(p => p._id.toString());
  
  const mentionedUsers = await User.find({
    username: { $in: usernames },
    _id: { $in: participantIds }
  }).select('_id');

  const mentions = mentionedUsers.map(u => u._id);

  return { mentions, isMentionAll };
};

export const notifyMentions = async (message, chat, io) => {
  if (!message.mentions || message.mentions.length === 0 && !message.isMentionAll) {
    return;
  }

  const Chat = (await import('../models/Chat.js')).default;
  const populatedChat = await Chat.findById(chat._id).populate('participants', '_id');

  let userIdsToNotify = [];
  
  if (message.isMentionAll) {
    userIdsToNotify = populatedChat.participants
      .map(p => p._id.toString())
      .filter(id => id !== message.sender.toString());
  } else {
    userIdsToNotify = message.mentions
      .map(m => m.toString())
      .filter(id => id !== message.sender.toString());
  }

  userIdsToNotify.forEach(userId => {
    io.to(`user:${userId}`).emit('message:mentioned', {
      messageId: message._id,
      chatId: chat._id,
      chatName: chat.name,
      sender: message.sender,
      content: message.content
    });
  });
};







