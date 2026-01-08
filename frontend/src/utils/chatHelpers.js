export const getChatName = (chat, currentUser) => {
    if (!chat) return 'چت بدون نام';
    if (chat.name) return chat.name;
    if (chat.type === 'private' && chat.participants?.length > 0) {
        const otherParticipant = chat.participants.find(p =>
            (p._id || p)?.toString() !== (currentUser?.id || currentUser?._id)?.toString()
        );
        if (otherParticipant) {
            return otherParticipant.firstName && otherParticipant.lastName
                ? `${otherParticipant.firstName} ${otherParticipant.lastName}`
                : otherParticipant.username || 'کاربر';
        }
    }
    return 'چت بدون نام';
};

export const getChatAvatar = (chat, currentUser) => {
    if (!chat) return null;
    if (chat.avatar) return chat.avatar;
    if (chat.type === 'private' && chat.participants?.length > 0) {
        const otherParticipant = chat.participants.find(p =>
            (p._id || p)?.toString() !== (currentUser?.id || currentUser?._id)?.toString()
        );
        return otherParticipant?.avatar || null;
    }
    return null;
};

export const getOtherParticipant = (chat, currentUser) => {
    if (!chat || chat.type !== 'private' || !chat.participants?.length) return null;
    return chat.participants.find(p =>
        (p._id || p)?.toString() !== (currentUser?.id || currentUser?._id)?.toString()
    );
};

export const getChatTitle = (chat, currentUser) => {
    if (!chat) return 'چت';
    if (chat.name) return chat.name;
    if (chat.type === 'private' && chat.participants?.length > 0) {
        const otherParticipant = chat.participants.find((p) => (p._id || p)?.toString() !== (currentUser?.id || currentUser?._id)?.toString());
        if (otherParticipant) {
            return otherParticipant.firstName && otherParticipant.lastName
                ? `${otherParticipant.firstName} ${otherParticipant.lastName}`
                : otherParticipant.username || 'کاربر';
        }
    }
    return 'چت';
};

export const getFileUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    const baseURL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5001/api' : '/api');
    const cleanUrl = url.startsWith('/') ? url : '/' + url;
    if (cleanUrl.startsWith('/uploads')) {
        return `${baseURL}${cleanUrl}`;
    }
    return `${baseURL}${cleanUrl}`;
};

