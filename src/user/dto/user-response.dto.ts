import { Expose, Type } from 'class-transformer';

class MediaResponseDto {
  @Expose()
  id: number;

  @Expose()
  url: string;

  @Expose()
  type: string;

  @Expose()
  collection: string;
}

/**
 * Returns basic user profile info with avatar.
 * Usage: plainToInstance(UserResponseDto, user, { excludeExtraneousValues: true })
 */
export class UserResponseDto {
  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  age: number;

  @Expose()
  email: string;

  @Expose()
  phone: string;

  @Expose()
  address: string;

  @Expose()
  @Type(() => MediaResponseDto)
  avatar: MediaResponseDto | null;
}
