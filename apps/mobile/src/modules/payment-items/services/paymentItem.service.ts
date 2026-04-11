import { createCrudService } from '@/services/api/crud';
import { PaymentItem } from '@/types';

export const paymentItemService = createCrudService<PaymentItem>('/payment-items');

