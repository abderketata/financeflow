export type Identifier = number;

export type RelationCollection<T> = T[] | { data?: T[] | null } | null;

export type ClientType = 'INDIVIDUAL' | 'COMPANY';
export type PaymentItemType = 'CHEQUE' | 'TRAITE' | 'AUTRE';
export type PaymentDirection = 'IN' | 'OUT';
export type PaymentItemStatus = 'Déposé' | 'Payé' | 'Annulé' | 'En retard';
export type PaymentMethod = 'ESPECES' | 'VIREMENT' | 'CARTE';
export type TransactionOperationType = 'DEBIT' | 'CREDIT';

export interface Client {
  id: Identifier;
  name?: string;
  code?: string;
  type?: ClientType | string;
  fullName?: string | null;
  companyName?: string | null;
  phone?: string;
  email?: string;
  address?: string;
  identityNumber?: string | null;
  taxNumber?: string | null;
  notes?: string;
  isActive?: boolean;
  accounts?: RelationCollection<BankAccount>;
  paymentItems?: RelationCollection<PaymentItem>;
  transactions?: RelationCollection<Transaction>;
  createdAt?: string;
  updatedAt?: string;
}

export interface Bank {
  id: Identifier;
  name: string;
  code?: string;
  swiftCode?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BankAccount {
  id: Identifier;
  label: string;
  accountNumber: string;
  rib?: string;
  iban?: string;
  balance?: number;
  openingBalance?: number;
  currentBalance?: number;
  currency?: string;
  status?: string;
  isActive?: boolean;
  bank?: Bank | null;
  client?: Client | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentItem {
  id: Identifier;
  referenceNumber: string;
  reference?: string;
  referencePayment?: string;
  type: PaymentItemType;
  direction: PaymentDirection;
  amount: number;
  status: PaymentItemStatus | string;
  currency?: string;
  issueDate?: string;
  dueDate?: string;
  receptionDate?: string;
  paymentDate?: string;
  drawer?: string;
  drawee?: string;
  bankName?: string;
  instrumentAccountNumber?: string;
  alertEnabled?: boolean;
  alertDaysBefore?: number;
  paymentMethod?: PaymentMethod;
  supprimer?: boolean;
  notes?: string;
  client?: Client | null;
  account?: BankAccount | null;
  bankAccount?: BankAccount | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Transaction {
  id: Identifier;
  label: string;
  operationType: TransactionOperationType;
  amount: number;
  operationDate: string;
  valueDate?: string;
  category?: string;
  currency?: string;
  paymentMethod?: string;
  status?: string;
  isReconciled?: boolean;
  notes?: string;
  client?: Client | null;
  bankAccount?: BankAccount | null;
  paymentItem?: PaymentItem | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Alert {
  id: Identifier;
  title: string;
  message: string;
  isRead: boolean;
  triggerDate?: string;
  paymentItem?: PaymentItem | null;
  paymentItems?: RelationCollection<PaymentItem>;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppSetting {
  id: Identifier;
  companyName?: string;
  defaultCurrency: string;
  defaultAlertDays: number;
  weekStartsOn: 'MONDAY' | 'SUNDAY';
}

export interface ChartPoint {
  label: string;
  credit: number;
  debit: number;
}

export interface DashboardSummary {
  monthlyCredits: number;
  monthlyDebits: number;
  dueThisWeekCount: number;
  overdueCount: number;
  unreadAlertsCount: number;
  weeklyChart: ChartPoint[];
  monthlyChart: ChartPoint[];
  upcomingPaymentItems: PaymentItem[];
}

export interface AuthUser {
  id: number;
  username: string;
  email?: string;
}

export interface ListFilters {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  type?: string;
  status?: string;
  clientId?: number;
  bankAccountId?: number;
}

