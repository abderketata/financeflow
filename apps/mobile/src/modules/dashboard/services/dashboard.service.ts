import { AlertItem, DashboardSummary, PaymentItem, Transaction } from '@/types';
import { alertService } from '@/modules/alerts/services/alert.service';
import { paymentItemService } from '@/modules/payment-items/services/paymentItem.service';
import { isPaymentItemClosedStatus, mapPaymentItemsToTransactions } from '@/modules/payment-items/utils/paymentItemPresentation';

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

const sumByType = (items: Transaction[], operationType: 'DEBIT' | 'CREDIT') =>
  items.filter((item) => item.operationType === operationType).reduce((total, item) => total + Number(item.amount || 0), 0);

export const dashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    const now = new Date();
    const yearStart = `${now.getFullYear()}-01-01`;
    const yearEnd = `${now.getFullYear()}-12-31`;
    const monthStart = startOfMonthNative(now);
    const monthEnd = endOfMonthNative(now);
    const weekStart = startOfWeekNative(now);
    const weekEnd = endOfWeekNative(now);

    // Dashboard must ignore soft-deleted payment-items (`supprimer=true`) without affecting other screens.
    const [paymentItems, alerts] = await Promise.all([
      paymentItemService.listActive({
        populate: '*',
        filters: {
          echeance: {
            $gte: yearStart,
            $lte: yearEnd,
          },
        },
      }),
      alertService.list({ populate: '*' })
    ]);

    const transactions = mapPaymentItemsToTransactions(paymentItems)
      .map((item) => ({ item, parsedDate: parseDashboardDate(item.operationDate) }))
      .filter((entry): entry is { item: Transaction; parsedDate: Date } => Boolean(entry.parsedDate));

    const monthTransactions = transactions
      .filter(({ parsedDate }) => parsedDate >= monthStart && parsedDate <= monthEnd)
      .map(({ item }) => item);

    const yearTransactions = transactions.filter(({ parsedDate }) => parsedDate.getFullYear() === now.getFullYear());

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
    const unreadAlerts = alerts.filter((item: AlertItem) => !item.isRead);

    const weeklyChart = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + index);

      const dayTransactions = transactions
        .filter(({ parsedDate }) => isSameDayNative(parsedDate, day))
        .map(({ item }) => item);

      return {
        label: toChartLabel(WEEK_LABELS[day.getDay()]),
        tooltipLabel: `${WEEK_TOOLTIP_LABELS[day.getDay()]} ${day.getDate()}`,
        credit: sumByType(dayTransactions, 'CREDIT'),
        debit: sumByType(dayTransactions, 'DEBIT'),
      };
    });

    const monthlyChart = Array.from({ length: 12 }, (_, index) => {
      const monthDate = new Date(now.getFullYear(), index, 1);
      const monthTransactionsGroup = yearTransactions
        .filter(({ parsedDate }) => isSameMonthNative(parsedDate, monthDate))
        .map(({ item }) => item);

      return {
        label: toChartLabel(MONTH_LABELS[index]),
        tooltipLabel: `${MONTH_TOOLTIP_LABELS[index]} ${now.getFullYear()}`,
        credit: sumByType(monthTransactionsGroup, 'CREDIT'),
        debit: sumByType(monthTransactionsGroup, 'DEBIT'),
      };
    });

    return {
      monthlyCredits: sumByType(monthTransactions, 'CREDIT'),
      monthlyDebits: sumByType(monthTransactions, 'DEBIT'),
      dueThisWeekCount: dueThisWeek.length,
      overdueCount: overdue.length,
      unreadAlertsCount: unreadAlerts.length,
      weeklyChart,
      monthlyChart,
      upcomingPaymentItems: dueThisWeek.slice(0, 5)
    };
  }
};

