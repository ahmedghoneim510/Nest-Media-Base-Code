import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Media } from './entities/media.entity';
import { MediaService } from './media.service';
import { CloudinaryModule } from '../cloudinary';

@Module({
  imports: [TypeOrmModule.forFeature([Media]), CloudinaryModule],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
