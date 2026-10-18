export type Identifier = number;

export type PaymentItemType = 'CHEQUE' | 'TRAITE' | 'AUTRE';
export type PaymentDirection = 'IN' | 'OUT';
export type PaymentItemStatus = 'Déposé' | 'Payé' | 'Annulé' | 'En retard';
export type PaymentMethod = 'ESPECES' | 'VIREMENT' | 'CARTE';
export type TransactionOperationType = 'DEBIT' | 'CREDIT';

export type ClientType = 'INDIVIDUAL' | 'COMPANY';
export type RelationCollection<T> = T[] | { data?: T[] | null } | null;

export interface StrapiEntity<T> {
  id: number;
  attributes: T;
}

export interface StrapiCollectionResponse<T> {
  data: Array<StrapiEntity<T> | T>;
  meta?: Record<string, unknown>;
}

export interface StrapiPaginationMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: StrapiPaginationMeta;
}

export interface Client {
  id: Identifier;
  /** Nom de compatibilité – calculé côté présentation */
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

export interface StrapiUploadFile {
  id: Identifier;
  name: string;
  alternativeText?: string | null;
  caption?: string | null;
  width?: number | null;
  height?: number | null;
  formats?: Record<string, unknown> | null;
  hash?: string;
  ext?: string;
  mime?: string;
  size?: number;
  url?: string;
  previewUrl?: string | null;
  provider?: string;
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
  attachments?: RelationCollection<StrapiUploadFile>;
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

export interface AlertItem {
  id: Identifier;
  title: string;
  message: string;
  isRead: boolean;
  scheduledAt?: string;
  sentAt?: string;
  triggerDate?: string;
  paymentItem?: PaymentItem | null;
  paymentItems?: RelationCollection<PaymentItem>;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppSetting {
  id: Identifier;
  defaultCurrency: string;
  defaultAlertDays: number;
  weekStartsOn: 'MONDAY' | 'SUNDAY';
  companyName?: string;
  currency?: string;
  alertDaysBefore?: number;
  locale?: string;
}

export interface ChartPoint {
  label: string;
  tooltipLabel?: string;
  /** Attendu (théorique) : payé + déposé + en retard. Les annulés en sont exclus. */
  credit: number;
  debit: number;
  /** Réalisé : statut « Payé », donc effectivement encaissé / décaissé. */
  creditPaid?: number;
  debitPaid?: number;
  /** En attente : statut « Déposé », échéance pas encore arrivée. */
  creditPending?: number;
  debitPending?: number;
  /** En retard : échéance dépassée et effet non réglé. */
  creditOverdue?: number;
  debitOverdue?: number;
  /** Annulé : hors total attendu, conservé pour information. */
  creditCancelled?: number;
  debitCancelled?: number;
}

export interface DashboardSummary {
  monthlyCredits: number;
  monthlyDebits: number;
  dueThisWeekCount: number;
  overdueCount: number;
  unreadAlertsCount: number;
  weeklyChart: ChartPoint[];
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

