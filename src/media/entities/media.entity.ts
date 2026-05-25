import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { MediaType, MediaCollection, MediaOwner } from '../enums';

/* cSpell:words mediable */

@Entity('media')
@Index(['mediableType', 'mediableId', 'collection']) // composite index for fast lookups
export class Media {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  url: string;

  @Exclude()
  @Column({ nullable: true })
  publicId: string;

  @Column({ type: 'enum', enum: MediaType, default: MediaType.IMAGE })
  type: MediaType;

  @Column({ nullable: true })
  mimeType: string;

  @Column({ nullable: true })
  originalName: string;

  @Column({ nullable: true })
  size: number;

  @Column({ type: 'enum', enum: MediaOwner })
  mediableType: MediaOwner;

  @Index()
  @Column()
  mediableId: number;

  @Column({ type: 'enum', enum: MediaCollection, default: MediaCollection.ATTACHMENT })
  collection: MediaCollection;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
