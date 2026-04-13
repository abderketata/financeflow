import { endOfMonth, endOfWeek, format, isBefore, isWithinInterval, startOfMonth, startOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Alert, DashboardSummary, PaymentItem, Transaction } from '@/types/domain';
import { alertService } from '@/modules/alerts/services/alert.service';
import { paymentItemService } from '@/modules/payment-items/services/paymentItem.service';
import { getPaymentItemEffectiveDate, isPaymentItemClosedStatus } from '@/modules/payment-items/utils/paymentItemPresentation';
import { transactionService } from '@/modules/transactions/services/transaction.service';

const sumByType = (items: Transaction[], operationType: 'DEBIT' | 'CREDIT') =>
  items
    .filter((item) => item.operationType === operationType)
    .reduce((total, item) => total + Number(item.amount || 0), 0);

export const dashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const [transactions, paymentItems, alerts] = await Promise.all([
      transactionService.list({ populate: '*' }),
      paymentItemService.list({ populate: '*' }),
      alertService.list({ populate: '*' })
    ]);

    const monthTransactions = transactions.filter((item) => {
      const date = new Date(item.operationDate);
      return date >= monthStart && date <= monthEnd;
    });

    const dueThisWeek = paymentItems.filter((item: PaymentItem) =>
      getPaymentItemEffectiveDate(item) ? isWithinInterval(new Date(getPaymentItemEffectiveDate(item)), { start: weekStart, end: weekEnd }) : false
    );

    const overdue = paymentItems.filter((item: PaymentItem) =>
      getPaymentItemEffectiveDate(item)
        ? isBefore(new Date(getPaymentItemEffectiveDate(item)), now) && !isPaymentItemClosedStatus(item.status)
        : false
    );

    const unreadAlerts = alerts.filter((alert: Alert) => !alert.isRead);

    const weeklyChart = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + index);

      const dayTransactions = transactions.filter((item) =>
        format(new Date(item.operationDate), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
      );

      return {
        label: format(day, 'EEE', { locale: fr }),
        credit: sumByType(dayTransactions, 'CREDIT'),
        debit: sumByType(dayTransactions, 'DEBIT')
      };
    });

    const monthlyChart = Array.from({ length: 12 }, (_, index) => {
      const monthTransactionsGroup = transactions.filter((item) => new Date(item.operationDate).getMonth() === index);

      return {
        label: format(new Date(now.getFullYear(), index, 1), 'MMM', { locale: fr }),
        credit: sumByType(monthTransactionsGroup, 'CREDIT'),
        debit: sumByType(monthTransactionsGroup, 'DEBIT')
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

