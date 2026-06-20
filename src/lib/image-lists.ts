export type ImageLikeRecord = Record<string, unknown>;

const imageSeparators = /\s*(?:\n|\||,)\s*/;

function parseImageValue(value: unknown): string[] {
  if (!value) return [];

  if (Array.isArray(value)) {
    return value.flatMap((item) => parseImageValue(item));
  }

  if (typeof value === "object") {
    const record = value as ImageLikeRecord;
    return parseImageValue(record.url || record.src || record.image_url || record.photo);
  }

  if (typeof value !== "string") return [];

  const trimmed = value.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      return parseImageValue(JSON.parse(trimmed));
    } catch {
      // Continue with delimiter parsing below.
    }
  }

  return trimmed
    .split(imageSeparators)
    .map((item) => item.trim())
    .filter((item) => /^(https?:\/\/|\/|data:|blob:)/i.test(item));
}

export function uniqueImages(values: unknown[]) {
  return Array.from(new Set(values.flatMap((value) => parseImageValue(value))));
}

export function getDoctorImageList(record: ImageLikeRecord, fallback: string) {
  const images = uniqueImages([
    record.photos,
    record.photo_urls,
    record.image_urls,
    record.images,
    record.gallery_images,
    record.photo,
  ]);

  return images.length > 0 ? images : [fallback];
}

export function getServiceImageList(record: ImageLikeRecord) {
  return uniqueImages([
    record.image_urls,
    record.images,
    record.gallery_images,
    record.photos,
    record.photo_urls,
    record.image_url,
  ]);
}
