import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded';
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import CallRoundedIcon from '@mui/icons-material/CallRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import NotesRoundedIcon from '@mui/icons-material/NotesRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
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
import { Client } from '@/types/domain';
import { formatCurrency, formatDate } from '@/utils/format';
import {
  getAddressValue,
  getBankAccountCurrentBalance,
  getBankAccountOpeningBalance,
  getClientAccounts,
  getClientDisplayName,
  getClientInitials,
  getClientMetrics,
  getClientPaymentItems,
  getClientSecondaryName,
  getClientStatusKey,
  getClientTransactions,
  getClientTypeLabel,
  getDisplayValue,
  getPaymentItemCurrency,
  getTransactionCurrency,
} from '@/modules/clients/utils/clientPresentation';

interface ClientDetailsDrawerProps {
  client: Client | null;
  open: boolean;
  onClose: () => void;
  onEdit: (client: Client) => void;
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
        <Box sx={{ fontSize: '0.9rem', color: 'text.primary', lineHeight: 1.6, wordBreak: 'break-word' }}>
          {value}
        </Box>
      </Box>
    </Stack>
  );
}

function InlineEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Box
      sx={{
        borderRadius: 3,
        border: `1px dashed ${alpha(brandColors.slate[300], 0.9)}`,
        backgroundColor: alpha(brandColors.slate[100], 0.5),
        px: 2.5,
        py: 3,
        textAlign: 'center',
      }}
    >
      <Typography sx={{ fontWeight: 700, color: 'text.primary', mb: 0.6 }}>{title}</Typography>
      <Typography sx={{ color: 'text.secondary', fontSize: '0.84rem' }}>{description}</Typography>
    </Box>
  );
}

export function ClientDetailsDrawer({ client, open, onClose, onEdit }: ClientDetailsDrawerProps) {
  if (!client) {
    return null;
  }

  const accounts = getClientAccounts(client);
  const paymentItems = getClientPaymentItems(client);
  const transactions = getClientTransactions(client);
  const metrics = getClientMetrics(client);
  const displayName = getClientDisplayName(client);
  const secondaryName = getClientSecondaryName(client);

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
                  {getClientInitials(client)}
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
                      {displayName}
                    </Typography>
                    <StatusChip status={client.type} />
                    <StatusChip status={getClientStatusKey(client.isActive)} />
                  </Stack>
                  {secondaryName && (
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.88rem', mb: 0.6 }}>
                      {secondaryName}
                    </Typography>
                  )}
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
                      {getDisplayValue(client.code, 'Code non défini')}
                    </Typography>
                    <Typography sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>
                      {getClientTypeLabel(client.type)} · {client.isActive === false ? 'Compte relationnel inactif' : 'Client actif'}
                    </Typography>
                  </Stack>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center" justifyContent={{ xs: 'flex-end', md: 'flex-start' }}>
                <Button variant="outlined" size="small" startIcon={<EditRoundedIcon />} onClick={() => onEdit(client)}>
                  Modifier
                </Button>
                <IconButton onClick={onClose} sx={{ border: `1px solid ${alpha(brandColors.slate[200], 0.9)}`, backgroundColor: '#FFFFFF' }}>
                  <CloseRoundedIcon />
                </IconButton>
              </Stack>
            </Stack>

            <Grid container spacing={1.5}>
              {[
                { label: 'Comptes', value: metrics.accountsCount, helper: 'relations bancaires' },
                { label: 'Paiements', value: metrics.paymentItemsCount, helper: 'chèques & traites' },
                { label: 'Transactions', value: metrics.transactionsCount, helper: 'débits & crédits' },
                { label: 'Volume', value: formatCurrency(metrics.transactionVolume), helper: 'mouvements cumulés' },
              ].map((item) => (
                <Grid key={item.label} item xs={6} md={3}>
                  <Box
                    sx={{
                      p: 1.4,
                      borderRadius: 3,
                      backgroundColor: '#FFFFFF',
                      border: `1px solid ${alpha(brandColors.slate[200], 0.9)}`,
                    }}
                  >
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'text.secondary' }}>
                      {item.label}
                    </Typography>
                    <Typography sx={{ mt: 0.5, fontSize: '1rem', fontWeight: 800, color: 'text.primary', fontFamily: typeof item.value === 'string' && item.value.includes('TND') ? numericFont : undefined }}>
                      {item.value}
                    </Typography>
                    <Typography sx={{ mt: 0.35, color: 'text.secondary', fontSize: '0.75rem' }}>{item.helper}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Stack>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', px: { xs: 2.25, md: 3.25 }, py: 2.5 }}>
          <Stack spacing={2.25}>
            <SectionCard icon={<PersonRoundedIcon fontSize="small" />} title="Informations générales" subtitle="Identité, contact, fiscalité et statut du client">
              <Grid container spacing={1.5}>
                <Grid item xs={12} md={6}>
                  <InfoField icon={<PersonRoundedIcon sx={{ fontSize: 18 }} />} label="Nom complet" value={getDisplayValue(client.fullName, 'Non renseigné')} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <InfoField icon={<ApartmentRoundedIcon sx={{ fontSize: 18 }} />} label="Société" value={getDisplayValue(client.companyName, 'Non renseignée')} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <InfoField icon={<BadgeRoundedIcon sx={{ fontSize: 18 }} />} label="Code client" value={getDisplayValue(client.code, 'Non renseigné')} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <InfoField icon={<VerifiedRoundedIcon sx={{ fontSize: 18 }} />} label="Type & statut" value={<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap><StatusChip status={client.type} /><StatusChip status={getClientStatusKey(client.isActive)} /></Stack>} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <InfoField icon={<CallRoundedIcon sx={{ fontSize: 18 }} />} label="Téléphone" value={getDisplayValue(client.phone, 'Non renseigné')} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <InfoField icon={<EmailRoundedIcon sx={{ fontSize: 18 }} />} label="Email" value={getDisplayValue(client.email, 'Non renseigné')} />
                </Grid>
                <Grid item xs={12}>
                  <InfoField icon={<PlaceRoundedIcon sx={{ fontSize: 18 }} />} label="Adresse" value={getAddressValue(client.address)} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <InfoField icon={<BadgeRoundedIcon sx={{ fontSize: 18 }} />} label="CIN / Identifiant" value={getDisplayValue(client.identityNumber, 'Non renseigné')} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <InfoField icon={<BadgeRoundedIcon sx={{ fontSize: 18 }} />} label="Matricule fiscal" value={getDisplayValue(client.taxNumber, 'Non renseigné')} />
                </Grid>
                <Grid item xs={12}>
                  <InfoField icon={<NotesRoundedIcon sx={{ fontSize: 18 }} />} label="Notes" value={getDisplayValue(client.notes, 'Aucune note')} />
                </Grid>
              </Grid>
            </SectionCard>

            <SectionCard icon={<AccountBalanceRoundedIcon fontSize="small" />} title="Comptes bancaires" subtitle="Vision consolidée des comptes rattachés au client">
              {accounts.length ? (
                <Grid container spacing={1.75}>
                  {accounts.map((account) => {
                    const currentBalance = getBankAccountCurrentBalance(account);
                    const openingBalance = getBankAccountOpeningBalance(account);
                    return (
                      <Grid key={account.id} item xs={12} md={6}>
                        <Box
                          sx={{
                            height: '100%',
                            borderRadius: 3,
                            border: `1px solid ${alpha(brandColors.slate[200], 0.9)}`,
                            backgroundColor: '#FFFFFF',
                            p: 2,
                          }}
                        >
                          <Stack spacing={1.5}>
                            <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="flex-start">
                              <Box sx={{ minWidth: 0 }}>
                                <Typography sx={{ fontWeight: 700, color: 'text.primary' }} noWrap>
                                  {getDisplayValue(account.label, 'Compte sans libellé')}
                                </Typography>
                                <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', mt: 0.35 }} noWrap>
                                  {getDisplayValue(account.accountNumber, 'Numéro non renseigné')}
                                </Typography>
                              </Box>
                              <StatusChip status={account.status || (account.isActive === false ? 'INACTIVE' : 'ACTIVE')} />
                            </Stack>

                            <Box
                              sx={{
                                p: 1.5,
                                borderRadius: 2.5,
                                background: `linear-gradient(135deg, ${alpha(brandColors.blue[500], 0.08)}, ${alpha(brandColors.blue[500], 0.03)})`,
                                border: `1px solid ${alpha(brandColors.blue[500], 0.12)}`,
                              }}
                            >
                              <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', mb: 0.5 }}>
                                Solde courant
                              </Typography>
                              <Typography sx={{ fontFamily: numericFont, fontWeight: 800, fontSize: '1.18rem', color: brandColors.blue[700] }}>
                                {formatCurrency(currentBalance, account.currency || 'TND')}
                              </Typography>
                              <Typography sx={{ color: 'text.secondary', fontSize: '0.76rem', mt: 0.45 }}>
                                Solde initial : {formatCurrency(openingBalance, account.currency || 'TND')}
                              </Typography>
                            </Box>

                            <Stack spacing={0.9}>
                              <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary' }}><strong>IBAN :</strong> {getDisplayValue(account.iban, 'Non renseigné')}</Typography>
                              <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary' }}><strong>RIB :</strong> {getDisplayValue(account.rib, 'Non renseigné')}</Typography>
                              <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary' }}><strong>Devise :</strong> {getDisplayValue(account.currency, 'TND')}</Typography>
                              <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary' }}><strong>Banque :</strong> {getDisplayValue(account.bank?.name, 'Non renseignée')}</Typography>
                            </Stack>
                          </Stack>
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              ) : (
                <InlineEmptyState title="Aucun compte" description="Ce client ne possède encore aucun compte bancaire rattaché." />
              )}
            </SectionCard>

            <SectionCard icon={<ReceiptLongRoundedIcon fontSize="small" />} title="Paiements / chèques / traites" subtitle="Effets, échéances, alertes et informations instrumentales">
              {paymentItems.length ? (
                <Stack spacing={1.5}>
                  {paymentItems.map((paymentItem) => (
                    <Box
                      key={paymentItem.id}
                      sx={{
                        borderRadius: 3,
                        border: `1px solid ${alpha(brandColors.slate[200], 0.9)}`,
                        backgroundColor: '#FFFFFF',
                        p: 2,
                      }}
                    >
                      <Stack spacing={1.3}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
                          <Box>
                            <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>
                              {getDisplayValue(paymentItem.reference, 'Référence non renseignée')}
                            </Typography>
                            <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', mt: 0.35 }}>
                              {formatDate(paymentItem.issueDate)} · Échéance {formatDate(paymentItem.dueDate)}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                            <StatusChip status={paymentItem.type} />
                            <StatusChip status={paymentItem.direction} />
                            <StatusChip status={paymentItem.status} />
                          </Stack>
                        </Stack>

                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between">
                          <Box
                            sx={{
                              px: 1.5,
                              py: 1,
                              borderRadius: 2,
                              backgroundColor: alpha(paymentItem.direction === 'IN' ? brandColors.credit : brandColors.debit, 0.08),
                              border: `1px solid ${alpha(paymentItem.direction === 'IN' ? brandColors.credit : brandColors.debit, 0.14)}`,
                            }}
                          >
                            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>
                              Montant
                            </Typography>
                            <Typography sx={{ fontFamily: numericFont, fontWeight: 800, fontSize: '1.05rem', color: paymentItem.direction === 'IN' ? brandColors.credit : brandColors.debit }}>
                              {paymentItem.direction === 'IN' ? '+' : '-'}{formatCurrency(paymentItem.amount, getPaymentItemCurrency(paymentItem))}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                            <Typography sx={{ px: 1, py: 0.45, borderRadius: 2, backgroundColor: alpha(brandColors.slate[200], 0.45), fontSize: '0.78rem', color: 'text.secondary' }}>
                              Réception : {formatDate(paymentItem.receptionDate)}
                            </Typography>
                            <Typography sx={{ px: 1, py: 0.45, borderRadius: 2, backgroundColor: alpha(brandColors.slate[200], 0.45), fontSize: '0.78rem', color: 'text.secondary' }}>
                              Paiement : {formatDate(paymentItem.paymentDate)}
                            </Typography>
                          </Stack>
                        </Stack>

                        <Grid container spacing={1.2}>
                          <Grid item xs={12} md={6}>
                            <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary' }}><strong>Tireur :</strong> {getDisplayValue(paymentItem.drawer, 'Non renseigné')}</Typography>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary' }}><strong>Tiré :</strong> {getDisplayValue(paymentItem.drawee, 'Non renseigné')}</Typography>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary' }}><strong>Banque :</strong> {getDisplayValue(paymentItem.bankName || paymentItem.bankAccount?.bank?.name, 'Non renseignée')}</Typography>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary' }}><strong>N° compte instrument :</strong> {getDisplayValue(paymentItem.instrumentAccountNumber, 'Non renseigné')}</Typography>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary' }}><strong>Alerte :</strong> {paymentItem.alertEnabled ? 'Activée' : 'Désactivée'}</Typography>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary' }}><strong>Compte lié :</strong> {getDisplayValue(paymentItem.bankAccount?.label, 'Non renseigné')}</Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', lineHeight: 1.6 }}><strong>Notes :</strong> {getDisplayValue(paymentItem.notes, 'Aucune note')}</Typography>
                          </Grid>
                        </Grid>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <InlineEmptyState title="Aucun paiement" description="Aucun chèque, traite ou instrument financier n’est associé à ce client." />
              )}
            </SectionCard>

            <SectionCard icon={<SwapHorizRoundedIcon fontSize="small" />} title="Transactions" subtitle="Historique des opérations, statuts et rapprochements">
              {transactions.length ? (
                <Stack spacing={1.5}>
                  {transactions.map((transaction) => {
                    const isCredit = transaction.operationType === 'CREDIT';
                    return (
                      <Box
                        key={transaction.id}
                        sx={{
                          borderRadius: 3,
                          border: `1px solid ${alpha(brandColors.slate[200], 0.9)}`,
                          backgroundColor: '#FFFFFF',
                          p: 2,
                        }}
                      >
                        <Stack spacing={1.3}>
                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
                            <Box>
                              <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>
                                {getDisplayValue(transaction.label, 'Libellé non renseigné')}
                              </Typography>
                              <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', mt: 0.35 }}>
                                {getDisplayValue(transaction.category, 'Catégorie non renseignée')} · {getDisplayValue(transaction.paymentMethod, 'Mode non renseigné')}
                              </Typography>
                            </Box>
                            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                              <StatusChip status={transaction.operationType} />
                              {transaction.status && <StatusChip status={transaction.status} />}
                              <StatusChip status={transaction.isReconciled ? 'RECONCILED' : 'UNRECONCILED'} />
                            </Stack>
                          </Stack>

                          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
                            <Box
                              sx={{
                                px: 1.5,
                                py: 1,
                                borderRadius: 2,
                                backgroundColor: alpha(isCredit ? brandColors.info : brandColors.debit, 0.08),
                                border: `1px solid ${alpha(isCredit ? brandColors.info : brandColors.debit, 0.14)}`,
                              }}
                            >
                              <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'text.secondary' }}>
                                Montant
                              </Typography>
                              <Typography sx={{ fontFamily: numericFont, fontWeight: 800, fontSize: '1.05rem', color: isCredit ? brandColors.info : brandColors.debit }}>
                                {isCredit ? '+' : '-'}{formatCurrency(transaction.amount, getTransactionCurrency(transaction))}
                              </Typography>
                            </Box>
                            <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap>
                              <Typography sx={{ px: 1, py: 0.45, borderRadius: 2, backgroundColor: alpha(brandColors.slate[200], 0.45), fontSize: '0.78rem', color: 'text.secondary' }}>
                                Opération : {formatDate(transaction.operationDate)}
                              </Typography>
                              <Typography sx={{ px: 1, py: 0.45, borderRadius: 2, backgroundColor: alpha(brandColors.slate[200], 0.45), fontSize: '0.78rem', color: 'text.secondary' }}>
                                Valeur : {formatDate(transaction.valueDate)}
                              </Typography>
                            </Stack>
                          </Stack>

                          <Grid container spacing={1.2}>
                            <Grid item xs={12} md={6}>
                              <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary' }}><strong>Compte :</strong> {getDisplayValue(transaction.bankAccount?.label, 'Non renseigné')}</Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary' }}><strong>Paiement lié :</strong> {getDisplayValue(transaction.paymentItem?.reference, 'Non renseigné')}</Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary' }}><strong>Devise :</strong> {getDisplayValue(getTransactionCurrency(transaction), 'TND')}</Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary' }}><strong>Rapprochement :</strong> {transaction.isReconciled ? 'Effectué' : 'Non effectué'}</Typography>
                            </Grid>
                            <Grid item xs={12}>
                              <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', lineHeight: 1.6 }}><strong>Notes :</strong> {getDisplayValue(transaction.notes, 'Aucune note')}</Typography>
                            </Grid>
                          </Grid>
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              ) : (
                <InlineEmptyState title="Aucune transaction" description="Ce client n’a encore aucune opération financière enregistrée." />
              )}
            </SectionCard>
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
}

