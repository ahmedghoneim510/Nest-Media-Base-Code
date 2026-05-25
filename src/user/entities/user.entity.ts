import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
import { UserRole, UserStatus } from '../enums';
import { Media } from '../../media/entities/media.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  age: number;

  @Column({ unique: true })
  email: string;

  @Exclude()
  @Column()
  password: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Exclude()
  @Column({ nullable: true })
  last_login: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Exclude()
  @DeleteDateColumn()
  deleted_at: Date;

  // --- Media (pre-computed by service, not filtered on every access) ---

  /** Latest avatar media object — set by service */
  avatar?: Media | null;

  /** All media for this user — set by service when needed */
  media?: Media[];

  // --- Computed fields ---

  @Expose()
  get avatarUrl(): string | null {
    return this.avatar?.url ?? null;
  }

  @Expose()
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  @Expose()
  get isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  @Exclude()
  get isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  // --- Mutators (hooks) ---

  @BeforeInsert()
  setDefaults() {
    if (!this.status) {
      this.status = UserStatus.ACTIVE;
    }
    if (!this.role) {
      this.role = UserRole.USER;
    }
    this.email = this.email?.toLowerCase().trim();
  }

  @BeforeUpdate()
  normalizeEmail() {
    if (this.email) {
      this.email = this.email.toLowerCase().trim();
    }
  }
}
