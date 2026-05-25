import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Media } from './entities/media.entity';
import { MediaType, MediaCollection, MediaOwner } from './enums';
import { CloudinaryService } from '../cloudinary';

/* cSpell:words mediable */

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Upload a file and attach it to any entity (polymorphic).
   */
  async upload(
    file: Express.Multer.File,
    owner: MediaOwner,
    ownerId: number,
    collection: MediaCollection = MediaCollection.ATTACHMENT,
    folder: string = 'uploads',
  ): Promise<Media> {
    const result = await this.cloudinaryService.upload(file, folder);

    const media = this.mediaRepository.create({
      url: result.secure_url,
      publicId: result.public_id,
      type: this.resolveMediaType(file.mimetype),
      mimeType: file.mimetype,
      originalName: file.originalname,
      size: file.size,
      mediableType: owner,
      mediableId: ownerId,
      collection,
    });

    return this.mediaRepository.save(media);
  }

  /**
   * Get all media for a specific entity.
   * Optionally filter by collection.
   */
  async getMedia(
    owner: MediaOwner,
    ownerId: number,
    collection?: MediaCollection,
  ): Promise<Media[]> {
    const where: any = { mediableType: owner, mediableId: ownerId };
    if (collection) {
      where.collection = collection;
    }
    return this.mediaRepository.find({
      where,
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Get the latest single media in a collection (e.g. avatar).
   */
  async getOne(
    owner: MediaOwner,
    ownerId: number,
    collection: MediaCollection,
  ): Promise<Media | null> {
    return this.mediaRepository.findOne({
      where: { mediableType: owner, mediableId: ownerId, collection },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Batch load latest media for multiple entities in one query.
   * Returns a Map<entityId, Media> — avoids N+1.
   */
  async getLatestForMany(
    owner: MediaOwner,
    ownerIds: number[],
    collection: MediaCollection,
  ): Promise<Map<number, Media>> {
    if (ownerIds.length === 0) return new Map();

    const media = await this.mediaRepository
      .createQueryBuilder('media')
      .where('media.mediableType = :owner', { owner })
      .andWhere('media.mediableId IN (:...ids)', { ids: ownerIds })
      .andWhere('media.collection = :collection', { collection })
      .orderBy('media.created_at', 'DESC')
      .getMany();

    // Keep only the latest per entity
    const map = new Map<number, Media>();
    for (const m of media) {
      if (!map.has(m.mediableId)) {
        map.set(m.mediableId, m);
      }
    }
    return map;
  }

  /**
   * Batch load ALL media for multiple entities in one query.
   * Returns Map<entityId, Media[]>
   */
  async getAllForMany(
    owner: MediaOwner,
    ownerIds: number[],
  ): Promise<Map<number, Media[]>> {
    if (ownerIds.length === 0) return new Map();

    const media = await this.mediaRepository
      .createQueryBuilder('media')
      .where('media.mediableType = :owner', { owner })
      .andWhere('media.mediableId IN (:...ids)', { ids: ownerIds })
      .orderBy('media.created_at', 'DESC')
      .getMany();

    const map = new Map<number, Media[]>();
    for (const m of media) {
      const list = map.get(m.mediableId) ?? [];
      list.push(m);
      map.set(m.mediableId, list);
    }
    return map;
  }

  /**
   * Delete a media by ID (removes from Cloudinary too).
   */
  async delete(id: number): Promise<void> {
    const media = await this.mediaRepository.findOneBy({ id });
    if (!media) {
      throw new NotFoundException(`Media with id ${id} not found`);
    }
    if (media.publicId) {
      await this.cloudinaryService.delete(media.publicId);
    }
    await this.mediaRepository.remove(media);
  }

  /**
   * Delete all media for an entity in a collection (e.g. replace avatar).
   */
  async deleteCollection(
    owner: MediaOwner,
    ownerId: number,
    collection: MediaCollection,
  ): Promise<void> {
    const mediaItems = await this.mediaRepository.find({
      where: { mediableType: owner, mediableId: ownerId, collection },
    });
    for (const media of mediaItems) {
      if (media.publicId) {
        await this.cloudinaryService.delete(media.publicId);
      }
    }
    if (mediaItems.length > 0) {
      await this.mediaRepository.remove(mediaItems);
    }
  }

  private resolveMediaType(mimeType: string): MediaType {
    if (mimeType.startsWith('image/')) return MediaType.IMAGE;
    if (mimeType.startsWith('video/')) return MediaType.VIDEO;
    return MediaType.DOCUMENT;
  }
}
