import {
  IsString,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  Min,
  MinLength,
} from 'class-validator';
import { UserRole, UserStatus } from '../enums/user.enum';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  age: number;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  phone: string;

  @IsString()
  @IsOptional()
  address: string;

  @IsEnum(UserRole)
  @IsOptional()
  role: UserRole;

  @IsEnum(UserStatus)
  @IsOptional()
  status: UserStatus;
}
