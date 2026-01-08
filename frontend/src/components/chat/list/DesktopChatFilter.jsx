import { Box, Button } from '@mui/material';
import { Chat, Mail, Group, Campaign } from '@mui/icons-material';
import { useUIStore } from '@/stores/uiStore';

const DesktopChatFilter = ({ onFilterChange }) => {
  const { chatFilter, setChatFilter } = useUIStore();

  const filters = [
    { value: 'all', label: 'همه', icon: Chat },
    { value: 'private', label: 'خصوصی', icon: Mail },
    { value: 'groups', label: 'گروه‌ها', icon: Group },
    { value: 'channels', label: 'کانال‌ها', icon: Campaign }
  ];

  const handleFilterClick = (filterValue) => {
    setChatFilter(filterValue);
    if (onFilterChange) {
      onFilterChange(filterValue);
    }
  };

  return (
    <Box
      sx={{
        p: 1.5,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}
    >
      {filters.map((filter) => {
        const Icon = filter.icon;
        const isSelected = chatFilter === filter.value;
        return (
          <Button
            key={filter.value}
            startIcon={<Icon fontSize="small" sx={{ ml: 0.5 }} />}
            onClick={() => handleFilterClick(filter.value)}
            variant={isSelected ? 'contained' : 'text'}
            color={isSelected ? 'primary' : 'inherit'}
            sx={{
              minWidth: 'auto',
              px: 2,
              py: 0.75,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: isSelected ? 600 : 400,
              fontSize: '0.875rem',
              transition: 'all 0.2s ease',
              gap: 0.5,
              '&:hover': {
                bgcolor: isSelected ? 'primary.dark' : 'action.hover'
              },
              '&:active': {
                transform: 'scale(0.98)'
              }
            }}
          >
            {filter.label}
          </Button>
        );
      })}
    </Box>
  );
};

export default DesktopChatFilter;

