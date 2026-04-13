export type Identifier = number;

export type PaymentItemType = 'CHEQUE' | 'TRAITE' | 'AUTRE';
export type PaymentDirection = 'IN' | 'OUT';
export type PaymentItemStatus = 'Reçu' | 'Déposé' | 'Payé' | 'Rejeté' | 'Annulé' | 'En retard';
export type TransactionOperationType = 'DEBIT' | 'CREDIT';

export interface Client {
  id: Identifier;
  name: string;
  code?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export interface Bank {
  id: Identifier;
  name: string;
  code?: string;
  swiftCode?: string;
}

export interface BankAccount {
  id: Identifier;
  label: string;
  accountNumber: string;
  balance?: number;
  currency?: string;
  bank?: Bank | null;
  client?: Client | null;
}

export interface PaymentItem {
  id: Identifier;
  referenceNumber: string;
  reference?: string;
  type: PaymentItemType;
  direction: PaymentDirection;
  amount: number;
  status: PaymentItemStatus | string;
  currency?: string;
  issueDate?: string;
  dueDate?: string;
  drawer?: string;
  drawee?: string;
  alertEnabled?: boolean;
  alertDaysBefore?: number;
  notes?: string;
  client?: Client | null;
  account?: BankAccount | null;
  bankAccount?: BankAccount | null;
}

export interface Transaction {
  id: Identifier;
  label: string;
  operationType: TransactionOperationType;
  amount: number;
  operationDate: string;
  notes?: string;
  client?: Client | null;
  bankAccount?: BankAccount | null;
  paymentItem?: PaymentItem | null;
}

export interface AlertItem {
  id: Identifier;
  title: string;
  message: string;
  isRead: boolean;
  triggerDate?: string;
  paymentItem?: PaymentItem | null;
  createdAt?: string;
}

export interface AppSetting {
  id: Identifier;
  currency: string;
  alertDaysBefore: number;
  weekStartsOn: 0 | 1;
  locale: string;
}

export interface DashboardSummary {
  monthlyCredits: number;
  monthlyDebits: number;
  dueThisWeekCount: number;
  overdueCount: number;
  unreadAlertsCount: number;
  upcomingPaymentItems: PaymentItem[];
}

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  jwt: string;
  user: {
    id: number;
    username: string;
    email?: string;
  };
}

