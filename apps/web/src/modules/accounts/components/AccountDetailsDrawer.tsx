import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import CurrencyExchangeRoundedIcon from '@mui/icons-material/CurrencyExchangeRounded';
import NumbersRoundedIcon from '@mui/icons-material/NumbersRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import SavingsRoundedIcon from '@mui/icons-material/SavingsRounded';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Drawer,
  Grid,
  IconButton,
  Stack,
  Typography,
  alpha,
} from '@mui/material';
import { ReactNode } from 'react';
import { brandColors, glassCard, headingFont, iconBox, numericFont } from '@/app/theme';
import { StatusChip } from '@/components/ui/StatusChip';
import { BankAccount } from '@/types/domain';
import { formatCurrency, formatDate } from '@/utils/format';
import {
  getAccountBalanceValue,
  getAccountDisplayName,
  getAccountOpeningBalanceValue,
  getAccountSecondaryName,
  getAccountStatusKey,
} from '@/modules/accounts/utils/accountPresentation';

interface AccountDetailsDrawerProps {
  account: BankAccount | null;
  open: boolean;
  onClose: () => void;
  onEdit: (account: BankAccount) => void;
}

interface SectionCardProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

interface InfoFieldProps {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}

function SectionCard({ icon, title, subtitle, children }: SectionCardProps) {
  return (
    <Card sx={{ ...glassCard(), overflow: 'hidden' }}>
      <CardContent sx={{ p: { xs: 2.25, md: 2.75 }, '&:last-child': { pb: { xs: 2.25, md: 2.75 } } }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={iconBox(brandColors.blue[600], 40)}>{icon}</Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ fontFamily: headingFont, fontWeight: 700, fontSize: '0.98rem', color: 'text.primary' }}>
                {title}
              </Typography>
              {subtitle && (
                <Typography sx={{ color: 'text.secondary', fontSize: '0.82rem', mt: 0.35 }}>
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Stack>
          {children}
        </Stack>
      </CardContent>
    </Card>
  );
}

function InfoField({ icon, label, value }: InfoFieldProps) {
  return (
    <Stack
      direction="row"
      spacing={1.2}
      alignItems="flex-start"
      sx={{
        height: '100%',
        p: 1.4,
        borderRadius: 2.5,
        border: `1px solid ${alpha(brandColors.slate[200], 0.8)}`,
        backgroundColor: alpha(brandColors.slate[50], 0.75),
      }}
    >
      <Box sx={{ ...iconBox(brandColors.slate[500], 34), mt: 0.1 }}>{icon}</Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'text.secondary', mb: 0.45 }}>
          {label}
        </Typography>
        <Box sx={{ fontSize: '0.9rem', color: 'text.primary', lineHeight: 1.6, wordBreak: 'break-word' }}>{value}</Box>
      </Box>
    </Stack>
  );
}

export function AccountDetailsDrawer({ account, open, onClose, onEdit }: AccountDetailsDrawerProps) {
  if (!account) {
    return null;
  }

  const currentBalance = getAccountBalanceValue(account);
  const openingBalance = getAccountOpeningBalanceValue(account);
  const accountStatus = getAccountStatusKey(account);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', md: 760 },
          backgroundColor: '#F8FAFC',
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box
          sx={{
            px: { xs: 2.25, md: 3.25 },
            pt: { xs: 2.25, md: 3 },
            pb: 2.5,
            borderBottom: `1px solid ${alpha(brandColors.slate[200], 0.9)}`,
            background: `linear-gradient(180deg, ${alpha(brandColors.blue[50], 0.9)} 0%, #FFFFFF 100%)`,
            position: 'sticky',
            top: 0,
            zIndex: 2,
            backdropFilter: 'blur(12px)',
          }}
        >
          <Stack spacing={2.25}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'flex-start' }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
                <Avatar
                  sx={{
                    width: 56,
                    height: 56,
                    background: `linear-gradient(135deg, ${brandColors.blue[600]}, ${brandColors.blue[400]})`,
                    boxShadow: `0 10px 20px ${alpha(brandColors.blue[600], 0.18)}`,
                  }}
                >
                  <AccountBalanceWalletRoundedIcon />
                </Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 0.65 }}>
                    <Typography
                      sx={{
                        fontFamily: headingFont,
                        fontWeight: 800,
                        fontSize: { xs: '1.15rem', md: '1.35rem' },
                        color: 'text.primary',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {getAccountDisplayName(account)}
                    </Typography>
                    <StatusChip status={accountStatus} />
                    {account.currency && <StatusChip status={account.currency} />}
                  </Stack>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.88rem', mb: 0.6 }}>
                    {getAccountSecondaryName(account)}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Typography
                      sx={{
                        px: 1,
                        py: 0.4,
                        borderRadius: '999px',
                        border: `1px solid ${alpha(brandColors.blue[500], 0.15)}`,
                        backgroundColor: alpha(brandColors.blue[500], 0.08),
                        color: brandColors.blue[700],
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        fontFamily: numericFont,
                      }}
                    >
                      {account.accountNumber}
                    </Typography>
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>
                      {account.bank?.name || 'Banque non associée'} · {account.client?.name || 'Client non associé'}
                    </Typography>
                  </Stack>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center" justifyContent={{ xs: 'flex-end', md: 'flex-start' }}>
                <Button variant="outlined" size="small" startIcon={<EditRoundedIcon />} onClick={() => onEdit(account)}>
                  Modifier
                </Button>
                <IconButton onClick={onClose} sx={{ border: `1px solid ${alpha(brandColors.slate[200], 0.9)}`, backgroundColor: '#FFFFFF' }}>
                  <CloseRoundedIcon />
                </IconButton>
              </Stack>
            </Stack>

            <Grid container spacing={1.5}>
              {[
                { label: 'Solde courant', value: formatCurrency(currentBalance, account.currency || 'TND'), helper: 'position actuelle' },
                { label: 'Solde initial', value: formatCurrency(openingBalance, account.currency || 'TND'), helper: 'à l’ouverture' },
                { label: 'Devise', value: account.currency || 'TND', helper: 'devise de tenue' },
                { label: 'Statut', value: accountStatus === 'ACTIVE' ? 'Actif' : 'Inactif', helper: 'état opérationnel' },
              ].map((item) => (
                <Grid key={item.label} item xs={6} md={3}>
                  <Box sx={{ p: 1.4, borderRadius: 3, backgroundColor: '#FFFFFF', border: `1px solid ${alpha(brandColors.slate[200], 0.9)}` }}>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'text.secondary' }}>
                      {item.label}
                    </Typography>
                    <Typography sx={{ mt: 0.65, fontWeight: 800, color: 'text.primary', fontSize: '1rem', fontFamily: item.label.includes('Solde') ? numericFont : undefined }}>
                      {item.value}
                    </Typography>
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.76rem', mt: 0.35 }}>{item.helper}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Stack>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', px: { xs: 2.25, md: 3.25 }, py: 2.5 }}>
          <Stack spacing={2.25}>
            <SectionCard icon={<NumbersRoundedIcon />} title="Informations bancaires" subtitle="Références principales du compte">
              <Grid container spacing={1.5}>
                <Grid item xs={12} md={6}>
                  <InfoField icon={<BadgeRoundedIcon sx={{ fontSize: 18 }} />} label="Numéro de compte" value={account.accountNumber} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <InfoField icon={<BadgeRoundedIcon sx={{ fontSize: 18 }} />} label="RIB" value={account.rib || 'Non renseigné'} />
                </Grid>
                <Grid item xs={12}>
                  <InfoField icon={<AccountBalanceRoundedIcon sx={{ fontSize: 18 }} />} label="IBAN" value={account.iban || 'Non renseigné'} />
                </Grid>
              </Grid>
            </SectionCard>

            <SectionCard icon={<BusinessRoundedIcon />} title="Relations associées" subtitle="Banque et client rattachés au compte">
              <Grid container spacing={1.5}>
                <Grid item xs={12} md={6}>
                  <InfoField
                    icon={<AccountBalanceRoundedIcon sx={{ fontSize: 18 }} />}
                    label="Banque"
                    value={
                      <>
                        <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>{account.bank?.name || 'Aucune banque associée'}</Typography>
                        {account.bank?.code && <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>Code : {account.bank.code}</Typography>}
                        {account.bank?.swiftCode && <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>SWIFT : {account.bank.swiftCode}</Typography>}
                      </>
                    }
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <InfoField
                    icon={<PersonRoundedIcon sx={{ fontSize: 18 }} />}
                    label="Client"
                    value={account.client?.name || 'Aucun client associé'}
                  />
                </Grid>
              </Grid>
            </SectionCard>

            <SectionCard icon={<SavingsRoundedIcon />} title="Suivi financier" subtitle="Indicateurs utiles pour le pilotage du compte">
              <Grid container spacing={1.5}>
                <Grid item xs={12} md={4}>
                  <InfoField icon={<AccountBalanceWalletRoundedIcon sx={{ fontSize: 18 }} />} label="Solde courant" value={formatCurrency(currentBalance, account.currency || 'TND')} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <InfoField icon={<SavingsRoundedIcon sx={{ fontSize: 18 }} />} label="Solde initial" value={formatCurrency(openingBalance, account.currency || 'TND')} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <InfoField icon={<CurrencyExchangeRoundedIcon sx={{ fontSize: 18 }} />} label="Devise" value={account.currency || 'TND'} />
                </Grid>
              </Grid>
            </SectionCard>

            <SectionCard icon={<BadgeRoundedIcon />} title="Traçabilité" subtitle="Dates importantes et statut global">
              <Grid container spacing={1.5}>
                <Grid item xs={12} md={4}>
                  <InfoField icon={<BadgeRoundedIcon sx={{ fontSize: 18 }} />} label="Statut" value={<StatusChip status={accountStatus} />} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <InfoField icon={<BadgeRoundedIcon sx={{ fontSize: 18 }} />} label="Créé le" value={account.createdAt ? formatDate(account.createdAt) : 'Non disponible'} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <InfoField icon={<BadgeRoundedIcon sx={{ fontSize: 18 }} />} label="Mis à jour le" value={account.updatedAt ? formatDate(account.updatedAt) : 'Non disponible'} />
                </Grid>
              </Grid>
            </SectionCard>
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
}

