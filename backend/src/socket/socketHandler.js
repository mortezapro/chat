import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Chat from '../models/Chat.js';

export const initializeSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('توکن احراز هویت یافت نشد'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return next(new Error('کاربر یافت نشد'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('احراز هویت نامعتبر'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    
    await User.findByIdAndUpdate(userId, {
      isOnline: true,
      lastSeen: new Date()
    });

    socket.join(`user:${userId}`);

    const userChats = await Chat.find({ participants: userId });
    userChats.forEach(chat => {
      socket.join(`chat:${chat._id}`);
    });

    socket.broadcast.emit('user:online', { userId });

    socket.on('join:chat', (data) => {
      socket.join(`chat:${data.chatId}`);
    });

    socket.on('message:send', async (data) => {
      try {
        const { chatId, content, type, media, replyTo, location, tags, isSilent, notificationDelay } = data;

        if (!chatId) {
          return socket.emit('error', { message: 'شناسه چت ارسال نشده است' });
        }

        const chat = await Chat.findOne({
          _id: chatId,
          participants: userId
        });

        if (!chat) {
          return socket.emit('error', { message: 'چت یافت نشد' });
        }

        // Handle location messages
        let messageMedia = media;
        if (location && type === 'location') {
          messageMedia = {
            ...media,
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.address
          };
        }

        const message = new Message({
          chat: chatId,
          sender: userId,
          content: content || (type === 'location' ? (location?.address || `${location?.latitude}, ${location?.longitude}`) : ''),
          type: type || 'text',
          media: messageMedia,
          replyTo,
          location: location ? {
            latitude: location.latitude,
            longitude: location.longitude,
            address: location.address
          } : undefined,
          tags: tags || [],
          isSilent: isSilent || false,
          notificationDelay: notificationDelay || null
        });

        await message.save();
        await message.populate('sender', 'username firstName lastName avatar');
        await message.populate('mentions', 'username firstName lastName avatar');
        if (replyTo) {
          await message.populate('replyTo');
        }
        if (data.quotedMessage) {
          await message.populate('quotedMessage');
          if (message.quotedMessage) {
            await message.populate('quotedMessage.sender', 'username firstName lastName avatar');
          }
        }

        chat.lastMessage = message._id;
        chat.lastMessageAt = new Date();
        chat.activityLevel = (chat.activityLevel || 0) + 1;
        chat.lastActivityAt = new Date();
        await chat.save();
        
        try {
          await message.populate('reactions.user', 'username firstName lastName avatar');
        } catch (populateError) {
          console.error('Error populating reactions:', populateError);
        }

        io.to(`chat:${chatId}`).emit('message:new', message);
      } catch (error) {
        console.error('Error in message:send:', error);
        socket.emit('error', { message: 'خطا در ارسال پیام: ' + error.message });
      }
    });

    socket.on('message:typing', (data) => {
      if (!data?.chatId) {
        return;
      }
      socket.to(`chat:${data.chatId}`).emit('message:typing', {
        userId,
        chatId: data.chatId,
        isTyping: data.isTyping !== false
      });
    });

    socket.on('message:read', async (data) => {
      try {
        const { messageId, chatId } = data;
        
        if (!messageId || !chatId) {
          return;
        }
        
        const message = await Message.findById(messageId);
        if (!message) {
          return;
        }

        if (!message.readBy) {
          message.readBy = [];
        }

        const existingRead = message.readBy.find(
          read => read.user.toString() === userId.toString()
        );

        if (!existingRead) {
          message.readBy.push({
            user: userId,
            readAt: new Date()
          });
          await message.save();
        }

        // Update chat lastReadBy
        const chat = await Chat.findById(chatId);
        if (chat) {
          if (!chat.lastReadBy) {
            chat.lastReadBy = [];
          }
          
          const lastReadIndex = chat.lastReadBy.findIndex(
            lr => lr.user.toString() === userId.toString()
          );

          if (lastReadIndex >= 0) {
            chat.lastReadBy[lastReadIndex].lastReadMessage = messageId;
            chat.lastReadBy[lastReadIndex].lastReadAt = new Date();
          } else {
            chat.lastReadBy.push({
              user: userId,
              lastReadMessage: messageId,
              lastReadAt: new Date()
            });
          }
          await chat.save();
        }

        // Handle self-destruct messages
        if (message.selfDestruct?.enabled && chat) {
          if (!message.selfDestruct.readBy) {
            message.selfDestruct.readBy = [];
          }
          
          if (!message.selfDestruct.readBy.includes(userId.toString())) {
            message.selfDestruct.readBy.push(userId.toString());
            
            // Check if all participants have read
            const allRead = chat.participants.every(p => 
              message.selfDestruct.readBy.includes(p.toString())
            );
            
            if (allRead) {
              const delay = message.selfDestruct.delay || 30;
              message.selfDestruct.destructAt = new Date(Date.now() + delay * 1000);
              await message.save();
              
              // Schedule deletion
              setTimeout(async () => {
                try {
                  const msg = await Message.findById(messageId);
                  if (msg && msg.selfDestruct?.destructAt) {
                    msg.isDeleted = true;
                    msg.deletedAt = new Date();
                    msg.content = 'این پیام خودکار حذف شده است';
                    await msg.save();
                    
                    io.to(`chat:${chatId}`).emit('message:deleted', messageId);
                  }
                } catch (err) {
                  console.error('Error deleting self-destruct message:', err);
                }
              }, delay * 1000);
            } else {
              await message.save();
            }
          }
        }

        io.to(`chat:${chatId}`).emit('message:read', {
          messageId,
          userId
        });
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    });

    socket.on('disconnect', async () => {
      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen: new Date()
      });

      socket.broadcast.emit('user:offline', { userId });
    });
  });
};

