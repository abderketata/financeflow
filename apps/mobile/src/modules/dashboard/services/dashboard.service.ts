import { AlertItem, DashboardSummary, PaymentItem, Transaction } from '@/types';
import { alertService } from '@/modules/alerts/services/alert.service';
import { paymentItemService } from '@/modules/payment-items/services/paymentItem.service';
import { getPaymentItemEffectiveDate, isPaymentItemClosedStatus } from '@/modules/payment-items/utils/paymentItemPresentation';
import { transactionService } from '@/modules/transactions/services/transaction.service';

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

const sumByType = (items: Transaction[], operationType: 'DEBIT' | 'CREDIT') =>
  items.filter((item) => item.operationType === operationType).reduce((total, item) => total + Number(item.amount || 0), 0);

export const dashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    const now = new Date();
    const monthStart = startOfMonthNative(now);
    const monthEnd = endOfMonthNative(now);
    const weekStart = startOfWeekNative(now);
    const weekEnd = endOfWeekNative(now);

    const [transactions, paymentItems, alerts] = await Promise.all([
      transactionService.list({ populate: '*' }),
      paymentItemService.list({ populate: '*' }),
      alertService.list({ populate: '*' })
    ]);

    const monthTransactions = transactions.filter((item) => {
      const date = new Date(item.operationDate);
      return date >= monthStart && date <= monthEnd;
    });

    const dueThisWeek = paymentItems.filter((item: PaymentItem) => getPaymentItemEffectiveDate(item) ? isWithinIntervalNative(new Date(getPaymentItemEffectiveDate(item)), { start: weekStart, end: weekEnd }) : false);
    const overdue = paymentItems.filter((item: PaymentItem) => getPaymentItemEffectiveDate(item) ? isBeforeNative(new Date(getPaymentItemEffectiveDate(item)), now) && !isPaymentItemClosedStatus(item.status) : false);
    const unreadAlerts = alerts.filter((item: AlertItem) => !item.isRead);

    return {
      monthlyCredits: sumByType(monthTransactions, 'CREDIT'),
      monthlyDebits: sumByType(monthTransactions, 'DEBIT'),
      dueThisWeekCount: dueThisWeek.length,
      overdueCount: overdue.length,
      unreadAlertsCount: unreadAlerts.length,
      upcomingPaymentItems: dueThisWeek.slice(0, 5)
    };
  }
};

