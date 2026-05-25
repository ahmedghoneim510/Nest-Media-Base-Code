import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { MediaService, MediaCollection, MediaOwner } from '../media';

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
   * List all users with avatar loaded (2 queries total, no N+1).
   */
  async findAll(): Promise<{ data: User[]; count: number }> {
    const users = await this.userRepository.find();
    const ids = users.map((u) => u.id);

    // Single query: get latest avatar for all users
    const avatarMap = await this.mediaService.getLatestForMany(
      MediaOwner.USER,
      ids,
      MediaCollection.AVATAR,
    );

    for (const user of users) {
      user.avatar = avatarMap.get(user.id) ?? null;
    }

    return { data: users, count: users.length };
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
