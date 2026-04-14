import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { Box, IconButton, InputAdornment, TextField, Typography, alpha } from '@mui/material';
import { brandColors } from '@/app/theme';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
}

export function SearchField({ value, onChange, placeholder = 'Rechercher...', onKeyDown }: SearchFieldProps) {
  return (
    <TextField
      fullWidth
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      size="small"
      sx={{
        maxWidth: { md: 440 },
        '& .MuiOutlinedInput-root': {
          backgroundColor: '#FFFFFF',
          borderRadius: '10px',
          height: 40,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: alpha(brandColors.slate[200], 0.9),
          },
          '&:hover': {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: brandColors.slate[300],
            },
          },
          '&.Mui-focused': {
            backgroundColor: '#fff',
            boxShadow: `0 0 0 3px ${alpha(brandColors.blue[500], 0.08)}`,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: brandColors.blue[500],
              borderWidth: 1.5,
            },
          },
        },
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchRoundedIcon sx={{ fontSize: 19, color: brandColors.slate[400] }} />
          </InputAdornment>
        ),
        endAdornment: value ? (
          <InputAdornment position="end">
            <IconButton
              size="small"
              onClick={() => onChange('')}
              sx={{
                width: 24,
                height: 24,
                color: brandColors.debit,
                backgroundColor: alpha(brandColors.debit, 0.08),
                border: `1px solid ${alpha(brandColors.debit, 0.14)}`,
                '&:hover': {
                  backgroundColor: alpha(brandColors.debit, 0.14),
                  borderColor: alpha(brandColors.debit, 0.24),
                },
              }}
            >
              <CloseRoundedIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </InputAdornment>
        ) : (
          <InputAdornment position="end">
            <Box
              sx={{
                display: { xs: 'none', md: 'flex' },
                alignItems: 'center',
                gap: 0.3,
                px: 0.7,
                py: 0.2,
                borderRadius: '4px',
                border: `1px solid ${brandColors.slate[200]}`,
                backgroundColor: brandColors.slate[50],
              }}
            >
              <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: brandColors.slate[400], lineHeight: 1.3, letterSpacing: '0.02em' }}>
                Ctrl+K
              </Typography>
            </Box>
          </InputAdornment>
        ),
      }}
    />
  );
}
