import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import {
  Autocomplete,
  AutocompleteInputChangeReason,
  Box,
  CircularProgress,
  Stack,
  TextField,
  Typography,
  alpha,
  createFilterOptions,
} from '@mui/material';
import { ReactNode } from 'react';
import { brandColors, headingFont } from '@/app/theme';
import { Bank, BankAccount, Client } from '@/types/domain';

export const ADD_CLIENT_SENTINEL = { id: -1, fullName: '__ADD_NEW__' } as Client;

export const bankFilterOptions = createFilterOptions<Bank>({
  stringify: (option) => `${option.code ?? ''} ${option.name ?? ''}`,
  ignoreCase: true,
  trim: true,
});

export const clientFilterOptions = createFilterOptions<Client>({
  stringify: (option) =>
    option.id === ADD_CLIENT_SENTINEL.id
      ? ''
      : `${option.fullName ?? ''} ${option.companyName ?? ''} ${option.code ?? ''}`,
  ignoreCase: true,
  trim: true,
});

export const accountFilterOptions = createFilterOptions<BankAccount>({
  stringify: (option) =>
    `${option.label ?? ''} ${option.accountNumber ?? ''} ${option.rib ?? ''} ${option.iban ?? ''} ${option.bank?.code ?? ''} ${option.bank?.name ?? ''}`,
  ignoreCase: true,
  trim: true,
});

export function getClientLabel(client: Client): string {
  if (client.id === ADD_CLIENT_SENTINEL.id) return '';
  const company = client.companyName?.trim();
  const full = client.fullName?.trim();
  if (company && full && company !== full) return `${company} — ${full}`;
  return company || full || client.name?.trim() || client.code?.trim() || `Client #${client.id}`;
}

export function getClientPrimary(client?: Client | null): string {
  return client?.companyName?.trim() || client?.fullName?.trim() || client?.name?.trim() || client?.code || '—';
}

export function getClientSecondary(client?: Client | null): string {
  const company = client?.companyName?.trim();
  const full = client?.fullName?.trim();
  return company && full && company !== full ? full : '';
}

export function getBankOptionLabel(bank: Bank): string {
  return bank.code ? `${bank.code} — ${bank.name}` : bank.name;
}

export function getAccountPrimary(account?: BankAccount | null): string {
  return account?.label?.trim() || account?.accountNumber?.trim() || '—';
}

export function getAccountSecondary(account?: BankAccount | null): string {
  if (!account) return '';
  const parts = [account.accountNumber?.trim(), account.bank?.code?.trim(), account.currency].filter(Boolean);
  return parts.join(' • ');
}

const sharedOptionBoxSx = {
  width: 30,
  height: 30,
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: alpha(brandColors.blue[500], 0.08),
  border: `1px solid ${alpha(brandColors.blue[400], 0.14)}`,
  color: brandColors.blue[600],
  flexShrink: 0,
  transition: 'all 0.18s ease',
} as const;


interface BankAutocompleteFieldProps {
  value: Bank | null;
  options: Bank[];
  onChange: (value: Bank | null) => void;
  label?: string;
  placeholder?: string;
  error?: boolean;
  helperText?: ReactNode;
  size?: 'small' | 'medium';
}

export function BankAutocompleteField({
  value,
  options,
  onChange,
  label = 'Banque',
  placeholder = 'Rechercher par code ou nom…',
  error,
  helperText,
  size = 'small',
}: BankAutocompleteFieldProps) {
  return (
    <Autocomplete
      value={value}
      onChange={(_, nextValue) => onChange(nextValue)}
      options={options}
      filterOptions={bankFilterOptions}
      getOptionLabel={getBankOptionLabel}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      noOptionsText="Aucune banque trouvée"
      size={size}
      renderOption={(props, option) => (
        <li {...props} key={option.id}>
          <Stack direction="row" alignItems="center" spacing={1.2} sx={{ width: '100%' }}>
            <Box className="entity-autocomplete-optionIcon" sx={sharedOptionBoxSx}>
              <AccountBalanceRoundedIcon sx={{ fontSize: 15 }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: '0.86rem', fontWeight: 700, color: brandColors.slate[700], fontFamily: headingFont }} noWrap>
                {option.code || option.name}
              </Typography>
              {option.code && (
                <Typography sx={{ fontSize: '0.73rem', color: brandColors.slate[400] }} noWrap>
                  {option.name}
                </Typography>
              )}
            </Box>
          </Stack>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          error={error}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <>
                <SearchRoundedIcon sx={{ fontSize: 18, color: brandColors.slate[400], ml: 0.3, mr: 0.5 }} />
                {params.InputProps.startAdornment}
              </>
            ),
          }}
        />
      )}
      ListboxProps={{ sx: { maxHeight: 220 } }}
    />
  );
}

interface ClientAutocompleteFieldProps {
  value: Client | null;
  inputValue: string;
  options: Client[];
  onChange: (value: Client | null) => void;
  onInputChange: (value: string, reason: AutocompleteInputChangeReason) => void;
  onClose?: () => void;
  loading?: boolean;
  label?: string;
  placeholder?: string;
  error?: boolean;
  helperText?: ReactNode;
  noOptionsText?: ReactNode;
  size?: 'small' | 'medium';
  allowAddNew?: boolean;
  onAddNew?: () => void;
}

export function ClientAutocompleteField({
  value,
  inputValue,
  options,
  onChange,
  onInputChange,
  onClose,
  loading,
  label = 'Client',
  placeholder = 'Rechercher par nom, société ou code…',
  error,
  helperText,
  noOptionsText = 'Aucun client trouvé',
  size = 'small',
  allowAddNew,
  onAddNew,
}: ClientAutocompleteFieldProps) {
  const resolvedOptions = allowAddNew ? [...options, ADD_CLIENT_SENTINEL] : options;

  return (
    <Autocomplete
      value={value}
      inputValue={inputValue}
      onChange={(_, nextValue) => {
        if (nextValue && nextValue.id === ADD_CLIENT_SENTINEL.id) {
          onAddNew?.();
          return;
        }
        onChange(nextValue);
      }}
      options={resolvedOptions}
      filterOptions={(opts, state) => {
        const filtered = clientFilterOptions(opts.filter((option) => option.id !== ADD_CLIENT_SENTINEL.id), state);
        if (allowAddNew) filtered.push(ADD_CLIENT_SENTINEL);
        return filtered;
      }}
      getOptionLabel={(option) => (option.id === ADD_CLIENT_SENTINEL.id ? '' : getClientLabel(option))}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      loading={loading}
      noOptionsText={noOptionsText}
      size={size}
      onInputChange={(_, nextValue, reason) => onInputChange(nextValue, reason)}
      onClose={onClose}
      renderOption={(props, option) => {
        if (option.id === ADD_CLIENT_SENTINEL.id) {
          return (
            <li {...props} key="__add_new__">
              <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%', color: brandColors.blue[600], fontWeight: 700, py: 0.25 }}>
                <AddRoundedIcon sx={{ fontSize: 18 }} />
                <Typography sx={{ fontSize: '0.86rem', fontWeight: 700, color: 'inherit' }}>
                  Ajouter un nouveau client
                </Typography>
              </Stack>
            </li>
          );
        }

        return (
          <li {...props} key={option.id}>
            <Stack direction="row" alignItems="center" spacing={1.2} sx={{ width: '100%' }}>
              <Box className="entity-autocomplete-optionIcon" sx={sharedOptionBoxSx}>
                <PersonRoundedIcon sx={{ fontSize: 15 }} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: '0.86rem', fontWeight: 600, color: brandColors.slate[700] }} noWrap>
                  {getClientPrimary(option)}
                </Typography>
                {getClientSecondary(option) && (
                  <Typography sx={{ fontSize: '0.73rem', color: brandColors.slate[400] }} noWrap>
                    {getClientSecondary(option)}
                  </Typography>
                )}
              </Box>
            </Stack>
          </li>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          error={error}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <>
                <SearchRoundedIcon sx={{ fontSize: 18, color: brandColors.slate[400], ml: 0.3, mr: 0.5 }} />
                {params.InputProps.startAdornment}
              </>
            ),
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={16} sx={{ mr: 1 }} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      ListboxProps={{ sx: { maxHeight: 260 } }}
    />
  );
}

interface AccountAutocompleteFieldProps {
  value: BankAccount | null;
  options: BankAccount[];
  onChange: (value: BankAccount | null) => void;
  loading?: boolean;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  error?: boolean;
  helperText?: ReactNode;
  noOptionsText?: ReactNode;
  size?: 'small' | 'medium';
}

export function AccountAutocompleteField({
  value,
  options,
  onChange,
  loading,
  disabled,
  label = 'Compte',
  placeholder = 'Rechercher un compte…',
  error,
  helperText,
  noOptionsText = 'Aucun compte trouvé',
  size = 'small',
}: AccountAutocompleteFieldProps) {
  return (
    <Autocomplete
      value={value}
      onChange={(_, nextValue) => onChange(nextValue)}
      options={options}
      filterOptions={accountFilterOptions}
      getOptionLabel={getAccountPrimary}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      loading={loading}
      disabled={disabled}
      noOptionsText={noOptionsText}
      size={size}
      renderOption={(props, option) => (
        <li {...props} key={option.id}>
          <Stack direction="row" alignItems="center" spacing={1.2} sx={{ width: '100%' }}>
            <Box className="entity-autocomplete-optionIcon" sx={sharedOptionBoxSx}>
              <AccountBalanceRoundedIcon sx={{ fontSize: 15 }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: '0.86rem', fontWeight: 700, color: brandColors.slate[700], fontFamily: headingFont }} noWrap>
                {getAccountPrimary(option)}
              </Typography>
              {getAccountSecondary(option) && (
                <Typography sx={{ fontSize: '0.73rem', color: brandColors.slate[400] }} noWrap>
                  {getAccountSecondary(option)}
                </Typography>
              )}
            </Box>
          </Stack>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          error={error}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <>
                <SearchRoundedIcon sx={{ fontSize: 18, color: brandColors.slate[400], ml: 0.3, mr: 0.5 }} />
                {params.InputProps.startAdornment}
              </>
            ),
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={16} sx={{ mr: 1 }} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
      ListboxProps={{ sx: { maxHeight: 220 } }}
    />
  );
}

