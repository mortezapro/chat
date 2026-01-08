import { useState } from 'react';
import { Box, Typography, IconButton, InputBase, Paper, Collapse } from '@mui/material';
import { Search, FilterList, Menu, Close } from '@mui/icons-material';

export const MobileHomeHeader = ({ onMenuClick, searchQuery, onSearchChange, onSearchClear }) => {
  const [searchOpen, setSearchOpen] = useState(false);

  const handleMenuClick = () => {
    const event = new CustomEvent('openMobileSidebar');
    window.dispatchEvent(event);
    if (onMenuClick) onMenuClick();
  };

  const handleSearchToggle = () => {
    setSearchOpen(!searchOpen);
    if (searchOpen && searchQuery) {
      onSearchClear();
    }
  };

  return (
    <Box
      sx={{
        p: 1.5,
        minHeight: 64,
        bgcolor: 'primary.main',
        color: 'white',
        boxShadow: 2,
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton
          size="small"
          sx={{ color: 'white', mr: 1 }}
          onClick={handleMenuClick}
        >
          <Menu />
        </IconButton>
        <Typography variant="h6" fontWeight="bold" sx={{ flex: 1, fontSize: '1.25rem', letterSpacing: '0.5px' }}>
          چاره
        </Typography>
        <IconButton
          size="small"
          sx={{ color: 'white' }}
          onClick={handleSearchToggle}
        >
          {searchOpen ? <Close /> : <Search />}
        </IconButton>
      </Box>

      <Collapse in={searchOpen}>
        <Paper
          component="form"
          sx={{
            p: '4px 8px',
            display: 'flex',
            alignItems: 'center',
            bgcolor: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            borderRadius: 3,
            mt: 2
          }}
        >
          <Search sx={{ color: 'white', mr: 1 }} />
          <InputBase
            placeholder="جستجو..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            sx={{
              color: 'white',
              flex: 1,
              '&::placeholder': {
                color: 'rgba(255, 255, 255, 0.7)'
              }
            }}
          />
          {searchQuery && (
            <IconButton
              size="small"
              onClick={onSearchClear}
              sx={{ color: 'white' }}
            >
              <FilterList />
            </IconButton>
          )}
        </Paper>
      </Collapse>
    </Box>
  );
};

