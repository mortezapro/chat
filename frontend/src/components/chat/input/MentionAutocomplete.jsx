import { useState, useEffect, useRef } from 'react';
import {
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography
} from '@mui/material';

const MentionAutocomplete = ({ 
  open, 
  position, 
  query, 
  chat, 
  onSelect, 
  onClose 
}) => {
  const { user } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef(null);

  useEffect(() => {
    if (!open || !query || query.length < 1) {
      setUsers([]);
      return;
    }

    const searchUsers = async () => {
      try {
        const participants = chat?.participants || [];
        const filtered = participants.filter(p => {
          const participant = p.user || p;
          const username = participant.username || '';
          const firstName = participant.firstName || '';
          const lastName = participant.lastName || '';
          const searchTerm = query.toLowerCase();
          
          return (
            username.toLowerCase().includes(searchTerm) ||
            firstName.toLowerCase().includes(searchTerm) ||
            lastName.toLowerCase().includes(searchTerm) ||
            `${firstName} ${lastName}`.toLowerCase().includes(searchTerm)
          ) && (participant._id || participant) !== user?.id;
        });

        if (query.toLowerCase() === 'all' && chat?.type !== 'private') {
          setUsers([{ _id: 'all', username: 'all', firstName: 'همه', isAll: true }, ...filtered]);
        } else {
          setUsers(filtered);
        }
        setSelectedIndex(0);
      } catch (error) {
        console.error('Error searching users:', error);
      }
    };

    searchUsers();
  }, [query, chat, open, user]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!open) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, users.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (users[selectedIndex]) {
          handleSelect(users[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, users, selectedIndex]);

  useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      const item = listRef.current.children[selectedIndex];
      if (item) {
        item.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const handleSelect = (selectedUser) => {
    if (selectedUser.isAll) {
      onSelect('@all ');
    } else {
      const participant = selectedUser.user || selectedUser;
      onSelect(`@${participant.username} `);
    }
    onClose();
  };

  if (!open || users.length === 0) {
    return null;
  }

  return (
    <Paper
      sx={{
        position: 'absolute',
        top: position?.top || 0,
        left: position?.left || 0,
        zIndex: 10000,
        maxHeight: 300,
        overflow: 'auto',
        minWidth: 250,
        boxShadow: 3
      }}
      ref={listRef}
    >
      <List dense>
        {users.map((participant, index) => {
          const userData = participant.user || participant;
          const isAll = participant.isAll;
          
          return (
            <ListItem
              key={isAll ? 'all' : (userData._id || userData)}
              button
              selected={index === selectedIndex}
              onClick={() => handleSelect(participant)}
              sx={{
                bgcolor: index === selectedIndex ? 'action.selected' : 'transparent',
                '&:hover': {
                  bgcolor: 'action.hover'
                }
              }}
            >
              {!isAll && (
                <ListItemAvatar>
                  <Avatar src={userData.avatar} sx={{ width: 32, height: 32 }}>
                    {userData.firstName?.[0] || userData.username?.[0] || 'U'}
                  </Avatar>
                </ListItemAvatar>
              )}
              <ListItemText
                primary={
                  isAll ? (
                    <Typography variant="body2" fontWeight="bold">
                      @all - منشن همه
                    </Typography>
                  ) : (
                    <Typography variant="body2">
                      {userData.firstName && userData.lastName
                        ? `${userData.firstName} ${userData.lastName}`
                        : userData.username}
                    </Typography>
                  )
                }
                secondary={!isAll && `@${userData.username}`}
              />
            </ListItem>
          );
        })}
      </List>
    </Paper>
  );
};

export default MentionAutocomplete;


