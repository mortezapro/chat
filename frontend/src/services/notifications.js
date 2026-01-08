class NotificationService {
  constructor() {
    this.permission = null;
    this.checkPermission();
  }

  async checkPermission() {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return;
    }

    this.permission = Notification.permission;
    
    if (this.permission === 'default') {
      this.permission = await Notification.requestPermission();
    }
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'default') {
      this.permission = await Notification.requestPermission();
    } else {
      this.permission = Notification.permission;
    }

    return this.permission === 'granted';
  }

  showNotification(title, options = {}) {
    if (!('Notification' in window)) {
      return;
    }

    if (this.permission !== 'granted') {
      this.requestPermission().then(granted => {
        if (granted) {
          this.createNotification(title, options);
        }
      });
      return;
    }

    this.createNotification(title, options);
  }

  createNotification(title, options = {}) {
    const defaultOptions = {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      requireInteraction: false,
      ...options
    };

    const notification = new Notification(title, defaultOptions);

    notification.onclick = () => {
      window.focus();
      if (options.onClick) {
        options.onClick();
      }
      notification.close();
    };

    if (options.autoClose !== false) {
      setTimeout(() => {
        notification.close();
      }, options.duration || 5000);
    }

    return notification;
  }

  showMessageNotification(message, chatName, onClick) {
    const title = chatName || 'پیام جدید';
    const body = message.content || 'پیام صوتی' || 'فایل';
    
    this.showNotification(title, {
      body,
      icon: message.sender?.avatar || '/favicon.ico',
      badge: '/favicon.ico',
      tag: `chat-${message.chat}`,
      renotify: true,
      onClick: () => {
        if (onClick) {
          onClick();
        }
      }
    });
  }

  showMentionNotification(message, chatName, onClick) {
    const title = `شما در ${chatName || 'چت'} منشن شدید`;
    const body = `${message.sender?.firstName || message.sender?.username || 'کاربر'}: ${message.content?.substring(0, 50) || 'پیام'}`;
    
    this.showNotification(title, {
      body,
      icon: message.sender?.avatar || '/favicon.ico',
      badge: '/favicon.ico',
      tag: `mention-${message.chat}`,
      requireInteraction: true,
      onClick: () => {
        if (onClick) {
          onClick();
        }
      }
    });
  }
}

export const notificationService = new NotificationService();
export default notificationService;


