import { TextField, InputAdornment, IconButton, Box } from '@mui/material';
import { Search, Clear } from '@mui/icons-material';
import { useUIStore } from '@/stores/uiStore';

const ChatSearch = () => {
  const { chatSearchQuery, setChatSearchQuery } = useUIStore();

  return (
    <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
      <TextField
        fullWidth
        size="small"
        placeholder="جستجوی چت..."
        value={chatSearchQuery}
        onChange={(e) => setChatSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search fontSize="small" />
            </InputAdornment>
          ),
          endAdornment: chatSearchQuery && (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={() => setChatSearchQuery('')}
                sx={{ cursor: 'pointer' }}
              >
                <Clear fontSize="small" />
              </IconButton>
            </InputAdornment>
          )
        }}
      />
    </Box>
  );
};

export default ChatSearch;





