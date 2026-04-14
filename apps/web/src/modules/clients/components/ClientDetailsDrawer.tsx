import { useState } from 'react';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
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
import { getPaymentItemReference } from '@/modules/payment-items/utils/paymentItemPresentation';

interface ClientDetailsDrawerProps {
  client: Client | null;
  open: boolean;
  onClose: () => void;
  onEdit: (client: Client) => void;
}

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

function KpiTile({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <Box sx={{ flex: 1, minWidth: 0, px: 1.5, py: 1, borderRadius: 1.5, backgroundColor: brandColors.slate[50], border: `1px solid ${brandColors.slate[200]}` }}>
      <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: brandColors.slate[400], lineHeight: 1, mb: 0.5 }}>{label}</Typography>
      <Typography sx={{ fontWeight: 700, fontSize: '0.92rem', color: 'text.primary', lineHeight: 1.2, fontFamily: mono ? numericFont : headingFont, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</Typography>
    </Box>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Typography sx={{ fontFamily: headingFont, fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.07em', textTransform: 'uppercase', color: brandColors.slate[400], mb: 1 }}>{children}</Typography>
  );
}

function InfoRow({ label, value, mono, copyKey, copiedKey, onCopy }: { label: string; value: string; mono?: boolean; copyKey?: string; copiedKey?: string | null; onCopy?: (key: string, value: string) => void }) {
  const isCopied = copiedKey === copyKey;
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.85, minHeight: 34, gap: 1.5 }}>
      <Typography sx={{ fontSize: '0.8rem', color: brandColors.slate[500], flexShrink: 0, minWidth: 120 }}>{label}</Typography>
      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minWidth: 0, justifyContent: 'flex-end' }}>
        <Tooltip title={value} arrow placement="top-start" disableHoverListener={!mono}>
          <Typography sx={{ fontSize: '0.84rem', fontWeight: 600, color: 'text.primary', fontFamily: mono ? numericFont : undefined, letterSpacing: mono ? '0.03em' : undefined, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: mono ? 240 : 320, userSelect: 'all' }}>{value}</Typography>
        </Tooltip>
        {copyKey && onCopy && (
          <Tooltip title={isCopied ? 'Copié !' : 'Copier'} arrow>
            <IconButton size="small" onClick={() => onCopy(copyKey, value)} sx={{ width: 24, height: 24, borderRadius: '5px', color: isCopied ? brandColors.credit : brandColors.slate[400], backgroundColor: isCopied ? alpha(brandColors.credit, 0.08) : 'transparent', '&:hover': { backgroundColor: alpha(brandColors.blue[500], 0.08), color: brandColors.blue[600] }, transition: 'all 0.15s ease' }}>
              {isCopied ? <CheckRoundedIcon sx={{ fontSize: 13 }} /> : <ContentCopyRoundedIcon sx={{ fontSize: 13 }} />}
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    </Box>
  );
}

function SectionBlock({ children, last }: { children: React.ReactNode; last?: boolean }) {
  return (
    <Box sx={{ backgroundColor: '#FFFFFF', border: `1px solid ${brandColors.slate[200]}`, borderRadius: 2, px: 2, py: 0.25, mb: last ? 0 : 2.5, boxShadow: premiumShadows.xs }}>{children}</Box>
  );
}

function InlineEmptyState({ message }: { message: string }) {
  return (
    <Box sx={{ borderRadius: 2, border: `1px dashed ${brandColors.slate[300]}`, backgroundColor: alpha(brandColors.slate[100], 0.5), px: 2, py: 2.5, textAlign: 'center', mb: 2.5 }}>
      <Typography sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>{message}</Typography>
    </Box>
  );
}

export function ClientDetailsDrawer({ client, open, onClose, onEdit }: ClientDetailsDrawerProps) {
  const { copiedKey, copy } = useCopyField();
  if (!client) return null;

  const accounts = getClientAccounts(client);
  const paymentItems = getClientPaymentItems(client);
  const transactions = getClientTransactions(client);
  const metrics = getClientMetrics(client);
  const displayName = getClientDisplayName(client);
  const secondaryName = getClientSecondaryName(client);
  const statusKey = getClientStatusKey(client.isActive);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      scroll="paper"
      slotProps={{ backdrop: { sx: { backgroundColor: alpha(brandColors.slate[900], 0.45), backdropFilter: 'blur(4px)' } } }}
      PaperProps={{ elevation: 0, sx: { width: { xs: '95vw', sm: 640, md: 700 }, maxWidth: 700, maxHeight: '90vh', borderRadius: 3, border: `1px solid ${brandColors.slate[200]}`, boxShadow: premiumShadows.dialog, display: 'flex', flexDirection: 'column', overflow: 'hidden', m: 2 } }}
    >
      {/* HEADER */}
      <Box sx={{ flexShrink: 0, px: { xs: 2, md: 2.75 }, pt: { xs: 2, md: 2.25 }, pb: 1.75, borderBottom: `1px solid ${brandColors.slate[200]}`, backgroundColor: '#FFFFFF' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
          <Typography sx={{ fontFamily: headingFont, fontWeight: 700, fontSize: '0.68rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: brandColors.slate[400] }}>Fiche client</Typography>
          <IconButton onClick={onClose} size="small" sx={{ width: 30, height: 30, borderRadius: '7px', border: `1px solid ${brandColors.slate[200]}`, color: brandColors.slate[500], '&:hover': { backgroundColor: brandColors.slate[50] } }}>
            <CloseRoundedIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Stack>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ width: 42, height: 42, background: `linear-gradient(135deg, ${brandColors.blue[600]}, ${brandColors.blue[400]})`, boxShadow: premiumShadows.xs, fontSize: '0.95rem', fontFamily: headingFont, fontWeight: 800 }}>{getClientInitials(client)}</Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 0.2 }}>
              <Typography sx={{ fontFamily: headingFont, fontWeight: 800, fontSize: '1.08rem', color: 'text.primary', letterSpacing: '-0.01em', lineHeight: 1.3 }}>{displayName}</Typography>
              <StatusChip status={client.type} />
              <StatusChip status={statusKey} />
            </Stack>
            <Typography sx={{ color: brandColors.slate[500], fontSize: '0.78rem', lineHeight: 1.3 }}>
              {secondaryName ? `${secondaryName} \u00b7 ` : ''}{getDisplayValue(client.code, 'Code non d\u00e9fini')} \u00b7 {getClientTypeLabel(client.type)}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={0.75} sx={{ mt: 1.75 }}>
          <KpiTile label="Comptes" value={String(metrics.accountsCount)} />
          <KpiTile label="Paiements" value={String(metrics.paymentItemsCount)} />
          <KpiTile label="Transactions" value={String(metrics.transactionsCount)} />
          <KpiTile label="Volume" value={formatCurrency(metrics.transactionVolume)} mono />
        </Stack>
      </Box>

      {/* BODY */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: { xs: 2, md: 2.75 }, py: 2.25, backgroundColor: brandColors.slate[50] }}>
        <SectionTitle>Informations générales</SectionTitle>
        <SectionBlock>
          <InfoRow label="Nom complet" value={getDisplayValue(client.fullName, 'Non renseigné')} />
          <Divider />
          <InfoRow label="Société" value={getDisplayValue(client.companyName, 'Non renseignée')} />
          <Divider />
          <InfoRow label="Code client" value={getDisplayValue(client.code, 'Non renseigné')} mono copyKey="code" copiedKey={copiedKey} onCopy={copy} />
          <Divider />
          <InfoRow label="Type" value={getClientTypeLabel(client.type)} />
          <Divider />
          <InfoRow label="Statut" value={statusKey === 'ACTIVE' ? 'Actif' : 'Inactif'} />
        </SectionBlock>

        <SectionTitle>Contact</SectionTitle>
        <SectionBlock>
          <InfoRow label="Téléphone" value={getDisplayValue(client.phone, 'Non renseigné')} copyKey={client.phone ? 'phone' : undefined} copiedKey={copiedKey} onCopy={copy} />
          <Divider />
          <InfoRow label="Email" value={getDisplayValue(client.email, 'Non renseigné')} copyKey={client.email ? 'email' : undefined} copiedKey={copiedKey} onCopy={copy} />
          <Divider />
          <InfoRow label="Adresse" value={getAddressValue(client.address)} />
        </SectionBlock>

        <SectionTitle>Fiscalité & identité</SectionTitle>
        <SectionBlock>
          <InfoRow label="CIN / Identifiant" value={getDisplayValue(client.identityNumber, 'Non renseigné')} mono copyKey={client.identityNumber ? 'identity' : undefined} copiedKey={copiedKey} onCopy={copy} />
          <Divider />
          <InfoRow label="Matricule fiscal" value={getDisplayValue(client.taxNumber, 'Non renseigné')} mono copyKey={client.taxNumber ? 'tax' : undefined} copiedKey={copiedKey} onCopy={copy} />
        </SectionBlock>

        {client.notes && (
          <>
            <SectionTitle>Notes</SectionTitle>
            <SectionBlock>
              <Box sx={{ py: 0.85 }}>
                <Typography sx={{ fontSize: '0.84rem', color: 'text.primary', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{client.notes}</Typography>
              </Box>
            </SectionBlock>
          </>
        )}

        <SectionTitle>{`Comptes bancaires (${accounts.length})`}</SectionTitle>
        {accounts.length > 0 ? (
          <SectionBlock>
            {accounts.map((account, idx) => {
              const bal = getBankAccountCurrentBalance(account);
              const openBal = getBankAccountOpeningBalance(account);
              const cur = account.currency || 'TND';
              return (
                <Box key={account.id}>
                  {idx > 0 && <Divider sx={{ my: 0.5, borderStyle: 'dashed' }} />}
                  <Box sx={{ py: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                      <Typography sx={{ fontFamily: headingFont, fontWeight: 700, fontSize: '0.88rem', color: 'text.primary' }}>{getDisplayValue(account.label, 'Compte sans libellé')}</Typography>
                      <StatusChip status={account.status || (account.isActive === false ? 'INACTIVE' : 'ACTIVE')} />
                    </Stack>
                    <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mb: 0.5 }}>
                      <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                        <Box component="span" sx={{ color: brandColors.slate[400], mr: 0.5 }}>N°</Box>
                        <Box component="span" sx={{ fontFamily: numericFont, fontWeight: 600 }}>{getDisplayValue(account.accountNumber, '\u2014')}</Box>
                      </Typography>
                      {account.bank?.name && <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}><Box component="span" sx={{ color: brandColors.slate[400], mr: 0.5 }}>Banque</Box>{account.bank.name}</Typography>}
                      <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}><Box component="span" sx={{ color: brandColors.slate[400], mr: 0.5 }}>Devise</Box>{cur}</Typography>
                    </Stack>
                    <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                      <Typography sx={{ fontSize: '0.82rem', color: 'text.primary' }}>
                        <Box component="span" sx={{ color: brandColors.slate[400], fontSize: '0.75rem', mr: 0.5 }}>Solde courant</Box>
                        <Box component="span" sx={{ fontFamily: numericFont, fontWeight: 700, color: brandColors.blue[700] }}>{formatCurrency(bal, cur)}</Box>
                      </Typography>
                      <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>
                        <Box component="span" sx={{ color: brandColors.slate[400], fontSize: '0.75rem', mr: 0.5 }}>Initial</Box>
                        <Box component="span" sx={{ fontFamily: numericFont }}>{formatCurrency(openBal, cur)}</Box>
                      </Typography>
                    </Stack>
                    {(account.iban || account.rib) && (
                      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                        {account.iban && <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}><Box component="span" sx={{ color: brandColors.slate[400], mr: 0.5 }}>IBAN</Box><Box component="span" sx={{ fontFamily: numericFont, fontSize: '0.76rem' }}>{account.iban}</Box></Typography>}
                        {account.rib && <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}><Box component="span" sx={{ color: brandColors.slate[400], mr: 0.5 }}>RIB</Box><Box component="span" sx={{ fontFamily: numericFont, fontSize: '0.76rem' }}>{account.rib}</Box></Typography>}
                      </Stack>
                    )}
                  </Box>
                </Box>
              );
            })}
          </SectionBlock>
        ) : (
          <InlineEmptyState message="Aucun compte bancaire rattaché à ce client." />
        )}

        <SectionTitle>{`Paiements (${paymentItems.length})`}</SectionTitle>
        {paymentItems.length > 0 ? (
          <SectionBlock>
            {paymentItems.map((pi, idx) => {
              const isIn = pi.direction === 'IN';
              const amtColor = isIn ? brandColors.credit : brandColors.debit;
              return (
                <Box key={pi.id}>
                  {idx > 0 && <Divider sx={{ my: 0.5, borderStyle: 'dashed' }} />}
                  <Box sx={{ py: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                      <Typography sx={{ fontFamily: headingFont, fontWeight: 700, fontSize: '0.86rem', color: 'text.primary' }}>{getDisplayValue(pi.reference, 'Réf. non renseignée')}</Typography>
                      <Stack direction="row" spacing={0.5}><StatusChip status={pi.type} /><StatusChip status={pi.direction} /><StatusChip status={pi.status} /></Stack>
                    </Stack>
                    <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap alignItems="center" sx={{ mb: 0.3 }}>
                      <Typography sx={{ fontFamily: numericFont, fontWeight: 700, fontSize: '0.95rem', color: amtColor }}>{isIn ? '+' : '-'}{formatCurrency(pi.amount, getPaymentItemCurrency(pi))}</Typography>
                      <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>\u00c9mission {formatDate(pi.issueDate)} \u00b7 \u00c9ch\u00e9ance {formatDate(pi.dueDate)}</Typography>
                    </Stack>
                    <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                      {pi.drawer && <Typography sx={{ fontSize: 'inherit', color: 'inherit' }}>Tireur : {pi.drawer}</Typography>}
                      {pi.drawee && <Typography sx={{ fontSize: 'inherit', color: 'inherit' }}>Tiré : {pi.drawee}</Typography>}
                      {(pi.bankName || pi.bankAccount?.bank?.name) && <Typography sx={{ fontSize: 'inherit', color: 'inherit' }}>Banque : {getDisplayValue(pi.bankName || pi.bankAccount?.bank?.name)}</Typography>}
                      {pi.bankAccount?.label && <Typography sx={{ fontSize: 'inherit', color: 'inherit' }}>Compte : {pi.bankAccount.label}</Typography>}
                    </Stack>
                    <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mt: 0.3, fontSize: '0.76rem', color: 'text.secondary' }}>
                      <Typography sx={{ fontSize: 'inherit', color: 'inherit' }}>Réception : {formatDate(pi.receptionDate)}</Typography>
                      <Typography sx={{ fontSize: 'inherit', color: 'inherit' }}>Paiement : {formatDate(pi.paymentDate)}</Typography>
                      <Typography sx={{ fontSize: 'inherit', color: 'inherit' }}>Alerte : {pi.alertEnabled ? 'Activée' : 'Désactivée'}</Typography>
                    </Stack>
                    {pi.notes && <Typography sx={{ fontSize: '0.76rem', color: 'text.secondary', mt: 0.4, fontStyle: 'italic' }}>{pi.notes}</Typography>}
                  </Box>
                </Box>
              );
            })}
          </SectionBlock>
        ) : (
          <InlineEmptyState message="Aucun chèque, traite ou instrument financier associé." />
        )}

        <SectionTitle>{`Transactions (${transactions.length})`}</SectionTitle>
        {transactions.length > 0 ? (
          <SectionBlock>
            {transactions.map((tx, idx) => {
              const isCredit = tx.operationType === 'CREDIT';
              const amtColor = isCredit ? brandColors.credit : brandColors.debit;
              return (
                <Box key={tx.id}>
                  {idx > 0 && <Divider sx={{ my: 0.5, borderStyle: 'dashed' }} />}
                  <Box sx={{ py: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.3 }}>
                      <Typography sx={{ fontFamily: headingFont, fontWeight: 700, fontSize: '0.86rem', color: 'text.primary' }}>{getDisplayValue(tx.label, 'Libellé non renseigné')}</Typography>
                      <Stack direction="row" spacing={0.5}><StatusChip status={tx.operationType} />{tx.status && <StatusChip status={tx.status} />}<StatusChip status={tx.isReconciled ? 'RECONCILED' : 'UNRECONCILED'} /></Stack>
                    </Stack>
                    <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap alignItems="center" sx={{ mb: 0.3 }}>
                      <Typography sx={{ fontFamily: numericFont, fontWeight: 700, fontSize: '0.95rem', color: amtColor }}>{isCredit ? '+' : '-'}{formatCurrency(tx.amount, getTransactionCurrency(tx))}</Typography>
                      <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>Opération {formatDate(tx.operationDate)} \u00b7 Valeur {formatDate(tx.valueDate)}</Typography>
                    </Stack>
                    <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                      {tx.category && <Typography sx={{ fontSize: 'inherit', color: 'inherit' }}>Catégorie : {tx.category}</Typography>}
                      {tx.paymentMethod && <Typography sx={{ fontSize: 'inherit', color: 'inherit' }}>Mode : {tx.paymentMethod}</Typography>}
                      {tx.bankAccount?.label && <Typography sx={{ fontSize: 'inherit', color: 'inherit' }}>Compte : {tx.bankAccount.label}</Typography>}
                      {tx.paymentItem && getPaymentItemReference(tx.paymentItem) !== '—' && <Typography sx={{ fontSize: 'inherit', color: 'inherit' }}>Paiement : {getPaymentItemReference(tx.paymentItem)}</Typography>}
                    </Stack>
                    {tx.notes && <Typography sx={{ fontSize: '0.76rem', color: 'text.secondary', mt: 0.4, fontStyle: 'italic' }}>{tx.notes}</Typography>}
                  </Box>
                </Box>
              );
            })}
          </SectionBlock>
        ) : (
          <InlineEmptyState message="Aucune opération financière enregistrée pour ce client." />
        )}

        <SectionTitle>Traçabilité</SectionTitle>
        <SectionBlock last>
          <InfoRow label="Créé le" value={client.createdAt ? formatDate(client.createdAt) : '\u2014'} />
          <Divider />
          <InfoRow label="Mis à jour le" value={client.updatedAt ? formatDate(client.updatedAt) : '\u2014'} />
        </SectionBlock>
      </Box>

      {/* FOOTER */}
      <Box sx={{ flexShrink: 0, px: { xs: 2, md: 2.75 }, py: 1.5, borderTop: `1px solid ${brandColors.slate[200]}`, backgroundColor: '#FFFFFF', display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button variant="outlined" size="small" onClick={onClose} sx={{ fontSize: '0.8rem', px: 2 }}>Fermer</Button>
        <Button variant="contained" size="small" startIcon={<EditRoundedIcon sx={{ fontSize: 15 }} />} onClick={() => onEdit(client)} sx={{ fontSize: '0.8rem', px: 2, background: 'linear-gradient(135deg, #FDE047 0%, #FACC15 100%)', color: '#713F12', boxShadow: `0 1px 2px ${alpha('#FACC15', 0.35)}`, '&:hover': { background: 'linear-gradient(135deg, #FACC15 0%, #EAB308 100%)', color: '#422006', boxShadow: `0 4px 12px ${alpha('#FACC15', 0.4)}` } }}>Modifier</Button>
      </Box>
    </Dialog>
  );
}
