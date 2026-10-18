// PaymentItemFormScreen — parité métier avec le formulaire web
// (`apps/web/src/modules/payment-items/components/PaymentItemForm.tsx`) :
//
//  - client cherché côté serveur, compte restreint aux comptes de ce client ;
//  - tireur / tiré déduits du sens et du client (lecture seule) ;
//  - référence de paiement obligatoire pour un chèque ou une traite ;
//  - méthode de paiement seulement pour le type « Autre » ;
//  - montant masqué, annoncé en lettres (fr + ar) et dans l'échelle usuelle,
//    avec confirmation au-delà du seuil de montant élevé ;
//  - pièces jointes envoyées à l'enregistrement, nettoyées si celui-ci échoue.
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Controller, useForm } from 'react-hook-form';
import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { AppTextField } from '@/components/ui/AppTextField';
import { DateField, getTodayISODate } from '@/components/ui/DateField';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { accountService } from '@/modules/accounts/services/account.service';
import {
  PaymentItemAttachmentDraft,
  PaymentItemAttachmentSection,
} from '@/modules/payment-items/components/PaymentItemAttachmentSection';
import { AccountPickerField, ClientPickerField } from '@/modules/payment-items/components/PaymentPartyPickers';
import {
  useCreatePaymentItem,
  usePaymentItemWithAttachments,
  useUpdatePaymentItem,
} from '@/modules/payment-items/hooks/usePaymentItems';
import { paymentItemSchema, PaymentItemFormValues } from '@/modules/payment-items/schemas/paymentItem.schema';
import {
  buildPaymentItemReference,
  getPaymentItemAccount,
  getPaymentItemStatusLabel,
  paymentItemStatusOptions,
} from '@/modules/payment-items/utils/paymentItemPresentation';
import {
  getPaymentItemAttachmentErrorMessage,
  getPaymentItemAttachments,
} from '@/modules/payment-items/utils/paymentItemAttachments';
import { paymentItemService } from '@/modules/payment-items/services/paymentItem.service';
import { useDefaultCurrency } from '@/modules/settings/hooks/useDefaultCurrency';
import { useSettings } from '@/modules/settings/hooks/useSettings';
import { MobileStackParamList } from '@/navigation/types';
import { BankAccount, Client, PaymentItem, StrapiUploadFile } from '@/types';
import { brand, radius, spacing } from '@/theme/brand';
import { confirmAction } from '@/utils/confirm';
import {
  describeColloquialAmount,
  formatAmountInWords,
  formatAmountInWordsArabic,
  formatCurrency,
  HIGH_AMOUNT_CONFIRMATION_THRESHOLD,
} from '@/utils/format';

// ── Sélecteur générique ─────────────────────────────────────────────────
function ButtonSelector<T extends string>({ value, options, labels, onChange, colors, disabled }: {
  value: T;
  options: T[];
  labels?: Record<string, string>;
  onChange: (v: T) => void;
  colors?: Record<string, string>;
  disabled?: boolean;
}) {
  return (
    <View style={sel.row}>
      {options.map((opt) => {
        const selected = value === opt;
        const bg = selected ? (colors?.[opt] ?? brand.blue700) : brand.slate200;
        return (
          <Pressable
            key={opt}
            style={[sel.btn, { backgroundColor: bg }, disabled && sel.btnDisabled]}
            onPress={() => onChange(opt)}
            disabled={disabled}
          >
            <Text style={[sel.text, selected && sel.textSelected]}>{labels?.[opt] ?? opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const sel = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  btn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 },
  btnDisabled: { opacity: 0.5 },
  text: { fontWeight: '700', fontSize: 13, color: brand.slate700 },
  textSelected: { color: brand.white },
});

// ── Couleurs des options, alignées sur le web ───────────────────────────
const TYPE_COLORS: Record<string, string> = {
  CHEQUE: brand.warning,
  TRAITE: brand.violet,
  AUTRE: brand.slate500,
};

const DIRECTION_COLORS: Record<string, string> = {
  IN: brand.credit,
  OUT: brand.danger,
};

const STATUS_COLORS: Record<string, string> = {
  'Déposé': brand.warning,
  'Payé': brand.credit,
  'Annulé': brand.slate500,
  'En retard': brand.danger,
};

const PAYMENT_METHOD_COLORS: Record<string, string> = {
  ESPECES: brand.credit,
  VIREMENT: brand.blue600,
  CARTE: '#0891B2',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  ESPECES: 'Espèces',
  VIREMENT: 'Virement',
  CARTE: 'Carte',
};


/** Format: XXXX XXXX XXXX — chiffres seuls, 12 au maximum. */
function formatRefDisplay(clean: string): string {
  const digits = clean.replace(/\D/g, '').slice(0, 12);
  if (digits.length > 8) return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8)}`;
  if (digits.length > 4) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  return digits;
}

/** Insère une espace tous les 3 chiffres dans la partie entière. */
function formatAmountDisplay(value: string): string {
  if (!value) return '';
  const clean = value.replace(/\s/g, '');
  const dotIndex = clean.indexOf('.');
  const intPart = dotIndex >= 0 ? clean.slice(0, dotIndex) : clean;
  const decPart = dotIndex >= 0 ? clean.slice(dotIndex) : '';
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + decPart;
}

function stripSpaces(value: string): string {
  return value.replace(/\s/g, '');
}

/** Repère d'urgence de l'échéance — mêmes seuils que le web. */
function getDueDateUrgency(dateStr: string): { color: string; helperText: string } {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return { color: brand.slate400, helperText: '' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);

  if (Number.isNaN(due.getTime())) {
    return { color: brand.slate400, helperText: '' };
  }

  const diffDays = Math.round((due.getTime() - today.getTime()) / 86_400_000);

  if (diffDays < 0) return { color: brand.danger, helperText: `Échue depuis ${Math.abs(diffDays)} j` };
  if (diffDays <= 7) return { color: brand.warning, helperText: `Dans ${diffDays} j` };
  return { color: brand.credit, helperText: `Dans ${diffDays} j` };
}

const getClientLabel = (client?: Client | null) =>
  client?.companyName?.trim() || client?.fullName?.trim() || client?.name?.trim() || '';

/* ────────────────────────────────────────────────────────────────────────
 * Écran : charge le détail complet en édition, puis monte le formulaire.
 * ──────────────────────────────────────────────────────────────────────── */
export function PaymentItemFormScreen({ navigation, route }: NativeStackScreenProps<MobileStackParamList, 'PaymentItemForm'>) {
  const routeItem = route.params?.paymentItem;
  const isEdit = Boolean(routeItem?.id);
  // La liste ne renvoie pas les pièces jointes : le formulaire d'édition relit
  // l'enregistrement complet, comme le web avant d'ouvrir sa boîte de dialogue.
  const detailsQuery = usePaymentItemWithAttachments(routeItem?.id ? Number(routeItem.id) : null, isEdit);

  if (isEdit && detailsQuery.isLoading) {
    return (
      <Screen>
        <LoadingState message="Chargement du paiement…" />
      </Screen>
    );
  }

  const current = (detailsQuery.data ?? routeItem ?? null) as PaymentItem | null;

  return (
    <PaymentItemFormBody
      key={`${current?.id ?? 'new'}-${detailsQuery.data ? 'full' : 'partial'}`}
      navigation={navigation}
      current={current}
      isEdit={isEdit}
      initialAttachments={detailsQuery.data ? getPaymentItemAttachments(detailsQuery.data) : []}
      // Comme sur le web : en édition, la section n'apparaît qu'une fois le
      // détail chargé — sans lui, les fichiers déjà liés seraient effacés.
      showAttachmentSection={!isEdit || Boolean(detailsQuery.data)}
    />
  );
}

interface PaymentItemFormBodyProps {
  navigation: NativeStackScreenProps<MobileStackParamList, 'PaymentItemForm'>['navigation'];
  current: PaymentItem | null;
  isEdit: boolean;
  initialAttachments: StrapiUploadFile[];
  showAttachmentSection: boolean;
}

function PaymentItemFormBody({
  navigation,
  current,
  isEdit,
  initialAttachments,
  showAttachmentSection,
}: PaymentItemFormBodyProps) {
  const defaultCurrency = useDefaultCurrency();
  const { data: settings } = useSettings();
  const companyName = settings?.companyName || '';
  const defaultAlertDays = settings?.defaultAlertDays ?? settings?.alertDaysBefore ?? 3;
  const createMutation = useCreatePaymentItem();
  const updateMutation = useUpdatePaymentItem();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isBusy = createMutation.isPending || updateMutation.isPending || isSubmitting;

  const initialClient = current?.client ?? null;
  const initialAccount = getPaymentItemAccount(current);

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<PaymentItemFormValues>({
    resolver: zodResolver(paymentItemSchema),
    defaultValues: {
      type: current?.type ?? 'CHEQUE',
      direction: current?.direction ?? 'IN',
      amount: current?.amount ?? 0,
      currency: current?.currency ?? defaultCurrency,
      status: (getPaymentItemStatusLabel(current?.status) as any) ?? 'Déposé',
      issueDate: current?.issueDate ? current.issueDate.slice(0, 10) : isEdit ? '' : getTodayISODate(),
      dueDate: current?.dueDate ? current.dueDate.slice(0, 10) : '',
      drawer: current?.drawer ?? '',
      drawee: current?.drawee ?? '',
      alertEnabled: current?.alertEnabled ?? true,
      alertDaysBefore: current?.alertDaysBefore ?? defaultAlertDays,
      paymentMethod: current?.paymentMethod ?? 'ESPECES',
      notes: current?.notes ?? '',
      referencePayment: current?.referencePayment ?? '',
      client: (current?.client?.id as any) ?? (undefined as any),
      account: (initialAccount?.id as any) ?? (undefined as any),
    },
  });

  const watchedType = watch('type');
  const watchedDirection = watch('direction');
  const watchedCurrency = watch('currency');
  const watchedDueDate = watch('dueDate');
  const watchedClientId = watch('client');
  const watchedAlertEnabled = watch('alertEnabled');
  const showReferencePayment = watchedType === 'CHEQUE' || watchedType === 'TRAITE';
  const showPaymentMethod = watchedType === 'AUTRE';
  const dueDateUrgency = useMemo(() => getDueDateUrgency(watchedDueDate || ''), [watchedDueDate]);

  /* ── Montant : masque, lettres, échelle usuelle ─────────────────────── */
  const [amountDisplay, setAmountDisplay] = useState(() => {
    const value = current?.amount;
    return value != null && value !== 0 ? formatAmountDisplay(String(value)) : '';
  });
  const amountInWords = useMemo(
    () => formatAmountInWords(stripSpaces(amountDisplay), watchedCurrency),
    [amountDisplay, watchedCurrency],
  );
  const amountInWordsArabic = useMemo(
    () => formatAmountInWordsArabic(stripSpaces(amountDisplay), watchedCurrency),
    [amountDisplay, watchedCurrency],
  );
  const amountNumber = useMemo(() => {
    const parsed = Number.parseFloat(stripSpaces(amountDisplay));
    return Number.isFinite(parsed) ? parsed : 0;
  }, [amountDisplay]);
  const colloquialAmount = useMemo(
    () => describeColloquialAmount(amountNumber, watchedCurrency),
    [amountNumber, watchedCurrency],
  );
  const isMilyarScale = colloquialAmount?.scale === 'milyar';
  const isHighAmount = amountNumber > HIGH_AMOUNT_CONFIRMATION_THRESHOLD;

  /* ── Référence de paiement ──────────────────────────────────────────── */
  const [refPayDisplay, setRefPayDisplay] = useState(() => formatRefDisplay(current?.referencePayment ?? ''));
  const refPayDigitCount = useMemo(() => refPayDisplay.replace(/\D/g, '').length, [refPayDisplay]);

  /* ── Pièces jointes ─────────────────────────────────────────────────── */
  const [attachmentDraft, setAttachmentDraft] = useState<PaymentItemAttachmentDraft>({
    keptAttachmentIds: initialAttachments.map((attachment) => attachment.id),
    removedAttachmentIds: [],
    newFiles: [],
  });

  /* ── Client & comptes ───────────────────────────────────────────────── */
  const [selectedClient, setSelectedClient] = useState<Client | null>(initialClient);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(initialAccount);

  const { data: clientAccounts = [], isFetching: isAccountsLoading } = useQuery({
    queryKey: ['accounts', 'by-client', watchedClientId ?? null],
    queryFn: () => accountService.listByClient(watchedClientId ? Number(watchedClientId) : null),
    enabled: Boolean(watchedClientId),
    staleTime: 30_000,
  });

  // Le compte déjà lié reste proposé tant que le client n'a pas changé.
  const accountOptions = useMemo(() => {
    const map = new Map<number, BankAccount>();

    if (initialAccount?.id && Number(watchedClientId) === Number(initialClient?.id ?? -1)) {
      map.set(Number(initialAccount.id), initialAccount);
    }

    clientAccounts.forEach((account) => map.set(Number(account.id), account));
    return Array.from(map.values());
  }, [clientAccounts, initialAccount, initialClient, watchedClientId]);

  // Changement de client : le compte sélectionné n'a plus de raison d'être.
  useEffect(() => {
    if (isEdit && initialClient?.id && Number(initialClient.id) === Number(watchedClientId) && initialAccount) {
      return;
    }

    setSelectedAccount(null);
    setValue('account', undefined as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedClientId]);

  // Méthode de paiement : réservée au type « Autre ».
  useEffect(() => {
    if (!showPaymentMethod) {
      setValue('paymentMethod', undefined as any);
    } else {
      setValue('paymentMethod', (current?.paymentMethod ?? 'ESPECES') as any);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPaymentMethod]);

  // Tireur / tiré : déduits du sens de l'opération et du client.
  useEffect(() => {
    const clientLabel = getClientLabel(selectedClient);

    if (watchedDirection === 'IN') {
      setValue('drawer', companyName);
      setValue('drawee', clientLabel);
    } else {
      setValue('drawer', clientLabel);
      setValue('drawee', companyName);
    }
  }, [watchedDirection, selectedClient, companyName, setValue]);

  /* ── Enregistrement ─────────────────────────────────────────────────── */
  const submitFormValues = async (values: PaymentItemFormValues) => {
    setSubmitError(null);
    setIsSubmitting(true);
    let uploadedAttachments: StrapiUploadFile[] = [];

    try {
      if (showAttachmentSection && attachmentDraft.newFiles.length) {
        uploadedAttachments = await paymentItemService.uploadAttachments(attachmentDraft.newFiles);
      }

      const payload = {
        ...values,
        referenceNumber: buildPaymentItemReference(values.type, values.direction),
        paymentMethod: values.type === 'AUTRE' ? (values.paymentMethod ?? null) : null,
        supprimer: false,
        ...(showAttachmentSection
          ? {
              attachments: [
                ...attachmentDraft.keptAttachmentIds,
                ...uploadedAttachments.map((attachment) => attachment.id),
              ],
            }
          : {}),
      };

      if (isEdit && current?.id) {
        await updateMutation.mutateAsync({ id: Number(current.id), payload: payload as any });
      } else {
        await createMutation.mutateAsync(payload as any);
      }

      navigation.goBack();
    } catch (error) {
      // Les fichiers déjà envoyés seraient orphelins dans la médiathèque.
      if (uploadedAttachments.length) {
        try {
          await paymentItemService.removeUploadedFiles(uploadedAttachments.map((file) => file.id));
        } catch (cleanupError) {
          console.warn('Nettoyage des pièces jointes uploadées impossible', cleanupError);
        }
      }

      setSubmitError(
        getPaymentItemAttachmentErrorMessage(
          error,
          "Impossible d'enregistrer le paiement avec ses pièces jointes.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (values: PaymentItemFormValues) => {
    // Au-delà du seuil, la saisie est trop rare pour être enregistrée sans confirmation.
    if (Number(values.amount) > HIGH_AMOUNT_CONFIRMATION_THRESHOLD) {
      const confirmed = await confirmAction({
        title: 'Confirmer un montant élevé',
        message: `Ce montant dépasse ${formatCurrency(HIGH_AMOUNT_CONFIRMATION_THRESHOLD, watchedCurrency)}, ce qui est rare. Vérifiez-le avant d'enregistrer le paiement.`,
        highlight: {
          value: formatCurrency(Number(values.amount), watchedCurrency),
          lines: [
            colloquialAmount ? `Soit ${colloquialAmount.label} — ${colloquialAmount.arabicLabel}` : '',
            amountInWords,
          ],
        },
        confirmLabel: 'Oui, enregistrer',
        cancelLabel: 'Corriger',
        tone: 'warning',
      });

      if (!confirmed) {
        return;
      }
    }

    await submitFormValues(values);
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>{isEdit ? 'Modifier le paiement' : 'Nouveau paiement'}</Text>

          {/* ── Parties concernées ─────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Parties concernées</Text>
            <Controller name="client" control={control} render={({ field }) => (
              <ClientPickerField
                value={selectedClient}
                error={errors.client?.message}
                onChange={(client) => {
                  setSelectedClient(client);
                  field.onChange(client?.id ?? undefined);
                }}
              />
            )} />
            <Controller name="account" control={control} render={({ field }) => (
              <AccountPickerField
                value={selectedAccount}
                options={accountOptions}
                loading={isAccountsLoading}
                disabled={!watchedClientId}
                error={errors.account?.message}
                onChange={(account) => {
                  setSelectedAccount(account);
                  field.onChange(account?.id ?? undefined);
                }}
              />
            )} />
          </View>

          {/* ── Caractéristiques du paiement ───────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Caractéristiques du paiement</Text>

            <Text style={styles.fieldLabel}>Type</Text>
            <Controller name="type" control={control} render={({ field }) => (
              <ButtonSelector
                value={field.value}
                options={['CHEQUE', 'TRAITE', 'AUTRE']}
                labels={{ CHEQUE: 'Chèque', TRAITE: 'Traite', AUTRE: 'Autre' }}
                onChange={field.onChange}
                colors={TYPE_COLORS}
              />
            )} />

            <Text style={styles.fieldLabel}>Sens</Text>
            <Controller name="direction" control={control} render={({ field }) => (
              <ButtonSelector
                value={field.value}
                options={['IN', 'OUT']}
                labels={{ IN: '↑ Entrant', OUT: '↓ Sortant' }}
                onChange={field.onChange}
                colors={DIRECTION_COLORS}
              />
            )} />

            <Controller name="amount" control={control} render={({ field }) => (
              <AppTextField
                label="Montant *"
                value={amountDisplay}
                icon="cash-outline"
                keyboardType="numeric"
                placeholder="0.00"
                error={errors.amount?.message}
                onChangeText={(text) => {
                  const stripped = stripSpaces(text).replace(',', '.');

                  // Chiffres et un seul séparateur décimal.
                  if (stripped !== '' && !/^\d*\.?\d*$/.test(stripped)) {
                    return;
                  }

                  setAmountDisplay(formatAmountDisplay(stripped));
                  const parsed = stripped === '' || stripped === '.' ? 0 : Number.parseFloat(stripped);
                  if (!Number.isNaN(parsed)) {
                    field.onChange(parsed);
                  }
                }}
                onBlur={() => {
                  const stripped = stripSpaces(amountDisplay);
                  setAmountDisplay(
                    stripped === '' || Number.isNaN(Number.parseFloat(stripped))
                      ? ''
                      : formatAmountDisplay(stripped),
                  );
                }}
              />
            )} />

            <Controller name="currency" control={control} render={({ field }) => (
              <AppTextField
                label="Devise"
                value={field.value}
                icon="swap-horizontal-outline"
                onChangeText={field.onChange}
                placeholder="TND"
                error={errors.currency?.message}
              />
            )} />

            {amountInWords ? (
              <View style={styles.amountWordsBox}>
                <Text style={styles.amountWordsText}>{amountInWords}</Text>
                {amountInWordsArabic ? (
                  <Text style={styles.amountWordsArabic}>{amountInWordsArabic}</Text>
                ) : null}
              </View>
            ) : null}

            {colloquialAmount ? (
              <View style={[styles.scaleChip, isMilyarScale && styles.scaleChipAlert]}>
                <Text style={[styles.scaleChipText, isMilyarScale && styles.scaleChipTextAlert]}>
                  {colloquialAmount.label}
                </Text>
              </View>
            ) : null}

            {isHighAmount ? (
              <View style={styles.warningBox}>
                <Text style={styles.warningTitle}>
                  Montant inhabituellement élevé : {formatCurrency(amountNumber, watchedCurrency)}
                  {colloquialAmount ? ` (${colloquialAmount.label})` : ''}
                </Text>
                <Text style={styles.warningText}>
                  Au-delà de {formatCurrency(HIGH_AMOUNT_CONFIRMATION_THRESHOLD, watchedCurrency)}, une confirmation
                  sera demandée à l'enregistrement. Vérifiez qu'un zéro n'a pas été saisi en trop.
                </Text>
              </View>
            ) : null}

            {showReferencePayment ? (
              <Controller name="referencePayment" control={control} render={({ field }) => (
                <AppTextField
                  label="Référence de paiement *"
                  value={refPayDisplay}
                  icon="pricetag-outline"
                  placeholder="9999 9999 9999"
                  keyboardType="numeric"
                  maxLength={14}
                  error={errors.referencePayment?.message}
                  trailing={
                    refPayDigitCount > 0 ? (
                      <Text style={[styles.counter, refPayDigitCount === 12 && styles.counterComplete]}>
                        {refPayDigitCount}/12
                      </Text>
                    ) : null
                  }
                  onChangeText={(text) => {
                    const digits = text.replace(/\D/g, '').slice(0, 12);
                    setRefPayDisplay(formatRefDisplay(digits));
                    field.onChange(digits);
                  }}
                />
              )} />
            ) : null}

            {showPaymentMethod ? (
              <>
                <Text style={styles.fieldLabel}>Méthode de paiement</Text>
                <Controller name="paymentMethod" control={control} render={({ field }) => (
                  <ButtonSelector
                    value={(field.value ?? 'ESPECES') as 'ESPECES' | 'VIREMENT' | 'CARTE'}
                    options={['ESPECES', 'VIREMENT', 'CARTE']}
                    labels={PAYMENT_METHOD_LABELS}
                    onChange={field.onChange}
                    colors={PAYMENT_METHOD_COLORS}
                  />
                )} />
              </>
            ) : null}
          </View>

          {/* ── Statut et échéances ─────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Statut et échéances</Text>

            <Text style={styles.fieldLabel}>Statut</Text>
            <Controller name="status" control={control} render={({ field }) => (
              <ButtonSelector
                value={field.value}
                options={paymentItemStatusOptions.map((option) => option.value)}
                onChange={field.onChange}
                colors={STATUS_COLORS}
              />
            )} />
            {errors.status ? <Text style={styles.fieldError}>{errors.status.message}</Text> : null}

            <Controller name="issueDate" control={control} render={({ field }) => (
              <DateField
                label="Date d'émission"
                value={field.value}
                icon="calendar-outline"
                error={errors.issueDate?.message}
                onChange={field.onChange}
              />
            )} />

            <Controller name="dueDate" control={control} render={({ field }) => (
              <DateField
                label="Échéance *"
                value={field.value}
                icon={dueDateUrgency.helperText ? 'alert-circle-outline' : 'time-outline'}
                error={errors.dueDate?.message}
                helperText={dueDateUrgency.helperText}
                helperTextColor={dueDateUrgency.color}
                clearable={false}
                onChange={field.onChange}
              />
            )} />

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchLabel}>Alertes</Text>
                <Text style={styles.switchHint}>Recevoir une notification avant l'échéance</Text>
              </View>
              <Controller name="alertEnabled" control={control} render={({ field }) => (
                <Switch
                  value={field.value}
                  onValueChange={field.onChange}
                  trackColor={{ false: brand.slate200, true: brand.blue700 }}
                  thumbColor={brand.white}
                />
              )} />
            </View>

            <Controller name="alertDaysBefore" control={control} render={({ field }) => (
              <AppTextField
                label="Jours avant"
                value={field.value != null ? String(field.value) : ''}
                icon="alarm-outline"
                keyboardType="numeric"
                maxLength={3}
                placeholder="3"
                editable={Boolean(watchedAlertEnabled)}
                error={errors.alertDaysBefore?.message}
                onChangeText={(text) => {
                  const digits = text.replace(/\D/g, '');
                  field.onChange(digits === '' ? 0 : Number(digits));
                }}
              />
            )} />
          </View>

          {/* ── Parties (auto-renseignées) ──────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Parties (auto-renseignées)</Text>
            <Controller name="drawer" control={control} render={({ field }) => (
              <AppTextField
                label="Tireur"
                value={field.value ?? ''}
                icon="business-outline"
                editable={false}
                onChangeText={field.onChange}
                placeholder="Déduit du sens et du client"
              />
            )} />
            <Controller name="drawee" control={control} render={({ field }) => (
              <AppTextField
                label="Tiré"
                value={field.value ?? ''}
                icon="person-outline"
                editable={false}
                onChangeText={field.onChange}
                placeholder="Déduit du sens et du client"
              />
            )} />
          </View>

          {/* ── Notes ──────────────────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Controller name="notes" control={control} render={({ field }) => (
              <AppTextField
                label="Notes"
                value={field.value ?? ''}
                icon="document-text-outline"
                onChangeText={field.onChange}
                placeholder="Commentaires, informations complémentaires..."
                multiline
              />
            )} />
          </View>

          {/* ── Pièces jointes ─────────────────────────────────────── */}
          {showAttachmentSection ? (
            <PaymentItemAttachmentSection
              mode={isEdit ? 'edit' : 'create'}
              existingAttachments={initialAttachments}
              loading={isBusy}
              submitError={submitError}
              onChange={setAttachmentDraft}
            />
          ) : submitError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorBoxText}>{submitError}</Text>
            </View>
          ) : null}

          {/* ── Actions ────────────────────────────────────────────── */}
          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={() => navigation.goBack()} disabled={isBusy}>
              <Text style={styles.cancelBtnText}>Annuler</Text>
            </Pressable>
            <Pressable style={[styles.submitBtn, isBusy && styles.submitBtnDisabled]} onPress={handleSubmit(onSubmit)} disabled={isBusy}>
              <Text style={styles.submitBtnText}>
                {isBusy ? 'Enregistrement...' : 'Enregistrer'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', color: brand.navy900, marginBottom: 16 },
  section: {
    borderWidth: 1,
    borderColor: brand.slate200,
    borderRadius: radius.lg,
    backgroundColor: brand.slate50,
    padding: spacing.lg - 2,
    marginBottom: spacing.lg - 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: brand.slate700,
    marginBottom: spacing.md,
  },
  fieldLabel: { fontSize: 12.5, fontWeight: '700', color: brand.slate700, marginBottom: 6 },
  fieldError: { color: brand.danger, fontSize: 12, marginTop: -8, marginBottom: 10 },
  amountWordsBox: {
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.18)',
    backgroundColor: brand.blue50,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  amountWordsText: { fontSize: 13, fontWeight: '700', lineHeight: 19, color: '#1E3A8A' },
  amountWordsArabic: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 24,
    textAlign: 'right',
    writingDirection: 'rtl',
    color: '#1E3A8A',
  },
  scaleChip: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: brand.slate300,
    backgroundColor: brand.slate100,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 14,
  },
  scaleChipAlert: {
    borderColor: 'rgba(220,38,38,0.45)',
    backgroundColor: brand.dangerBg,
  },
  scaleChipText: { fontSize: 12, fontWeight: '800', color: brand.slate600 },
  scaleChipTextAlert: { color: brand.danger },
  warningBox: {
    borderWidth: 1,
    borderColor: 'rgba(217,119,6,0.35)',
    backgroundColor: brand.warningBg,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 14,
  },
  warningTitle: { fontSize: 13, fontWeight: '800', color: brand.warning, lineHeight: 19 },
  warningText: { marginTop: 4, fontSize: 12, color: brand.slate600, lineHeight: 17 },
  counter: { fontSize: 11.5, fontWeight: '800', color: brand.slate400 },
  counterComplete: { color: brand.credit },
  switchRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 12, marginBottom: 14 },
  switchLabel: { fontSize: 14, fontWeight: '700', color: brand.navy900 },
  switchHint: { fontSize: 12, color: brand.slate400, marginTop: 2 },
  errorBox: {
    borderWidth: 1,
    borderColor: brand.danger,
    backgroundColor: brand.dangerBg,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: spacing.lg - 2,
  },
  errorBoxText: { fontSize: 12.5, fontWeight: '700', color: brand.danger },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: radius.md, backgroundColor: brand.slate100, alignItems: 'center' },
  cancelBtnText: { fontWeight: '700', color: brand.slate600, fontSize: 15 },
  submitBtn: { flex: 2, paddingVertical: 14, borderRadius: radius.md, backgroundColor: brand.blue700, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontWeight: '800', color: brand.white, fontSize: 15 },
});
