// Pièces jointes d'un paiement — équivalent mobile de
// `apps/web/src/modules/payment-items/components/PaymentItemAttachmentSection.tsx`.
//
// Même contrat que le web : la section ne fait qu'accumuler un brouillon
// (fichiers conservés / retirés / à ajouter) ; l'envoi vers Strapi et la liaison
// au paiement ont lieu à l'enregistrement du formulaire.
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { PaymentItemAttachmentFile } from '@/modules/payment-items/services/paymentItem.service';
import {
  buildPaymentItemAttachmentUrl,
  formatAttachmentSize,
  isPaymentItemAttachmentPreviewable,
} from '@/modules/payment-items/utils/paymentItemAttachments';
import { StrapiUploadFile } from '@/types';
import { brand, radius, spacing } from '@/theme/brand';
import { notify } from '@/utils/confirm';
import {
  buildCapturedImageName,
  compressImageForUpload,
  IMAGE_MAX_DIMENSION,
  IMAGE_TARGET_BYTES,
  isCompressibleImage,
} from '@/utils/imageCompression';

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
  // Compression : une photo de 4 Mo demande un instant, les boutons se figent
  // le temps du traitement pour éviter deux captures concurrentes.
  const [isProcessing, setIsProcessing] = useState(false);
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

  // L'appareil photo et la galerie n'existent que sur l'appareil : en build web,
  // le sélecteur de fichiers du navigateur couvre déjà les deux usages.
  const supportsDeviceCapture = Platform.OS !== 'web';

  /** Compresse ce qui est une image, laisse passer le reste (PDF, etc.). */
  const toAttachmentFile = async (file: PaymentItemAttachmentFile): Promise<PaymentItemAttachmentFile> => {
    // Build web : c'est l'objet `File` qui part dans le FormData, la
    // manipulation locale ne servirait à rien.
    if (file.file || !isCompressibleImage(file.mime, file.name)) {
      return file;
    }

    const compressed = await compressImageForUpload({
      uri: file.uri,
      name: file.name,
      mime: file.mime,
      size: file.size,
    });

    return { uri: compressed.uri, name: compressed.name, mime: compressed.mime, size: compressed.size };
  };

  const addImageAssets = async (assets: ImagePicker.ImagePickerAsset[], namePrefix: string) => {
    setIsProcessing(true);

    try {
      const files = await Promise.all(
        assets.map(async (asset, index) => {
          const compressed = await compressImageForUpload({
            uri: asset.uri,
            // `fileName` n'est renseigné que sur iOS : ailleurs on horodate.
            name: asset.fileName ?? buildCapturedImageName(index ? `${namePrefix}-${index + 1}` : namePrefix),
            mime: 'image/jpeg',
            width: asset.width,
            height: asset.height,
            size: asset.fileSize,
          });

          return {
            uri: compressed.uri,
            name: compressed.name,
            mime: compressed.mime,
            size: compressed.size,
          } as PaymentItemAttachmentFile;
        }),
      );

      addFiles(files);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCapturePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        notify(
          'Appareil photo',
          "L'accès à l'appareil photo a été refusé. Autorisez-le dans les réglages du téléphone pour photographier un justificatif.",
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        exif: false,
        // La compression fine est faite ensuite : ici on garde de la marge
        // pour que le redimensionnement n'ait pas à travailler sur du flou.
        quality: 0.9,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      await addImageAssets(result.assets, 'photo');
    } catch (error) {
      notify('Appareil photo', "L'appareil photo n'a pas pu être ouvert.");
    }
  };

  const handlePickImages = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        notify(
          'Galerie',
          "L'accès aux photos a été refusé. Autorisez-le dans les réglages du téléphone pour joindre une image.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        exif: false,
        quality: 1,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      await addImageAssets(result.assets, 'image');
    } catch (error) {
      notify('Galerie', "La galerie n'a pas pu être ouverte.");
    }
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

      setIsProcessing(true);

      try {
        // Une image piochée dans les fichiers pèse souvent plusieurs Mo :
        // elle passe par la même compression que les captures.
        addFiles([
          await toAttachmentFile({
            uri: result.uri,
            name: result.name,
            mime: result.mimeType,
            size: result.size,
            file: result.file,
          }),
        ]);
      } finally {
        setIsProcessing(false);
      }
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
  const isBusy = Boolean(loading) || isProcessing;

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
          {supportsDeviceCapture ? (
            <Text style={styles.sectionHint}>
              Les photos sont réduites automatiquement (max {IMAGE_MAX_DIMENSION} px, ~{Math.round(IMAGE_TARGET_BYTES / 1024)} Ko)
              tout en restant lisibles.
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.actionsRow}>
        {supportsDeviceCapture ? (
          <>
            <Pressable
              style={[styles.addButton, styles.addButtonFlex, isBusy && styles.addButtonDisabled]}
              onPress={handleCapturePhoto}
              disabled={isBusy}
              accessibilityRole="button"
              accessibilityLabel="Photographier un justificatif"
            >
              <Ionicons name="camera-outline" size={17} color={brand.blue600} />
              <Text style={styles.addButtonText}>Photo</Text>
            </Pressable>
            <Pressable
              style={[styles.addButton, styles.addButtonFlex, isBusy && styles.addButtonDisabled]}
              onPress={handlePickImages}
              disabled={isBusy}
              accessibilityRole="button"
              accessibilityLabel="Choisir une image dans la galerie"
            >
              <Ionicons name="images-outline" size={17} color={brand.blue600} />
              <Text style={styles.addButtonText}>Galerie</Text>
            </Pressable>
          </>
        ) : null}
        <Pressable
          style={[styles.addButton, styles.addButtonFlex, isBusy && styles.addButtonDisabled]}
          onPress={handlePickFiles}
          disabled={isBusy}
          accessibilityRole="button"
          accessibilityLabel="Ajouter des fichiers"
        >
          <Ionicons name="document-attach-outline" size={17} color={brand.blue600} />
          <Text style={styles.addButtonText}>{supportsDeviceCapture ? 'Fichier' : 'Ajouter des fichiers'}</Text>
        </Pressable>
      </View>

      {isProcessing ? (
        <View style={styles.processingRow}>
          <ActivityIndicator size="small" color={brand.blue600} />
          <Text style={styles.processingText}>Compression de l'image…</Text>
        </View>
      ) : null}

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
  sectionHint: {
    marginTop: 4,
    fontSize: 11.5,
    color: brand.slate400,
    lineHeight: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
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
    paddingHorizontal: 12,
  },
  addButtonFlex: {
    flexGrow: 1,
    flexBasis: 96,
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  processingText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: brand.slate600,
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
