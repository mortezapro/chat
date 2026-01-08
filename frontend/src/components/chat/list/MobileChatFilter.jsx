import { useState } from 'react';
import { Box, IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { FilterList, Chat, Mail, Group, Campaign, Check } from '@mui/icons-material';
import { useUIStore } from '@/stores/uiStore';

const MobileChatFilter = ({ onFilterChange }) => {
  const { chatFilter, setChatFilter } = useUIStore();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const filters = [
    { value: 'all', label: 'همه چت‌ها', icon: Chat },
    { value: 'private', label: 'چت‌های خصوصی', icon: Mail },
    { value: 'groups', label: 'گروه‌ها', icon: Group },
    { value: 'channels', label: 'کانال‌ها', icon: Campaign }
  ];

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleFilterSelect = (filterValue) => {
    setChatFilter(filterValue);
    if (onFilterChange) {
      onFilterChange(filterValue);
    }
    handleClose();
  };

  const currentFilter = filters.find(f => f.value === chatFilter) || filters[0];
  const CurrentIcon = currentFilter.icon;

  return (
    <Box sx={{ p: 1.5, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CurrentIcon fontSize="small" color="primary" />
          <Box sx={{ fontSize: '0.875rem', fontWeight: 500, color: 'text.primary' }}>
            {currentFilter.label}
          </Box>
        </Box>
        <IconButton
          size="small"
          onClick={handleClick}
          sx={{
            color: 'text.secondary',
            '&:active': {
              bgcolor: 'action.selected'
            }
          }}
        >
          <FilterList fontSize="small" />
        </IconButton>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        PaperProps={{
          sx: {
            minWidth: 200,
            mt: 1
          }
        }}
      >
        {filters.map((filter) => {
          const Icon = filter.icon;
          const isSelected = chatFilter === filter.value;
          return (
            <MenuItem
              key={filter.value}
              onClick={() => handleFilterSelect(filter.value)}
              selected={isSelected}
            >
              <ListItemIcon>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={filter.label} />
              {isSelected && (
                <Check fontSize="small" sx={{ ml: 1 }} />
              )}
            </MenuItem>
          );
        })}
      </Menu>
    </Box>
  );
};

export default MobileChatFilter;

