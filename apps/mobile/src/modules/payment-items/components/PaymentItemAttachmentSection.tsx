// Pièces jointes d'un paiement — équivalent mobile de
// `apps/web/src/modules/payment-items/components/PaymentItemAttachmentSection.tsx`.
//
// Même contrat que le web : la section ne fait qu'accumuler un brouillon
// (fichiers conservés / retirés / à ajouter) ; l'envoi vers Strapi et la liaison
// au paiement ont lieu à l'enregistrement du formulaire.
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useMemo, useState } from 'react';
import { Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PaymentItemAttachmentFile } from '@/modules/payment-items/services/paymentItem.service';
import {
  buildPaymentItemAttachmentUrl,
  formatAttachmentSize,
  isPaymentItemAttachmentPreviewable,
} from '@/modules/payment-items/utils/paymentItemAttachments';
import { StrapiUploadFile } from '@/types';
import { brand, radius, spacing } from '@/theme/brand';
import { notify } from '@/utils/confirm';

export interface PaymentItemAttachmentDraft {
  keptAttachmentIds: number[];
  removedAttachmentIds: number[];
  newFiles: PaymentItemAttachmentFile[];
}

interface PaymentItemAttachmentSectionProps {
  mode: 'create' | 'edit';
  existingAttachments?: StrapiUploadFile[];
  loading?: boolean;
  submitError?: string | null;
  onChange?: (draft: PaymentItemAttachmentDraft) => void;
}

const getLocalAttachmentKey = (file: PaymentItemAttachmentFile) => `${file.name}::${file.size ?? 0}::${file.uri}`;

/** Fichier renvoyé par le sélecteur en build web (`File` du DOM, absent des types RN). */
interface PickedWebFile {
  name: string;
  type?: string;
  size?: number;
  lastModified?: number;
}

export function PaymentItemAttachmentSection({
  mode,
  existingAttachments = [],
  loading,
  submitError,
  onChange,
}: PaymentItemAttachmentSectionProps) {
  const [keptAttachments, setKeptAttachments] = useState(existingAttachments);
  const [newFiles, setNewFiles] = useState<PaymentItemAttachmentFile[]>([]);
  const [viewerAttachment, setViewerAttachment] = useState<StrapiUploadFile | null>(null);
  const [viewerScale, setViewerScale] = useState(1);
  const [viewerRotation, setViewerRotation] = useState(0);
  const initialAttachmentIds = useMemo(
    () => existingAttachments.map((attachment) => attachment.id),
    [existingAttachments],
  );

  const buildDraft = (
    attachments: StrapiUploadFile[],
    files: PaymentItemAttachmentFile[],
  ): PaymentItemAttachmentDraft => ({
    keptAttachmentIds: attachments.map((attachment) => attachment.id),
    removedAttachmentIds: initialAttachmentIds.filter((id) => !attachments.some((attachment) => attachment.id === id)),
    newFiles: files,
  });

  const updateKeptAttachments = (updater: (current: StrapiUploadFile[]) => StrapiUploadFile[]) => {
    setKeptAttachments((current) => {
      const next = updater(current);
      onChange?.(buildDraft(next, newFiles));
      return next;
    });
  };

  const updateNewFiles = (updater: (current: PaymentItemAttachmentFile[]) => PaymentItemAttachmentFile[]) => {
    setNewFiles((current) => {
      const next = updater(current);
      onChange?.(buildDraft(keptAttachments, next));
      return next;
    });
  };

  const addFiles = (files: PaymentItemAttachmentFile[]) => {
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
  };

  const handlePickFiles = async () => {
    try {
      // `multiple` n'est honoré qu'en build web ; sur mobile l'utilisateur
      // rappelle le sélecteur pour chaque fichier, comme un `input` répété.
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.type !== 'success') {
        return;
      }

      const webFiles: PickedWebFile[] = result.output ? (Array.from(result.output as any) as PickedWebFile[]) : [];

      if (webFiles.length > 1) {
        addFiles(
          webFiles.map((file) => ({
            // Build web : c'est `file` qui est envoyé ; l'uri ne sert qu'à dédoublonner.
            uri: `web-file://${file.name}:${file.lastModified}`,
            name: file.name,
            mime: file.type,
            size: file.size,
            file,
          })),
        );
        return;
      }

      addFiles([
        {
          uri: result.uri,
          name: result.name,
          mime: result.mimeType,
          size: result.size,
          file: result.file,
        },
      ]);
    } catch (error) {
      notify('Pièces jointes', "Le sélecteur de fichiers n'a pas pu être ouvert.");
    }
  };

  const openAttachment = async (attachment: StrapiUploadFile) => {
    const url = buildPaymentItemAttachmentUrl(attachment);

    if (!url) {
      notify('Pièces jointes', 'Lien de consultation indisponible.');
      return;
    }

    if (isPaymentItemAttachmentPreviewable(attachment)) {
      setViewerAttachment(attachment);
      setViewerScale(1);
      setViewerRotation(0);
      return;
    }

    await Linking.openURL(url).catch(() => notify('Pièces jointes', "Le fichier n'a pas pu être ouvert."));
  };

  const downloadAttachment = async (attachment: StrapiUploadFile) => {
    const url = buildPaymentItemAttachmentUrl(attachment);

    if (!url) {
      notify('Pièces jointes', 'Lien de téléchargement indisponible.');
      return;
    }

    await Linking.openURL(url).catch(() => notify('Pièces jointes', "Le fichier n'a pas pu être téléchargé."));
  };

  const hasPendingChanges = keptAttachments.length !== existingAttachments.length || newFiles.length > 0;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderText}>
          <Text style={styles.sectionTitle}>Pièces jointes</Text>
          <Text style={styles.sectionSubtitle}>
            {mode === 'edit'
              ? 'Consultez, ajoutez ou retirez les pièces jointes du paiement.'
              : 'Ajoutez des fichiers à joindre à ce nouveau paiement.'}
          </Text>
        </View>
      </View>

      <Pressable
        style={[styles.addButton, loading && styles.addButtonDisabled]}
        onPress={handlePickFiles}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Ajouter des fichiers"
      >
        <Ionicons name="cloud-upload-outline" size={17} color={brand.blue600} />
        <Text style={styles.addButtonText}>Ajouter des fichiers</Text>
      </Pressable>

      {!keptAttachments.length && !newFiles.length ? (
        <Text style={styles.emptyText}>Aucune pièce jointe sélectionnée.</Text>
      ) : null}

      {mode === 'edit' && keptAttachments.length ? (
        <View style={styles.group}>
          <Text style={styles.groupTitle}>Déjà enregistrées</Text>
          {keptAttachments.map((attachment) => {
            const previewable = isPaymentItemAttachmentPreviewable(attachment);

            return (
              <View key={attachment.id} style={styles.savedRow}>
                <View style={styles.rowHead}>
                  <Ionicons name="attach-outline" size={17} color={brand.blue600} />
                  <View style={styles.rowBody}>
                    <Text style={styles.rowName}>{attachment.name}</Text>
                    <Text style={styles.rowMeta}>
                      {[attachment.mime || 'Fichier', formatAttachmentSize(attachment.size)].filter(Boolean).join(' • ')}
                    </Text>
                  </View>
                </View>
                <View style={styles.rowActions}>
                  <Pressable style={styles.rowAction} onPress={() => openAttachment(attachment)}>
                    <Ionicons name={previewable ? 'eye-outline' : 'open-outline'} size={15} color={brand.blue600} />
                    <Text style={styles.rowActionText}>{previewable ? 'Consulter' : 'Ouvrir'}</Text>
                  </Pressable>
                  {!previewable ? (
                    <Pressable style={styles.rowAction} onPress={() => downloadAttachment(attachment)}>
                      <Ionicons name="download-outline" size={15} color={brand.blue600} />
                      <Text style={styles.rowActionText}>Télécharger</Text>
                    </Pressable>
                  ) : null}
                  <Pressable
                    style={styles.rowAction}
                    disabled={loading}
                    onPress={() =>
                      updateKeptAttachments((current) =>
                        current.filter((currentAttachment) => currentAttachment.id !== attachment.id),
                      )
                    }
                  >
                    <Ionicons name="trash-outline" size={15} color={brand.danger} />
                    <Text style={[styles.rowActionText, styles.rowActionDanger]}>Retirer</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      {newFiles.length ? (
        <View style={styles.group}>
          <Text style={styles.groupTitle}>À ajouter</Text>
          {newFiles.map((file) => {
            const fileKey = getLocalAttachmentKey(file);

            return (
              <View key={fileKey} style={styles.pendingRow}>
                <View style={styles.rowHead}>
                  <Ionicons name="attach-outline" size={17} color={brand.blue600} />
                  <View style={styles.rowBody}>
                    <Text style={styles.rowName}>{file.name}</Text>
                    <Text style={styles.rowMeta}>
                      {[file.mime, formatAttachmentSize(file.size)].filter(Boolean).join(' • ') || 'Fichier'}
                    </Text>
                  </View>
                </View>
                <View style={styles.rowActions}>
                  <Pressable
                    style={styles.rowAction}
                    disabled={loading}
                    onPress={() =>
                      updateNewFiles((current) =>
                        current.filter((currentFile) => getLocalAttachmentKey(currentFile) !== fileKey),
                      )
                    }
                  >
                    <Ionicons name="trash-outline" size={15} color={brand.danger} />
                    <Text style={[styles.rowActionText, styles.rowActionDanger]}>Retirer</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      {hasPendingChanges ? (
        <Text style={styles.pendingHint}>Les modifications seront appliquées lors de l'enregistrement.</Text>
      ) : null}

      {submitError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{submitError}</Text>
        </View>
      ) : null}

      <Modal
        visible={Boolean(viewerAttachment)}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setViewerAttachment(null)}
      >
        <View style={styles.viewer}>
          <View style={styles.viewerHeader}>
            <View style={styles.viewerHeaderText}>
              <Text style={styles.viewerTitle} numberOfLines={1}>
                {viewerAttachment?.name || 'Prévisualisation'}
              </Text>
              <Text style={styles.viewerSubtitle}>Visualisation interne · image</Text>
            </View>
            <View style={styles.viewerTools}>
              <Pressable
                style={styles.viewerToolButton}
                onPress={() => setViewerScale((current) => Math.max(0.5, current - 0.25))}
                accessibilityRole="button"
                accessibilityLabel="Réduire"
              >
                <Ionicons name="remove-outline" size={17} color={brand.slate600} />
              </Pressable>
              <Pressable
                style={styles.viewerToolButton}
                onPress={() => setViewerScale((current) => Math.min(4, current + 0.25))}
                accessibilityRole="button"
                accessibilityLabel="Agrandir"
              >
                <Ionicons name="add-outline" size={17} color={brand.slate600} />
              </Pressable>
              <Pressable
                style={styles.viewerToolButton}
                onPress={() => setViewerRotation((current) => (current + 90) % 360)}
                accessibilityRole="button"
                accessibilityLabel="Pivoter"
              >
                <Ionicons name="refresh-outline" size={17} color={brand.slate600} />
              </Pressable>
              <Pressable
                style={styles.viewerToolButton}
                onPress={() => setViewerAttachment(null)}
                accessibilityRole="button"
                accessibilityLabel="Fermer"
              >
                <Ionicons name="close" size={17} color={brand.slate600} />
              </Pressable>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.viewerBody}>
            {viewerAttachment ? (
              <>
                <Pressable style={styles.viewerDownload} onPress={() => downloadAttachment(viewerAttachment)}>
                  <Ionicons name="download-outline" size={15} color={brand.blue600} />
                  <Text style={styles.rowActionText}>Télécharger</Text>
                </Pressable>
                <View style={styles.viewerImageWrap}>
                  <Image
                    source={{ uri: buildPaymentItemAttachmentUrl(viewerAttachment) ?? '' }}
                    style={[
                      styles.viewerImage,
                      { transform: [{ scale: viewerScale }, { rotate: `${viewerRotation}deg` }] },
                    ]}
                    resizeMode="contain"
                    accessibilityLabel={viewerAttachment.name}
                  />
                </View>
              </>
            ) : null}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    borderWidth: 1,
    borderColor: brand.slate200,
    borderRadius: radius.lg,
    backgroundColor: brand.slate50,
    padding: spacing.lg - 2,
    marginBottom: spacing.lg - 2,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionHeaderText: {
    minWidth: 0,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: brand.slate700,
  },
  sectionSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: brand.slate500,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: brand.blue300,
    borderRadius: radius.md,
    backgroundColor: brand.white,
    paddingVertical: 12,
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: brand.blue600,
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: 12.5,
    color: brand.slate500,
  },
  group: {
    marginTop: spacing.md,
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: brand.slate500,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  savedRow: {
    borderWidth: 1,
    borderColor: brand.slate200,
    backgroundColor: brand.white,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: spacing.sm,
  },
  pendingRow: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: brand.blue300,
    backgroundColor: brand.blue50,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: spacing.sm,
  },
  rowHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  rowName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: brand.navy900,
  },
  rowMeta: {
    marginTop: 1,
    fontSize: 11.5,
    color: brand.slate500,
  },
  rowActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  rowAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.sm,
    backgroundColor: brand.slate100,
  },
  rowActionText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: brand.blue600,
  },
  rowActionDanger: {
    color: brand.danger,
  },
  pendingHint: {
    marginTop: spacing.md,
    fontSize: 11.5,
    color: brand.slate500,
  },
  errorBox: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: brand.danger,
    backgroundColor: brand.dangerBg,
    borderRadius: radius.md,
    padding: 12,
  },
  errorText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: brand.danger,
  },
  viewer: {
    flex: 1,
    backgroundColor: brand.canvas,
  },
  viewerHeader: {
    backgroundColor: brand.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: brand.slate200,
    gap: spacing.sm,
  },
  viewerHeaderText: {
    minWidth: 0,
  },
  viewerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: brand.navy900,
  },
  viewerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: brand.slate500,
  },
  viewerTools: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  viewerToolButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brand.slate100,
  },
  viewerBody: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  viewerDownload: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.sm,
    backgroundColor: brand.slate100,
  },
  viewerImageWrap: {
    borderWidth: 1,
    borderColor: brand.slate200,
    backgroundColor: brand.white,
    borderRadius: radius.md,
    padding: spacing.lg,
    overflow: 'hidden',
  },
  viewerImage: {
    width: '100%',
    height: 380,
  },
});
