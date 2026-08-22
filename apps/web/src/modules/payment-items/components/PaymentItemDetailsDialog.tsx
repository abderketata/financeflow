import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded';
import NotesRoundedIcon from '@mui/icons-material/NotesRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import {
  Alert as MuiAlert,
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Stack,
  Typography,
  alpha,
} from '@mui/material';
import { AmountWordsText } from '@/components/ui/AmountWordsText';
import { usePaymentItemDetails } from '@/modules/payment-items/hooks/usePaymentItems';
import { PaymentItem } from '@/types/domain';
import { brandColors, headingFont, numericFont } from '@/app/theme';
import { describeColloquialAmount, formatAmountInWords, formatAmountInWordsArabic, formatCurrency, formatDate } from '@/utils/format';
import {
  getPaymentItemAccount,
  getPaymentItemAccountPrimary,
  getPaymentItemAccountSecondary,
  getPaymentItemClientPrimary,
  getPaymentItemClientSecondary,
  getPaymentItemCurrency,
  getPaymentItemDirectionLabel,
  getPaymentItemNotes,
  getPaymentItemReference,
  getPaymentItemStatusLabel,
  getPaymentItemTypeLabel,
  paymentMethodLabelMap,
} from '@/modules/payment-items/utils/paymentItemPresentation';

const statusStyles = new Map<string, { color: string; bg: string }>([
  ['Reçu', { color: '#2563EB', bg: '#EFF6FF' }],
  ['Déposé', { color: '#D97706', bg: '#FFFBEB' }],
  ['Payé', { color: '#059669', bg: '#ECFDF5' }],
  ['Rejeté', { color: '#DC2626', bg: '#FEF2F2' }],
  ['Annulé', { color: '#64748B', bg: '#F1F5F9' }],
  ['En retard', { color: '#DC2626', bg: '#FEF2F2' }],
]);

const typeStyles: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  CHEQUE: { color: '#D97706', bg: '#FFFBEB', icon: ReceiptLongRoundedIcon },
  TRAITE: { color: '#7C3AED', bg: '#F5F3FF', icon: DescriptionRoundedIcon },
  AUTRE: { color: '#64748B', bg: '#F1F5F9', icon: MoreHorizRoundedIcon },
};

const hasDisplayValue = (value?: React.ReactNode) =>
  value !== undefined && value !== null && value !== '' && value !== '—';

function DetailField({ label, value, icon }: { label: string; value?: React.ReactNode; icon?: React.ReactNode }) {
  if (!hasDisplayValue(value)) {
    return null;
  }

  return (
    <Stack spacing={0.6}>
      <Stack direction="row" spacing={0.8} alignItems="center">
        {icon ? <Box sx={{ color: brandColors.slate[400], display: 'flex', alignItems: 'center' }}>{icon}</Box> : null}
        <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', fontWeight: 600 }}>{label}</Typography>
      </Stack>
      <Typography sx={{ fontSize: '0.88rem', color: 'text.primary', fontWeight: 600, lineHeight: 1.4, whiteSpace: 'pre-line' }}>
        {value}
      </Typography>
    </Stack>
  );
}

function PaymentTypeInline({ item }: { item: Partial<PaymentItem> }) {
  const config = typeStyles[item.type ?? 'AUTRE'] ?? typeStyles.AUTRE;
  const Icon = config.icon;

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.7 }}>
      <Box
        sx={{
          width: 22,
          height: 22,
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: config.bg,
          color: config.color,
          flexShrink: 0,
        }}
      >
        <Icon sx={{ fontSize: 13 }} />
      </Box>
      <Typography sx={{ fontSize: '0.84rem', fontWeight: 600, color: config.color }}>
        {getPaymentItemTypeLabel(item)}
      </Typography>
    </Box>
  );
}

interface PaymentItemDetailsDialogProps {
  open: boolean;
  /** Effet issu d'une liste : sert d'affichage immédiat pendant le rechargement. */
  paymentItem: Partial<PaymentItem> | null;
  onClose: () => void;
}

/**
 * Fiche de détail d'un effet, en lecture seule.
 *
 * Les listes du tableau de bord ne chargent qu'un sous-ensemble de champs :
 * l'enregistrement complet (client, compte, tireur/tiré, notes) est relu par id
 * à l'ouverture, l'objet reçu servant d'affichage immédiat.
 */
export function PaymentItemDetailsDialog({ open, paymentItem, onClose }: PaymentItemDetailsDialogProps) {
  const id = paymentItem?.id ? Number(paymentItem.id) : null;
  const { data: fullItem, isLoading, isError } = usePaymentItemDetails(id, open);

  const item: Partial<PaymentItem> = { ...(paymentItem ?? {}), ...(fullItem ?? {}) };
  const currency = getPaymentItemCurrency(item);
  const isIncoming = item.direction === 'IN';
  const DirectionIcon = isIncoming ? ArrowUpwardRoundedIcon : ArrowDownwardRoundedIcon;
  const directionColor = isIncoming ? brandColors.credit : brandColors.debit;
  const statusLabel = getPaymentItemStatusLabel(item.status) as string;
  const statusStyle = statusStyles.get(statusLabel) ?? { color: brandColors.slate[600], bg: brandColors.slate[100] };
  const amountInWords = formatAmountInWords(item.amount, currency);
  const amountInWordsArabic = formatAmountInWordsArabic(item.amount, currency);
  const colloquialAmount = describeColloquialAmount(item.amount, currency);
  const account = getPaymentItemAccount(item);
  const accountPrimary = getPaymentItemAccountPrimary(account);
  const accountSecondary = getPaymentItemAccountSecondary(account);
  const clientPrimary = getPaymentItemClientPrimary(item.client);
  const clientSecondary = getPaymentItemClientSecondary(item.client);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" TransitionProps={{ timeout: 250 }}>
      <Box sx={{ height: 3, background: `linear-gradient(90deg, ${directionColor}, ${alpha(directionColor, 0.35)}, ${alpha(directionColor, 0.05)})` }} />
      <DialogTitle sx={{ pb: 1.5, pt: 2.5 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Stack direction="row" spacing={1.2} alignItems="center" sx={{ minWidth: 0 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: alpha(directionColor, 0.12),
                color: directionColor,
                flexShrink: 0,
              }}
            >
              <DirectionIcon sx={{ fontSize: '1.15rem' }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontFamily: headingFont, fontWeight: 700, fontSize: '1.05rem', color: 'text.primary', letterSpacing: '-0.01em' }} noWrap>
                {getPaymentItemReference(item) || 'Détail de l’opération'}
              </Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.8rem', mt: 0.15 }}>
                {getPaymentItemDirectionLabel(item.direction)} • {getPaymentItemTypeLabel(item)}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
            <Chip
              label={statusLabel}
              size="small"
              sx={{ height: 26, borderRadius: '8px', fontSize: '0.74rem', fontWeight: 700, color: statusStyle.color, backgroundColor: statusStyle.bg }}
            />
            <IconButton
              onClick={onClose}
              size="small"
              sx={{ color: brandColors.slate[400], borderRadius: '10px', '&:hover': { color: brandColors.slate[600], backgroundColor: alpha(brandColors.slate[200], 0.3) } }}
            >
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>
      </DialogTitle>
      <Divider sx={{ mx: 3 }} />
      <DialogContent sx={{ pt: '20px !important', pb: '24px !important' }}>
        {/* ── Montant ── */}
        <Box
          sx={{
            p: 1.6,
            borderRadius: '14px',
            backgroundColor: alpha(directionColor, 0.06),
            border: `1px solid ${alpha(directionColor, 0.14)}`,
          }}
        >
          <Typography sx={{ fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>
            Montant
          </Typography>
          <Typography sx={{ mt: 0.35, fontFamily: numericFont, fontSize: '1.35rem', fontWeight: 800, color: directionColor }}>
            {isIncoming ? '+' : '-'}{formatCurrency(item.amount, currency)}
          </Typography>
          {colloquialAmount?.scale === 'milyar' ? (
            <Typography sx={{ mt: 0.4, fontSize: '0.78rem', fontWeight: 800, color: brandColors.debit }}>
              Soit {colloquialAmount.label} — <Box component="span" dir="rtl" lang="ar">{colloquialAmount.arabicLabel}</Box>
            </Typography>
          ) : null}
          {amountInWords ? (
            <Typography sx={{ mt: 0.55, fontSize: '0.82rem', color: 'text.secondary', lineHeight: 1.45 }}>
              <AmountWordsText words={amountInWords} currency={currency} />
            </Typography>
          ) : null}
          {amountInWordsArabic ? (
            <Typography dir="rtl" lang="ar" sx={{ mt: 0.35, fontSize: '0.88rem', color: 'text.secondary', lineHeight: 1.75, textAlign: 'right' }}>
              <AmountWordsText words={amountInWordsArabic} script="arabic" currency={currency} />
            </Typography>
          ) : null}
        </Box>

        {isLoading ? (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
            <CircularProgress size={16} />
            <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>
              Chargement du détail complet…
            </Typography>
          </Stack>
        ) : null}

        {isError ? (
          <MuiAlert severity="warning" sx={{ mt: 2 }}>
            Le détail complet n’a pas pu être chargé. Seules les informations de la liste sont affichées.
          </MuiAlert>
        ) : null}

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={1.6}>
          <Grid item xs={12} sm={6}>
            <DetailField
              label="Échéance"
              icon={<EventAvailableRoundedIcon sx={{ fontSize: 16 }} />}
              value={formatDate(item.dueDate)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <DetailField
              label="Date d'émission"
              icon={<AccessTimeRoundedIcon sx={{ fontSize: 16 }} />}
              value={formatDate(item.issueDate)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <DetailField
              label="Client"
              icon={<BusinessRoundedIcon sx={{ fontSize: 16 }} />}
              value={clientSecondary ? `${clientPrimary}\n${clientSecondary}` : clientPrimary}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <DetailField label="Type" value={<PaymentTypeInline item={item} />} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <DetailField label="Tireur" value={item.drawer} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <DetailField label="Tiré" value={item.drawee} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <DetailField
              label="Compte bancaire"
              icon={<AccountBalanceRoundedIcon sx={{ fontSize: 16 }} />}
              value={accountSecondary ? `${accountPrimary}\n${accountSecondary}` : accountPrimary}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <DetailField
              label="Mode de règlement"
              icon={<PaymentsRoundedIcon sx={{ fontSize: 16 }} />}
              value={item.paymentMethod ? paymentMethodLabelMap[item.paymentMethod] : undefined}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <DetailField label="Banque" value={item.bankName} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <DetailField
              label="Alerte"
              icon={<NotificationsActiveRoundedIcon sx={{ fontSize: 16 }} />}
              value={typeof item.alertDaysBefore === 'number' ? `${item.alertDaysBefore} jour(s) avant` : undefined}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <DetailField label="Date de règlement" value={formatDate(item.paymentDate)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <DetailField label="Date de réception" value={formatDate(item.receptionDate)} />
          </Grid>
          <Grid item xs={12}>
            <DetailField
              label="Notes"
              icon={<NotesRoundedIcon sx={{ fontSize: 16 }} />}
              value={getPaymentItemNotes(item)}
            />
          </Grid>
        </Grid>
      </DialogContent>
    </Dialog>
  );
}
