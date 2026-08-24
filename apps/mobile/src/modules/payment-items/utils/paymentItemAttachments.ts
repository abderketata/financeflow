import { apiBaseUrl } from '@/services/api/client';
import { PaymentItem, RelationCollection, StrapiUploadFile } from '@/types';

const STRAPI_BASE_URL = apiBaseUrl.replace(/\/$/, '');
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

/** Taille lisible d'une pièce jointe : « 1,2 Mo », « 340 Ko », « 812 o ». */
export const formatAttachmentSize = (size?: number | null) => {
  if (!Number.isFinite(size) || (size ?? 0) <= 0) {
    return '';
  }

  const value = Number(size);

  if (value >= 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(1)} Mo`;
  }

  if (value >= 1024) {
    return `${Math.round(value / 102.4) / 10} Ko`;
  }

  return `${value} o`;
};
