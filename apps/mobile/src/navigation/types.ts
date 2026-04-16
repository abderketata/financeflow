import { Client, PaymentItem, Transaction } from '@/types';

export type MobileStackParamList = {
  Tabs: undefined;
  ClientList: undefined;
  ClientForm: { client?: Client } | undefined;
  PaymentItemList: undefined;
  PaymentItemForm: { paymentItem?: PaymentItem } | undefined;
  TransactionList: undefined;
  TransactionForm: { transaction?: Transaction } | undefined;
  AlertList: undefined;
  Settings: undefined;
};

