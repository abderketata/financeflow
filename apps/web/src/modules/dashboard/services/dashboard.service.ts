import { endOfMonth, endOfWeek, endOfYear, format, isBefore, isSameDay, isSameMonth, isValid, isWithinInterval, parseISO, startOfMonth, startOfWeek, startOfYear } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DashboardSummary, PaymentItem, Transaction } from '@/types/domain';
import { alertService } from '@/modules/alerts/services/alert.service';
import { paymentItemService } from '@/modules/payment-items/services/paymentItem.service';
import { isPaymentItemClosedStatus, mapPaymentItemsToTransactions } from '@/modules/payment-items/utils/paymentItemPresentation';

const sumByType = (items: Transaction[], operationType: 'DEBIT' | 'CREDIT') =>
  items
    .filter((item) => item.operationType === operationType)
    .reduce((total, item) => total + Number(item.amount || 0), 0);

const parseDashboardDate = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const parsed = parseISO(value);

  if (isValid(parsed)) {
    return parsed;
  }

  const fallback = new Date(value);
  return isValid(fallback) ? fallback : null;
};

const toChartLabel = (value: string) => {
  const sanitized = value.replace(/\.$/, '');
  return sanitized.charAt(0).toUpperCase() + sanitized.slice(1);
};

const getPaymentItemDueDate = (item: PaymentItem) => parseDashboardDate(item.dueDate ?? (item as { echeance?: string | null }).echeance ?? null);

const DASHBOARD_PAYMENT_ITEM_FIELDS = [
  'referenceNumber',
  'amount',
  'direction',
  'status',
  'type',
  'echeance',
] as const;

const DASHBOARD_PAYMENT_ITEMS_PAGE_SIZE = 250;

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
    const currentYearStart = startOfYear(new Date(year, 0, 1));
    const currentYearEnd = endOfYear(currentYearStart);

    const [paymentItems, unreadAlertsCount] = await Promise.all([
      paymentItemService.listAllActive({
        fields: [...DASHBOARD_PAYMENT_ITEM_FIELDS],
        filters: {
          echeance: {
            $gte: format(currentYearStart, 'yyyy-MM-dd'),
            $lte: format(currentYearEnd, 'yyyy-MM-dd'),
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
  buildSummary(dataset: DashboardDataset, selectedWeekDate = new Date()): DashboardSummary {
    const now = new Date();
    const datasetYear = dataset.year;
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const weekStart = startOfWeek(selectedWeekDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(selectedWeekDate, { weekStartsOn: 1 });
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
        const effectiveDate = getPaymentItemDueDate(item);
        return effectiveDate ? isWithinInterval(effectiveDate, { start: weekStart, end: weekEnd }) : false;
      })
      .sort((left, right) => (getPaymentItemDueDate(left)?.getTime() ?? 0) - (getPaymentItemDueDate(right)?.getTime() ?? 0));

    const overdue = paymentItems.filter((item: PaymentItem) => {
      const effectiveDate = getPaymentItemDueDate(item);
      return effectiveDate ? isBefore(effectiveDate, now) && !isPaymentItemClosedStatus(item.status) : false;
    });

    const weeklyChart = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + index);

      const dayTransactions = transactions
        .filter(({ parsedDate }) => isSameDay(parsedDate, day))
        .map(({ item }) => item);

      return {
        label: toChartLabel(format(day, 'EEE', { locale: fr })),
        tooltipLabel: toChartLabel(format(day, 'EEEE d MMMM', { locale: fr })),
        credit: sumByType(dayTransactions, 'CREDIT'),
        debit: sumByType(dayTransactions, 'DEBIT')
      };
    });

    const monthlyChart = Array.from({ length: 12 }, (_, index) => {
      const monthDate = new Date(datasetYear, index, 1);
      const monthTransactionsGroup = yearTransactions
        .filter(({ parsedDate }) => isSameMonth(parsedDate, monthDate))
        .map(({ item }) => item);

      return {
        label: toChartLabel(format(monthDate, 'MMM', { locale: fr })),
        tooltipLabel: toChartLabel(format(monthDate, 'MMMM yyyy', { locale: fr })),
        credit: sumByType(monthTransactionsGroup, 'CREDIT'),
        debit: sumByType(monthTransactionsGroup, 'DEBIT')
      };
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

