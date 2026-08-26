// Compression des images jointes à un paiement.
//
// Une photo de chèque prise avec un appareil récent pèse 3 à 6 Mo : trop pour
// l'upload comme pour la médiathèque Strapi, alors que la lisibilité du montant
// et du numéro ne demande pas plus de ~1600 px de côté. On réduit donc la taille
// puis on baisse la qualité JPEG par paliers, en s'arrêtant dès que le poids
// cible est atteint — la photo reste nette, le fichier devient raisonnable.
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { Image } from 'react-native';

/** Côté le plus long conservé : au-delà, un justificatif n'est pas plus lisible. */
export const IMAGE_MAX_DIMENSION = 1600;

/** Poids visé : un justificatif lisible tient largement dans 500 Ko. */
export const IMAGE_TARGET_BYTES = 500 * 1024;

/** Qualités JPEG essayées dans l'ordre, de la plus fidèle à la plus légère. */
const QUALITY_STEPS = [0.7, 0.5, 0.35] as const;

const IMAGE_MIME_PATTERN = /^image\//i;

export interface CompressibleImage {
  uri: string;
  name?: string | null;
  mime?: string | null;
  width?: number | null;
  height?: number | null;
  size?: number | null;
}

export interface CompressedImage {
  uri: string;
  name: string;
  mime: string;
  size?: number;
}

export const isCompressibleImage = (mime?: string | null, name?: string | null) =>
  IMAGE_MIME_PATTERN.test(mime ?? '') || /\.(jpe?g|png|heic|heif|webp)$/i.test(name ?? '');

/** Poids réel du fichier local ; `undefined` si l'information est indisponible. */
export const getLocalFileSize = async (uri: string) => {
  try {
    const info = await FileSystem.getInfoAsync(uri, { size: true });
    return info.exists && typeof (info as { size?: number }).size === 'number'
      ? (info as { size: number }).size
      : undefined;
  } catch {
    return undefined;
  }
};

/**
 * Dimensions d'une image locale. Le sélecteur de fichiers ne les fournit pas,
 * or sans elles on ne saurait pas s'il faut réduire (ni dans quel sens).
 */
const measureImage = (uri: string) =>
  new Promise<{ width: number; height: number } | null>((resolve) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      () => resolve(null),
    );
  });

const pad = (value: number) => String(value).padStart(2, '0');

/** Nom horodaté, utilisé quand l'appareil n'en fournit pas (cas Android). */
export const buildCapturedImageName = (prefix = 'piece-jointe') => {
  const now = new Date();
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `${prefix}-${stamp}.jpg`;
};

const withJpegExtension = (name?: string | null) => {
  const trimmed = name?.trim();

  if (!trimmed) {
    return buildCapturedImageName();
  }

  return /\.jpe?g$/i.test(trimmed) ? trimmed : `${trimmed.replace(/\.[^.]+$/, '')}.jpg`;
};

/**
 * Réduit une image à `IMAGE_MAX_DIMENSION` puis compresse par paliers jusqu'à
 * `IMAGE_TARGET_BYTES`. La sortie est toujours du JPEG : pour une photo de
 * document c'est le format le plus léger à qualité perçue égale.
 *
 * En cas d'échec (format exotique, manipulation impossible), l'image d'origine
 * est renvoyée telle quelle : mieux vaut une pièce jointe lourde qu'aucune.
 */
export const compressImageForUpload = async (image: CompressibleImage): Promise<CompressedImage> => {
  const fallback: CompressedImage = {
    uri: image.uri,
    name: image.name?.trim() || buildCapturedImageName(),
    mime: image.mime || 'image/jpeg',
    size: image.size ?? undefined,
  };

  try {
    // Dimensions fournies par le sélecteur d'images ; sinon on mesure.
    const measured =
      image.width && image.height ? { width: Number(image.width), height: Number(image.height) } : await measureImage(image.uri);
    const width = Number(measured?.width ?? 0);
    const height = Number(measured?.height ?? 0);
    const longestSide = Math.max(width, height);
    // Une seule dimension est passée : l'autre est déduite du ratio d'origine.
    const actions: ImageManipulator.Action[] =
      longestSide > IMAGE_MAX_DIMENSION
        ? [{ resize: width >= height ? { width: IMAGE_MAX_DIMENSION } : { height: IMAGE_MAX_DIMENSION } }]
        : [];

    let best: CompressedImage | null = null;

    for (const compress of QUALITY_STEPS) {
      const result = await ImageManipulator.manipulateAsync(image.uri, actions, {
        compress,
        format: ImageManipulator.SaveFormat.JPEG,
      });

      const size = await getLocalFileSize(result.uri);
      best = {
        uri: result.uri,
        name: withJpegExtension(image.name),
        mime: 'image/jpeg',
        size,
      };

      // Taille inconnue : inutile d'insister, un palier de plus dégraderait
      // l'image sans qu'on puisse vérifier le gain.
      if (size == null || size <= IMAGE_TARGET_BYTES) {
        break;
      }
    }

    return best ?? fallback;
  } catch {
    return fallback;
  }
};
