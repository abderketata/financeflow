import { PaymentItem, RelationCollection, StrapiUploadFile } from '@/types/domain';

const STRAPI_BASE_URL = (__API_BASE_URL__ || 'http://51.75.24.113:1334').replace(/\/$/, '');
const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;
const IMAGE_MIME_PATTERN = /^image\//i;

const asAttachmentArray = (value: RelationCollection<StrapiUploadFile> | undefined) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (value && Array.isArray(value.data)) {
    return value.data;
  }

  return [];
};

export const getPaymentItemAttachments = (item?: Pick<PaymentItem, 'attachments'> | null) =>
  asAttachmentArray(item?.attachments).filter((attachment): attachment is StrapiUploadFile => Boolean(attachment?.id));

export const buildPaymentItemAttachmentUrl = (attachment?: Pick<StrapiUploadFile, 'url'> | null) => {
  const rawUrl = attachment?.url?.trim();

  if (!rawUrl) {
    return null;
  }

  return ABSOLUTE_URL_PATTERN.test(rawUrl) ? rawUrl : `${STRAPI_BASE_URL}${rawUrl}`;
};

export const isPaymentItemAttachmentPreviewable = (attachment?: Pick<StrapiUploadFile, 'mime'> | null) =>
  IMAGE_MIME_PATTERN.test(attachment?.mime ?? '');

export const getPaymentItemAttachmentErrorMessage = (
  error: unknown,
  fallback = "Impossible d'enregistrer les pièces jointes du paiement.",
) => {
  const value = error as any;
  return value?.error?.message || value?.message || fallback;
};

