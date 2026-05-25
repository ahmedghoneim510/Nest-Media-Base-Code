import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FilterUserDto } from './dto/filter-user.dto';
import { MediaService, MediaCollection, MediaOwner } from '../media';
import { applyFilters, paginatedResponse } from '../common';
import { UserScopes } from './scopes';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly mediaService: MediaService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOneBy({
      email: createUserDto.email,
    });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  /**
   * List users with filters, search, pagination, and sorting.
   * Uses generic applyFilters (common) + UserScopes (local).
   */
  async findAll(filters: FilterUserDto) {
    const { search, status, page = 1, limit = 10, sortBy = 'created_at', order = 'DESC' } = filters;

    const qb = this.userRepository.createQueryBuilder('user');

    // Generic filters (common utility — works for any entity)
    applyFilters(qb, 'user', {
      search: search
        ? { term: search, fields: ['firstName', 'lastName', 'email'] }
        : undefined,
      filters: { status },
      sort: {
        field: sortBy,
        order,
        allowed: ['created_at', 'firstName', 'lastName', 'email', 'age'],
      },
      pagination: { page, limit },
    });

    // Local scopes (User-specific) — chain as needed:
    // UserScopes.active(qb);
    // UserScopes.recentlyActive(qb, 7);

    const [users, count] = await qb.getManyAndCount();

    // Batch load avatars
    const ids = users.map((u) => u.id);
    const avatarMap = await this.mediaService.getLatestForMany(
      MediaOwner.USER,
      ids,
      MediaCollection.AVATAR,
    );
    for (const user of users) {
      user.avatar = avatarMap.get(user.id) ?? null;
    }

    return paginatedResponse(users, count, page, limit);
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  /**
   * Find user with only avatar loaded (2 queries).
   */
  async findOneWithAvatar(id: number): Promise<User> {
    const user = await this.findOne(id);
    user.avatar = await this.mediaService.getOne(
      MediaOwner.USER,
      id,
      MediaCollection.AVATAR,
    );
    return user;
  }

  /**
   * Find user with ALL media loaded (2 queries).
   * Pre-computes avatar from the loaded media.
   */
  async findOneWithMedia(id: number): Promise<User> {
    const user = await this.findOne(id);
    const allMedia = await this.mediaService.getMedia(MediaOwner.USER, id);

    // Pre-compute: set avatar and media once (no repeated filtering)
    user.avatar = allMedia.find((m) => m.collection === MediaCollection.AVATAR) ?? null;
    user.media = allMedia;

    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  async uploadAvatar(id: number, file: Express.Multer.File) {
    const user = await this.findOne(id);

    // Delete old avatar(s)
    await this.mediaService.deleteCollection(
      MediaOwner.USER,
      user.id,
      MediaCollection.AVATAR,
    );

    // Upload new avatar — stored only in media table
    return this.mediaService.upload(
      file,
      MediaOwner.USER,
      user.id,
      MediaCollection.AVATAR,
      'avatars',
    );
  }
}
