import { useMemo, useRef, useState } from 'react';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import RotateRightRoundedIcon from '@mui/icons-material/RotateRightRounded';
import ZoomInRoundedIcon from '@mui/icons-material/ZoomInRounded';
import ZoomOutRoundedIcon from '@mui/icons-material/ZoomOutRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import { Box, Button, Dialog, DialogContent, DialogTitle, IconButton, Stack, Typography, alpha } from '@mui/material';
import { brandColors, headingFont } from '@/app/theme';
import { buildPaymentItemAttachmentUrl, getPaymentItemAttachmentErrorMessage, isPaymentItemAttachmentPreviewable } from '@/modules/payment-items/utils/paymentItemAttachments';
import { StrapiUploadFile } from '@/types/domain';

const sectionSx = {
  borderRadius: 2.5,
  border: `1px solid ${alpha(brandColors.slate[200], 0.8)}`,
  backgroundColor: alpha(brandColors.slate[50], 0.5),
  p: { xs: 1.5, md: 2 },
} as const;

const sectionTitleSx = {
  fontFamily: headingFont,
  fontWeight: 700,
  fontSize: '0.88rem',
  color: brandColors.slate[700],
  letterSpacing: '-0.01em',
  mb: 0.5,
} as const;

export interface PaymentItemAttachmentDraft {
  keptAttachmentIds: number[];
  removedAttachmentIds: number[];
  newFiles: File[];
}

interface PaymentItemAttachmentSectionProps {
  mode: 'create' | 'edit';
  existingAttachments?: StrapiUploadFile[];
  loading?: boolean;
  submitError?: string | null;
  onChange?: (draft: PaymentItemAttachmentDraft) => void;
}

function formatAttachmentSize(size: number) {
  if (!Number.isFinite(size) || size <= 0) {
    return '';
  }

  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} Mo`;
  }

  if (size >= 1024) {
    return `${Math.round(size / 102.4) / 10} Ko`;
  }

  return `${size} o`;
}

function getLocalAttachmentKey(file: File) {
  return `${file.name}::${file.size}::${file.lastModified}`;
}

export function PaymentItemAttachmentSection({
  mode,
  existingAttachments = [],
  loading,
  submitError,
  onChange,
}: PaymentItemAttachmentSectionProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [keptAttachments, setKeptAttachments] = useState(existingAttachments);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [viewerAttachment, setViewerAttachment] = useState<StrapiUploadFile | null>(null);
  const [viewerScale, setViewerScale] = useState(1);
  const [viewerRotation, setViewerRotation] = useState(0);
  const initialAttachmentIds = useMemo(() => existingAttachments.map((attachment) => attachment.id), [existingAttachments]);


  const syncDraft = (nextDraft: PaymentItemAttachmentDraft) => {
    onChange?.(nextDraft);
  };

  const updateKeptAttachments = (updater: (current: StrapiUploadFile[]) => StrapiUploadFile[]) => {
    setKeptAttachments((current) => {
      const next = updater(current);
      syncDraft({
        keptAttachmentIds: next.map((attachment) => attachment.id),
        removedAttachmentIds: initialAttachmentIds.filter((id) => !next.some((attachment) => attachment.id === id)),
        newFiles,
      });
      return next;
    });
  };

  const updateNewFiles = (updater: (current: File[]) => File[]) => {
    setNewFiles((current) => {
      const next = updater(current);
      syncDraft({
        keptAttachmentIds: keptAttachments.map((attachment) => attachment.id),
        removedAttachmentIds: initialAttachmentIds.filter((id) => !keptAttachments.some((attachment) => attachment.id === id)),
        newFiles: next,
      });
      return next;
    });
  };

  const handleSelectFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) {
      return;
    }

    updateNewFiles((currentFiles) => {
      const known = new Set(currentFiles.map(getLocalAttachmentKey));
      const next = [...currentFiles];
      files.forEach((file) => {
        const key = getLocalAttachmentKey(file);
        if (!known.has(key)) {
          known.add(key);
          next.push(file);
        }
      });
      return next;
    });

    event.target.value = '';
  };

  const openAttachment = (attachment: StrapiUploadFile) => {
    const url = buildPaymentItemAttachmentUrl(attachment);
    if (!url) {
      window.alert(getPaymentItemAttachmentErrorMessage(null, 'Lien de consultation indisponible.'));
      return;
    }

    if (isPaymentItemAttachmentPreviewable(attachment)) {
      setViewerAttachment(attachment);
      setViewerScale(1);
      setViewerRotation(0);
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const downloadAttachment = (attachment: StrapiUploadFile) => {
    const url = buildPaymentItemAttachmentUrl(attachment);
    if (!url) {
      window.alert(getPaymentItemAttachmentErrorMessage(null, 'Lien de téléchargement indisponible.'));
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Box sx={sectionSx}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 1.5 }}>
        <Box>
          <Typography sx={sectionTitleSx}>Pièces jointes</Typography>
          <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
            {mode === 'edit'
              ? 'Consultez, ajoutez ou retirez les pièces jointes du paiement.'
              : 'Ajoutez des fichiers à joindre à ce nouveau paiement.'}
          </Typography>
        </Box>
        <>
          <input ref={inputRef} type="file" multiple hidden onChange={handleSelectFiles} />
          <Button
            type="button"
            variant="outlined"
            startIcon={<CloudUploadRoundedIcon />}
            disabled={loading}
            onClick={() => inputRef.current?.click()}
            sx={{ alignSelf: { xs: 'stretch', sm: 'center' } }}
          >
            Ajouter des fichiers
          </Button>
        </>
      </Stack>

      {!keptAttachments.length && !newFiles.length ? (
        <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>
          Aucune pièce jointe sélectionnée.
        </Typography>
      ) : (
        <Stack spacing={1.25}>
          {mode === 'edit' && keptAttachments.length ? (
            <Box>
              <Typography sx={{ fontSize: '0.76rem', fontWeight: 700, color: brandColors.slate[500], textTransform: 'uppercase', mb: 1 }}>
                Déjà enregistrées
              </Typography>
              <Stack spacing={1}>
                {keptAttachments.map((attachment) => {
                  const isPreviewable = isPaymentItemAttachmentPreviewable(attachment);
                  return (
                    <Stack
                      key={attachment.id}
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={1}
                      alignItems={{ xs: 'stretch', sm: 'center' }}
                      justifyContent="space-between"
                      sx={{
                        p: 1.25,
                        borderRadius: 2,
                        border: `1px solid ${alpha(brandColors.slate[200], 0.9)}`,
                        backgroundColor: '#fff',
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                        <AttachFileRoundedIcon sx={{ fontSize: 18, color: brandColors.blue[600] }} />
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: 'text.primary', wordBreak: 'break-word' }}>
                            {attachment.name}
                          </Typography>
                          <Typography sx={{ fontSize: '0.76rem', color: 'text.secondary' }}>
                            {attachment.mime || 'Fichier'}
                          </Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap">
                        <Button type="button" size="small" startIcon={<OpenInNewRoundedIcon />} onClick={() => openAttachment(attachment)}>
                          {isPreviewable ? 'Consulter' : 'Télécharger'}
                        </Button>
                        {!isPreviewable ? (
                          <Button type="button" size="small" startIcon={<DownloadRoundedIcon />} onClick={() => downloadAttachment(attachment)}>
                            Télécharger
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          size="small"
                          color="error"
                          startIcon={<DeleteOutlineRoundedIcon />}
                          disabled={loading}
                          onClick={() => updateKeptAttachments((current) => current.filter((currentAttachment) => currentAttachment.id !== attachment.id))}
                        >
                          Retirer
                        </Button>
                      </Stack>
                    </Stack>
                  );
                })}
              </Stack>
            </Box>
          ) : null}

          {newFiles.length ? (
            <Box>
              <Typography sx={{ fontSize: '0.76rem', fontWeight: 700, color: brandColors.slate[500], textTransform: 'uppercase', mb: 1 }}>
                À ajouter
              </Typography>
              <Stack spacing={1}>
                {newFiles.map((file) => {
                  const fileKey = getLocalAttachmentKey(file);
                  return (
                    <Stack
                      key={fileKey}
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={1}
                      alignItems={{ xs: 'stretch', sm: 'center' }}
                      justifyContent="space-between"
                      sx={{
                        p: 1.25,
                        borderRadius: 2,
                        border: `1px dashed ${alpha(brandColors.blue[400], 0.55)}`,
                        backgroundColor: alpha(brandColors.blue[50], 0.65),
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                        <AttachFileRoundedIcon sx={{ fontSize: 18, color: brandColors.blue[600] }} />
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: 'text.primary', wordBreak: 'break-word' }}>
                            {file.name}
                          </Typography>
                          <Typography sx={{ fontSize: '0.76rem', color: 'text.secondary' }}>
                            {formatAttachmentSize(file.size)}
                          </Typography>
                        </Box>
                      </Stack>
                      <Button
                        type="button"
                        size="small"
                        color="error"
                        startIcon={<DeleteOutlineRoundedIcon />}
                        disabled={loading}
                        onClick={() => updateNewFiles((current) => current.filter((currentFile) => getLocalAttachmentKey(currentFile) !== fileKey))}
                        sx={{ alignSelf: { xs: 'flex-end', sm: 'center' } }}
                      >
                        Retirer
                      </Button>
                    </Stack>
                  );
                })}
              </Stack>
            </Box>
          ) : null}
        </Stack>
      )}

      {(keptAttachments.length !== existingAttachments.length || newFiles.length) ? (
        <Typography sx={{ mt: 1.25, fontSize: '0.76rem', color: 'text.secondary' }}>
          Les modifications seront appliquées lors de l’enregistrement.
        </Typography>
      ) : null}

      {submitError ? (
        <Box
          sx={{
            mt: 1.5,
            p: 1.25,
            borderRadius: 2,
            border: `1px solid ${alpha('#DC2626', 0.2)}`,
            backgroundColor: alpha('#FEF2F2', 0.85),
          }}
        >
          <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#B91C1C' }}>
            {submitError}
          </Typography>
        </Box>
      ) : null}

      <Dialog open={Boolean(viewerAttachment)} onClose={() => setViewerAttachment(null)} fullWidth maxWidth="lg">
        <DialogTitle sx={{ pb: 1.25 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography sx={{ fontFamily: headingFont, fontWeight: 700, fontSize: '1.05rem' }}>
                {viewerAttachment?.name || 'Prévisualisation'}
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                Visualisation interne · image
              </Typography>
            </Box>
            <Stack direction="row" spacing={0.5}>
              <IconButton onClick={() => setViewerScale((current) => Math.max(0.5, current - 0.25))}>
                <ZoomOutRoundedIcon fontSize="small" />
              </IconButton>
              <IconButton onClick={() => setViewerScale((current) => Math.min(4, current + 0.25))}>
                <ZoomInRoundedIcon fontSize="small" />
              </IconButton>
              <IconButton onClick={() => setViewerRotation((current) => (current + 90) % 360)}>
                <RotateRightRoundedIcon fontSize="small" />
              </IconButton>
              <IconButton onClick={() => setViewerAttachment(null)}>
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important', pb: '20px !important' }}>
          {viewerAttachment ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button type="button" size="small" startIcon={<DownloadRoundedIcon />} onClick={() => downloadAttachment(viewerAttachment)}>
                  Télécharger
                </Button>
              </Stack>
              <Box sx={{ overflow: 'auto', borderRadius: 2, border: `1px solid ${alpha(brandColors.slate[200], 0.85)}`, backgroundColor: '#fff', p: 2 }}>
                <Box
                  component="img"
                  src={buildPaymentItemAttachmentUrl(viewerAttachment) ?? ''}
                  alt={viewerAttachment.name}
                  sx={{
                    display: 'block',
                    transform: `scale(${viewerScale}) rotate(${viewerRotation}deg)`,
                    transformOrigin: 'center center',
                    maxWidth: '100%',
                    mx: 'auto',
                    transition: 'transform 0.2s ease',
                  }}
                />
              </Box>
            </Box>
          ) : null}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

