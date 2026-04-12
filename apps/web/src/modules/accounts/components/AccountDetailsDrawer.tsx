import { useState } from 'react';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import {
  Avatar,
  Box,
  Button,
  Dialog,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import { brandColors, headingFont, numericFont, premiumShadows } from '@/app/theme';
import { StatusChip } from '@/components/ui/StatusChip';
import { BankAccount } from '@/types/domain';
import { formatCurrency, formatDate } from '@/utils/format';
import {
  getAccountBalanceValue,
  getAccountDisplayName,
  getAccountOpeningBalanceValue,
  getAccountStatusKey,
} from '@/modules/accounts/utils/accountPresentation';

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Props (identiques à l'ancien composant — rétrocompatible)            */
/* ═══════════════════════════════════════════════════════════════════════ */

interface AccountDetailsDrawerProps {
  account: BankAccount | null;
  open: boolean;
  onClose: () => void;
  onEdit: (account: BankAccount) => void;
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Hook copier-coller                                                    */
/* ═══════════════════════════════════════════════════════════════════════ */

function useCopyField() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copy = (key: string, value: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    });
  };

  return { copiedKey, copy };
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Sous-composants                                                       */
/* ═══════════════════════════════════════════════════════════════════════ */

/* ── KPI compact ─────────────────────────────────────────────────────── */

function KpiTile({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        px: 1.5,
        py: 1,
        borderRadius: 1.5,
        backgroundColor: brandColors.slate[50],
        border: `1px solid ${brandColors.slate[200]}`,
      }}
    >
      <Typography
        sx={{
          fontSize: '0.62rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: brandColors.slate[400],
          lineHeight: 1,
          mb: 0.5,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: '0.92rem',
          color: 'text.primary',
          lineHeight: 1.2,
          fontFamily: mono ? numericFont : headingFont,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

/* ── Titre de section ────────────────────────────────────────────────── */

function SectionTitle({ children }: { children: string }) {
  return (
    <Typography
      sx={{
        fontFamily: headingFont,
        fontWeight: 700,
        fontSize: '0.72rem',
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
        color: brandColors.slate[400],
        mb: 1,
      }}
    >
      {children}
    </Typography>
  );
}

/* ── Ligne info label / valeur / copier ──────────────────────────────── */

function InfoRow({
  label,
  value,
  mono,
  copyKey,
  copiedKey,
  onCopy,
}: {
  label: string;
  value: string;
  mono?: boolean;
  copyKey?: string;
  copiedKey?: string | null;
  onCopy?: (key: string, value: string) => void;
}) {
  const isCopied = copiedKey === copyKey;

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        py: 0.85,
        minHeight: 34,
        gap: 1.5,
      }}
    >
      <Typography
        sx={{
          fontSize: '0.8rem',
          color: brandColors.slate[500],
          flexShrink: 0,
          minWidth: 105,
        }}
      >
        {label}
      </Typography>

      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0, justifyContent: 'flex-end' }}>
        <Tooltip title={value} arrow placement="top-start" disableHoverListener={!mono}>
          <Typography
            sx={{
              fontSize: '0.84rem',
              fontWeight: 600,
              color: 'text.primary',
              fontFamily: mono ? numericFont : undefined,
              letterSpacing: mono ? '0.03em' : undefined,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: mono ? 240 : 280,
              userSelect: 'all',
            }}
          >
            {value}
          </Typography>
        </Tooltip>

        {copyKey && onCopy && (
          <Tooltip title={isCopied ? 'Copié !' : 'Copier'} arrow>
            <IconButton
              size="small"
              onClick={() => onCopy(copyKey, value)}
              sx={{
                width: 24,
                height: 24,
                borderRadius: '5px',
                color: isCopied ? brandColors.credit : brandColors.slate[400],
                backgroundColor: isCopied ? alpha(brandColors.credit, 0.08) : 'transparent',
                '&:hover': {
                  backgroundColor: alpha(brandColors.blue[500], 0.08),
                  color: brandColors.blue[600],
                },
                transition: 'all 0.15s ease',
              }}
            >
              {isCopied ? <CheckRoundedIcon sx={{ fontSize: 13 }} /> : <ContentCopyRoundedIcon sx={{ fontSize: 13 }} />}
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    </Box>
  );
}

/* ── Bloc section (container blanc) ──────────────────────────────────── */

function SectionBlock({ children, last }: { children: React.ReactNode; last?: boolean }) {
  return (
    <Box
      sx={{
        backgroundColor: '#FFFFFF',
        border: `1px solid ${brandColors.slate[200]}`,
        borderRadius: 2,
        px: 2,
        py: 0.25,
        mb: last ? 0 : 2.5,
        boxShadow: premiumShadows.xs,
      }}
    >
      {children}
    </Box>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
/*  Composant principal                                                   */
/* ═══════════════════════════════════════════════════════════════════════ */

export function AccountDetailsDrawer({ account, open, onClose, onEdit }: AccountDetailsDrawerProps) {
  const { copiedKey, copy } = useCopyField();

  if (!account) return null;

  const currentBalance = getAccountBalanceValue(account);
  const openingBalance = getAccountOpeningBalanceValue(account);
  const accountStatus = getAccountStatusKey(account);
  const currency = account.currency || 'TND';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      scroll="paper"
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: alpha(brandColors.slate[900], 0.45),
            backdropFilter: 'blur(4px)',
          },
        },
      }}
      PaperProps={{
        elevation: 0,
        sx: {
          width: { xs: '95vw', sm: 620, md: 660 },
          maxWidth: 660,
          maxHeight: '88vh',
          borderRadius: 3,
          border: `1px solid ${brandColors.slate[200]}`,
          boxShadow: premiumShadows.dialog,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          m: 2,
        },
      }}
    >
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  HEADER — fixe, ne scroll pas                                  */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Box
        sx={{
          flexShrink: 0,
          px: { xs: 2, md: 2.75 },
          pt: { xs: 2, md: 2.25 },
          pb: 1.75,
          borderBottom: `1px solid ${brandColors.slate[200]}`,
          backgroundColor: '#FFFFFF',
        }}
      >
        {/* Barre supérieure : overline + fermer */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
          <Typography
            sx={{
              fontFamily: headingFont,
              fontWeight: 700,
              fontSize: '0.68rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: brandColors.slate[400],
            }}
          >
            Détail du compte
          </Typography>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              width: 30,
              height: 30,
              borderRadius: '7px',
              border: `1px solid ${brandColors.slate[200]}`,
              color: brandColors.slate[500],
              '&:hover': { backgroundColor: brandColors.slate[50] },
            }}
          >
            <CloseRoundedIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Stack>

        {/* Identité : avatar + nom + badges + sous-titre */}
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar
            sx={{
              width: 40,
              height: 40,
              background: `linear-gradient(135deg, ${brandColors.blue[600]}, ${brandColors.blue[400]})`,
              boxShadow: premiumShadows.xs,
            }}
          >
            <AccountBalanceWalletRoundedIcon sx={{ fontSize: 20 }} />
          </Avatar>

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 0.2 }}>
              <Typography
                sx={{
                  fontFamily: headingFont,
                  fontWeight: 800,
                  fontSize: '1.08rem',
                  color: 'text.primary',
                  letterSpacing: '-0.01em',
                  lineHeight: 1.3,
                }}
              >
                {getAccountDisplayName(account)}
              </Typography>
              <StatusChip status={accountStatus} />
              {currency !== 'TND' && <StatusChip status={currency} />}
            </Stack>
            <Typography sx={{ color: brandColors.slate[500], fontSize: '0.78rem', lineHeight: 1.3 }}>
              {account.bank?.name || 'Banque non associée'} · {account.client?.fullName || account.client?.companyName || 'Client non associé'}
            </Typography>
          </Box>
        </Stack>

        {/* KPIs compacts */}
        <Stack direction="row" spacing={0.75} sx={{ mt: 1.75 }}>
          <KpiTile label="Solde courant" value={formatCurrency(currentBalance, currency)} mono />
          <KpiTile label="Solde initial" value={formatCurrency(openingBalance, currency)} mono />
          <KpiTile label="Devise" value={currency} />
          <KpiTile label="Statut" value={accountStatus === 'ACTIVE' ? 'Actif' : 'Inactif'} />
        </Stack>
      </Box>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  BODY — scroll interne uniquement ici                          */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          px: { xs: 2, md: 2.75 },
          py: 2.25,
          backgroundColor: brandColors.slate[50],
        }}
      >
        {/* Section : Informations bancaires */}
        <SectionTitle>Informations bancaires</SectionTitle>
        <SectionBlock>
          <InfoRow label="N° de compte" value={account.accountNumber || '—'} mono copyKey="accountNumber" copiedKey={copiedKey} onCopy={copy} />
          <Divider />
          <InfoRow label="RIB" value={account.rib || 'Non renseigné'} mono={!!account.rib} copyKey={account.rib ? 'rib' : undefined} copiedKey={copiedKey} onCopy={copy} />
          <Divider />
          <InfoRow label="IBAN" value={account.iban || 'Non renseigné'} mono={!!account.iban} copyKey={account.iban ? 'iban' : undefined} copiedKey={copiedKey} onCopy={copy} />
          <Divider />
          <InfoRow label="Banque" value={account.bank?.name || 'Non associée'} />
          {account.bank?.code && (
            <>
              <Divider />
              <InfoRow label="Code banque" value={account.bank.code} mono />
            </>
          )}
          {account.bank?.swiftCode && (
            <>
              <Divider />
              <InfoRow label="SWIFT / BIC" value={account.bank.swiftCode} mono copyKey="swift" copiedKey={copiedKey} onCopy={copy} />
            </>
          )}
        </SectionBlock>

        {/* Section : Informations relationnelles */}
        <SectionTitle>Informations relationnelles</SectionTitle>
        <SectionBlock>
          <InfoRow label="Client" value={account.client?.fullName || account.client?.companyName || 'Aucun client associé'} />
          {account.client?.companyName && account.client.fullName && account.client.companyName !== account.client.fullName && (
            <>
              <Divider />
              <InfoRow label="Société" value={account.client.companyName} />
            </>
          )}
        </SectionBlock>

        {/* Section : Traçabilité */}
        <SectionTitle>Traçabilité</SectionTitle>
        <SectionBlock last>
          <InfoRow label="Statut" value={accountStatus === 'ACTIVE' ? 'Actif' : 'Inactif'} />
          <Divider />
          <InfoRow label="Créé le" value={account.createdAt ? formatDate(account.createdAt) : '—'} />
          <Divider />
          <InfoRow label="Mis à jour le" value={account.updatedAt ? formatDate(account.updatedAt) : '—'} />
        </SectionBlock>
      </Box>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  FOOTER — fixe, ne scroll pas                                  */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Box
        sx={{
          flexShrink: 0,
          px: { xs: 2, md: 2.75 },
          py: 1.5,
          borderTop: `1px solid ${brandColors.slate[200]}`,
          backgroundColor: '#FFFFFF',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 1,
        }}
      >
        <Button
          variant="outlined"
          size="small"
          onClick={onClose}
          sx={{ fontSize: '0.8rem', px: 2 }}
        >
          Fermer
        </Button>
        <Button
          variant="contained"
          size="small"
          startIcon={<EditRoundedIcon sx={{ fontSize: 15 }} />}
          onClick={() => onEdit(account)}
          sx={{ fontSize: '0.8rem', px: 2 }}
        >
          Modifier
        </Button>
      </Box>
    </Dialog>
  );
}
