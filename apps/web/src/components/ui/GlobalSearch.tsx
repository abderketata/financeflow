import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import { Autocomplete, Box, InputAdornment, TextField, Typography, alpha } from '@mui/material';
import { useQueries } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountService } from '@/modules/accounts/services/account.service';
// import { bankService } from '@/modules/banks/services/bank.service';
import { clientService } from '@/modules/clients/services/client.service';
import { paymentItemService } from '@/modules/payment-items/services/paymentItem.service';
import { transactionService } from '@/modules/transactions/services/transaction.service';
import { normalizeText } from '@/utils/format';
import { brandColors, headingFont } from '@/app/theme';

interface SearchOption {
  id: string;
  label: string;
  route: string;
  group: string;
}

const groupIcons: Record<string, React.ReactNode> = {
  'Clients': <PeopleAltRoundedIcon sx={{ fontSize: 16 }} />,
  'Banques': <AccountBalanceRoundedIcon sx={{ fontSize: 16 }} />,
  'Comptes': <AccountBalanceWalletRoundedIcon sx={{ fontSize: 16 }} />,
  'Chèques / Traites': <ReceiptLongRoundedIcon sx={{ fontSize: 16 }} />,
  'Débits / Crédits': <SwapHorizRoundedIcon sx={{ fontSize: 16 }} />,
};

export function GlobalSearch() {
  const [value, setValue] = useState('');
  const navigate = useNavigate();
  const enabled = value.trim().length >= 2;

  // Ctrl+K shortcut
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      const input = document.querySelector<HTMLInputElement>('[data-global-search] input');
      input?.focus();
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const queries = useQueries({
    queries: [
      { queryKey: ['global-search', 'clients'], queryFn: () => clientService.list(), enabled },
      // { queryKey: ['global-search', 'banks'], queryFn: () => bankService.list(), enabled },
      { queryKey: ['global-search', 'accounts'], queryFn: () => accountService.list({ populate: '*' }), enabled },
      { queryKey: ['global-search', 'payment-items'], queryFn: () => paymentItemService.list({ populate: '*' }), enabled },
      { queryKey: ['global-search', 'transactions'], queryFn: () => transactionService.list({ populate: '*' }), enabled }
    ]
  });

  const options = useMemo<SearchOption[]>(() => {
    if (!enabled) return [];
    const term = normalizeText(value);
    const [clients, accounts, paymentItems, transactions] = queries.map((query) => (query.data as any[]) || []);

    const results: SearchOption[] = [];

    clients.forEach((item) => {
      if (`${item.name} ${item.code || ''} ${item.email || ''}`.toLowerCase().includes(term)) {
        results.push({ id: `client-${item.id}`, label: item.name, route: '/clients', group: 'Clients' });
      }
    });

    // banks.forEach((item) => {
    //   if (`${item.name} ${item.code || ''} ${item.swiftCode || ''}`.toLowerCase().includes(term)) {
    //     results.push({ id: `bank-${item.id}`, label: item.name, route: '/banks', group: 'Banques' });
    //   }
    // });

    accounts.forEach((item) => {
      if (`${item.label} ${item.accountNumber || ''} ${item.bank?.name || ''}`.toLowerCase().includes(term)) {
        results.push({ id: `account-${item.id}`, label: item.label, route: '/accounts', group: 'Comptes' });
      }
    });

    paymentItems.forEach((item) => {
      if (`${item.reference} ${item.type || ''} ${item.status || ''}`.toLowerCase().includes(term)) {
        results.push({ id: `payment-${item.id}`, label: item.reference, route: '/payment-items', group: 'Chèques / Traites' });
      }
    });

    transactions.forEach((item) => {
      if (`${item.label} ${item.operationType || ''}`.toLowerCase().includes(term)) {
        results.push({ id: `transaction-${item.id}`, label: item.label, route: '/transactions', group: 'Débits / Crédits' });
      }
    });

    return results.slice(0, 12);
  }, [enabled, queries, value]);

  return (
    <Autocomplete
      data-global-search
      sx={{ width: { xs: '100%', md: 340 } }}
      freeSolo
      options={options}
      groupBy={(option) => option.group}
      getOptionLabel={(option) => (typeof option === 'string' ? option : option.label)}
      onInputChange={(_, nextValue) => setValue(nextValue)}
      onChange={(_, option) => {
        if (option && typeof option !== 'string') {
          navigate(option.route);
          setValue('');
        }
      }}
      ListboxProps={{
        sx: {
          '& .MuiAutocomplete-groupLabel': {
            fontFamily: headingFont,
            fontWeight: 700,
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: brandColors.slate[500],
            backgroundColor: brandColors.slate[50],
            borderBottom: `1px solid ${brandColors.slate[200]}`,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          },
          '& .MuiAutocomplete-option': {
            fontSize: '0.85rem',
            py: 1,
            borderRadius: '8px',
            mx: 0.5,
            transition: 'background 0.15s ease',
          },
        },
      }}
      renderOption={(props, option) => (
        <li {...props}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, width: '100%' }}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: alpha(brandColors.blue[500], 0.07),
                color: brandColors.blue[600],
                flexShrink: 0,
              }}
            >
              {groupIcons[option.group] || <SearchRoundedIcon sx={{ fontSize: 16 }} />}
            </Box>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: brandColors.slate[700] }} noWrap>
              {option.label}
            </Typography>
          </Box>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Rechercher…"
          size="small"
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: brandColors.slate[50],
              borderRadius: '10px',
              fontSize: '0.86rem',
              height: 38,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: alpha(brandColors.slate[200], 0.9),
              },
              '&:hover': {
                backgroundColor: alpha(brandColors.slate[100], 0.8),
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
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={{ fontSize: 18, color: brandColors.slate[400] }} />
              </InputAdornment>
            ),
            endAdornment: (
              <>
                {!value && (
                  <InputAdornment position="end">
                    <Box
                      sx={{
                        display: { xs: 'none', md: 'flex' },
                        alignItems: 'center',
                        px: 0.8,
                        py: 0.15,
                        borderRadius: '5px',
                        border: `1px solid ${brandColors.slate[200]}`,
                        backgroundColor: '#FFFFFF',
                      }}
                    >
                      <Typography sx={{ fontSize: '0.63rem', fontWeight: 600, color: brandColors.slate[400], lineHeight: 1.4 }}>
                        ⌘K
                      </Typography>
                    </Box>
                  </InputAdornment>
                )}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}
