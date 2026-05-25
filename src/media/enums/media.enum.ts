export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  DOCUMENT = 'document',
}

export enum MediaCollection {
  AVATAR = 'avatar',
  GALLERY = 'gallery',
  THUMBNAIL = 'thumbnail',
  COVER = 'cover',
  ATTACHMENT = 'attachment',
}

/**
 * Type-safe entity types for polymorphic relation.
 * Prevents typos — use this instead of raw strings.
 */
export enum MediaOwner {
  USER = 'User',
  PRODUCT = 'Product',
  POST = 'Post',
  CATEGORY = 'Category',
}
