import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GallerySlideEntity } from '../database/entities/gallery-slide.entity';
import { GallerySlidesController } from './gallery-slides.controller';
import { GallerySlidesService } from './gallery-slides.service';

@Module({
  imports: [TypeOrmModule.forFeature([GallerySlideEntity])],
  controllers: [GallerySlidesController],
  providers: [GallerySlidesService],
})
export class GallerySlidesModule {}
