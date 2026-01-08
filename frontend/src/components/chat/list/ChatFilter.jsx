import { Box, ToggleButton, ToggleButtonGroup, Tooltip, Menu, MenuItem } from '@mui/material';
import { Chat, Group, Mail, TrendingUp, TrendingDown, FilterList } from '@mui/icons-material';
import { useState } from 'react';
import { useUIStore } from '@/stores/uiStore';

const ChatFilter = ({ onActivityFilterChange }) => {
  const { chatFilter, setChatFilter, activityFilter, setActivityFilter: setActivityFilterStore } = useUIStore();
  const [activityMenuAnchor, setActivityMenuAnchor] = useState(null);

  const handleFilterChange = (event, newFilter) => {
    if (newFilter !== null) {
      setChatFilter(newFilter);
    }
  };

  const handleActivityFilter = (filter) => {
    setActivityFilterStore(filter || null);
    if (onActivityFilterChange) {
      onActivityFilterChange(filter || null);
    }
    setActivityMenuAnchor(null);
  };

  return (
    <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'center', gap: 1 }}>
      <ToggleButtonGroup
        value={chatFilter}
        exclusive
        onChange={handleFilterChange}
        size="small"
        aria-label="chat filter"
      >
        <ToggleButton value="all" aria-label="all chats">
          <Tooltip title="همه چت‌ها">
            <Chat fontSize="small" sx={{ mr: 0.5 }} />
          </Tooltip>
          همه
        </ToggleButton>
        <ToggleButton value="private" aria-label="private chats">
          <Tooltip title="چت‌های خصوصی">
            <Mail fontSize="small" sx={{ mr: 0.5 }} />
          </Tooltip>
          خصوصی
        </ToggleButton>
        <ToggleButton value="groups" aria-label="group chats">
          <Tooltip title="گروه‌ها">
            <Group fontSize="small" sx={{ mr: 0.5 }} />
          </Tooltip>
          گروه
        </ToggleButton>
      </ToggleButtonGroup>
      <Tooltip title="فیلتر فعالیت">
        <ToggleButton
          value="activity"
          selected={!!activityFilter}
          onClick={(e) => setActivityMenuAnchor(e.currentTarget)}
          size="small"
        >
          <FilterList fontSize="small" sx={{ mr: 0.5 }} />
          فعالیت
        </ToggleButton>
      </Tooltip>
      <Menu
        anchorEl={activityMenuAnchor}
        open={Boolean(activityMenuAnchor)}
        onClose={() => setActivityMenuAnchor(null)}
      >
        <MenuItem onClick={() => handleActivityFilter('')}>
          همه
        </MenuItem>
        <MenuItem onClick={() => handleActivityFilter('high')}>
          <TrendingUp sx={{ mr: 1 }} />
          فعالیت بالا
        </MenuItem>
        <MenuItem onClick={() => handleActivityFilter('low')}>
          <TrendingDown sx={{ mr: 1 }} />
          فعالیت پایین
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ChatFilter;




