import { createCrudService } from '@/services/api/crud';
import { PaymentItem } from '@/types/domain';

export const paymentItemService = createCrudService<PaymentItem>('/payment-items');

