import { ChartPoint, DashboardSummary, PaymentItem, Transaction } from '@/types';
import { alertService } from '@/modules/alerts/services/alert.service';
import { paymentItemService } from '@/modules/payment-items/services/paymentItem.service';
import { getPaymentItemStatusLabel, isPaymentItemClosedStatus, mapPaymentItemsToTransactions } from '@/modules/payment-items/utils/paymentItemPresentation';

const startOfMonthNative = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonthNative = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
const startOfWeekNative = (date: Date) => {
  const current = new Date(date);
  const day = current.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  current.setDate(current.getDate() + diff);
  current.setHours(0, 0, 0, 0);
  return current;
};
const endOfWeekNative = (date: Date) => {
  const current = startOfWeekNative(date);
  current.setDate(current.getDate() + 6);
  current.setHours(23, 59, 59, 999);
  return current;
};
const isBeforeNative = (left: Date, right: Date) => left.getTime() < right.getTime();
const isWithinIntervalNative = (date: Date, interval: { start: Date; end: Date }) => date.getTime() >= interval.start.getTime() && date.getTime() <= interval.end.getTime();
const isSameDayNative = (left: Date, right: Date) => left.toDateString() === right.toDateString();
const isSameMonthNative = (left: Date, right: Date) => left.getMonth() === right.getMonth() && left.getFullYear() === right.getFullYear();

const parseDashboardDate = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getPaymentItemDate = (item: PaymentItem) => parseDashboardDate(item.dueDate ?? (item as { echeance?: string | null }).echeance ?? null);

const toChartLabel = (value: string) => value.charAt(0).toUpperCase() + value.slice(1).replace(/\.$/, '');

const WEEK_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const WEEK_TOOLTIP_LABELS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
const MONTH_TOOLTIP_LABELS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
const DASHBOARD_PAYMENT_ITEM_FIELDS = ['referenceNumber', 'amount', 'direction', 'status', 'type', 'echeance'] as const;
const DASHBOARD_PAYMENT_ITEMS_PAGE_SIZE = 250;

const sumByType = (items: Transaction[], operationType: 'DEBIT' | 'CREDIT') =>
  items.filter((item) => item.operationType === operationType).reduce((total, item) => total + Number(item.amount || 0), 0);


type DatedTransaction = { item: Transaction; parsedDate: Date };

/**
 * Statut « effectif » d'un effet pour les graphiques.
 *
 * Un effet resté « Déposé » alors que son échéance est passée est compté en
 * retard, exactement comme le fait le compteur « En retard » du tableau de bord :
 * sans cela l'attendu et le réalisé ne s'expliqueraient pas l'un par l'autre.
 */
const resolveChartStatus = (transaction: Transaction, dueDate: Date, now: Date) => {
  const status = getPaymentItemStatusLabel(transaction.status);

  if (status === 'Payé' || status === 'Annulé' || status === 'En retard') {
    return status;
  }

  return isBeforeNative(dueDate, now) ? 'En retard' : 'Déposé';
};

/**
 * Agrège un groupe d'effets en un point de graphique : total attendu par sens,
 * puis ventilation par statut (encaissé / en attente / en retard / annulé).
 *
 * Les effets annulés sont volontairement exclus du total attendu : cet argent
 * n'arrivera pas, l'inclure gonflerait le théorique sans contrepartie possible.
 */
const buildChartPoint = (
  label: string,
  tooltipLabel: string,
  entries: DatedTransaction[],
  now: Date,
): ChartPoint => {
  const point: ChartPoint = {
    label,
    tooltipLabel,
    credit: 0,
    debit: 0,
    creditPaid: 0,
    debitPaid: 0,
    creditPending: 0,
    debitPending: 0,
    creditOverdue: 0,
    debitOverdue: 0,
    creditCancelled: 0,
    debitCancelled: 0,
  };

  for (const { item, parsedDate } of entries) {
    const amount = Number(item.amount || 0);

    if (!Number.isFinite(amount) || amount === 0) {
      continue;
    }

    const isCredit = item.operationType === 'CREDIT';
    const status = resolveChartStatus(item, parsedDate, now);

    if (status === 'Annulé') {
      if (isCredit) point.creditCancelled = (point.creditCancelled ?? 0) + amount;
      else point.debitCancelled = (point.debitCancelled ?? 0) + amount;
      continue;
    }

    if (isCredit) point.credit += amount;
    else point.debit += amount;

    if (status === 'Payé') {
      if (isCredit) point.creditPaid = (point.creditPaid ?? 0) + amount;
      else point.debitPaid = (point.debitPaid ?? 0) + amount;
    } else if (status === 'En retard') {
      if (isCredit) point.creditOverdue = (point.creditOverdue ?? 0) + amount;
      else point.debitOverdue = (point.debitOverdue ?? 0) + amount;
    } else {
      if (isCredit) point.creditPending = (point.creditPending ?? 0) + amount;
      else point.debitPending = (point.debitPending ?? 0) + amount;
    }
  }

  return point;
};

export interface DashboardDataset {
  year: number;
  paymentItems: PaymentItem[];
  unreadAlertsCount: number;
}

const normalizeDashboardPaymentItem = (item: PaymentItem): PaymentItem => ({
  ...item,
  reference: item.reference || item.referenceNumber || '',
});

export const dashboardService = {
  async getDataset(year = new Date().getFullYear(), options?: { signal?: AbortSignal }): Promise<DashboardDataset> {
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;

    const [paymentItems, unreadAlertsCount] = await Promise.all([
      paymentItemService.listAllActive({
        fields: [...DASHBOARD_PAYMENT_ITEM_FIELDS],
        filters: {
          echeance: {
            $gte: yearStart,
            $lte: yearEnd,
          },
        },
        sort: ['id:desc'],
        pagination: {
          page: 1,
          pageSize: DASHBOARD_PAYMENT_ITEMS_PAGE_SIZE,
          withCount: true,
        },
      }, options),
      alertService.countUnread(options),
    ]);

    return {
      year,
      paymentItems: paymentItems.map(normalizeDashboardPaymentItem),
      unreadAlertsCount,
    };
  },
  buildSummary(dataset: DashboardDataset, referenceDate = new Date()): DashboardSummary {
    const now = new Date();
    const datasetYear = dataset.year;
    const monthStart = startOfMonthNative(now);
    const monthEnd = endOfMonthNative(now);
    const weekStart = startOfWeekNative(referenceDate);
    const weekEnd = endOfWeekNative(referenceDate);
    const paymentItems = dataset.paymentItems;

    const transactions = mapPaymentItemsToTransactions(paymentItems)
      .map((item) => ({ item, parsedDate: parseDashboardDate(item.operationDate) }))
      .filter((entry): entry is { item: Transaction; parsedDate: Date } => Boolean(entry.parsedDate));

    const monthTransactions = transactions
      .filter(({ parsedDate }) => parsedDate >= monthStart && parsedDate <= monthEnd)
      .map(({ item }) => item);

    const yearTransactions = transactions.filter(({ parsedDate }) => parsedDate.getFullYear() === datasetYear);

    const dueThisWeek = paymentItems
      .filter((item: PaymentItem) => {
        const effectiveDate = getPaymentItemDate(item);
        return effectiveDate ? isWithinIntervalNative(effectiveDate, { start: weekStart, end: weekEnd }) : false;
      })
      .sort((left, right) => (getPaymentItemDate(left)?.getTime() ?? 0) - (getPaymentItemDate(right)?.getTime() ?? 0));

    const overdue = paymentItems.filter((item: PaymentItem) => {
      const effectiveDate = getPaymentItemDate(item);
      return effectiveDate ? isBeforeNative(effectiveDate, now) && !isPaymentItemClosedStatus(item.status) : false;
    });

    const weeklyChart = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + index);

      return buildChartPoint(
        toChartLabel(WEEK_LABELS[day.getDay()]),
        `${WEEK_TOOLTIP_LABELS[day.getDay()]} ${day.getDate()}`,
        transactions.filter(({ parsedDate }) => isSameDayNative(parsedDate, day)),
        now,
      );
    });

    const monthlyChart = Array.from({ length: 12 }, (_, index) => {
      const monthDate = new Date(datasetYear, index, 1);

      return buildChartPoint(
        toChartLabel(MONTH_LABELS[index]),
        `${MONTH_TOOLTIP_LABELS[index]} ${datasetYear}`,
        yearTransactions.filter(({ parsedDate }) => isSameMonthNative(parsedDate, monthDate)),
        now,
      );
    });

    return {
      monthlyCredits: sumByType(monthTransactions, 'CREDIT'),
      monthlyDebits: sumByType(monthTransactions, 'DEBIT'),
      dueThisWeekCount: dueThisWeek.length,
      overdueCount: overdue.length,
      unreadAlertsCount: dataset.unreadAlertsCount,
      weeklyChart,
      monthlyChart,
      upcomingPaymentItems: dueThisWeek.slice(0, 5)
    };
  }
};

