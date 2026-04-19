import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiValidationOnlyResponse } from '../common/swagger/api-standard-error-responses';
import { gallerySlideResponseOpenApiSchema } from '../common/swagger/openapi-schemas';
import { GallerySlidesService } from './gallery-slides.service';
import type { GallerySlideResponse } from './schemas/gallery-slide.zod';

@ApiTags('gallery-slides')
@Controller('gallery-slides')
export class GallerySlidesController {
  constructor(private readonly gallerySlidesService: GallerySlidesService) {}

  @Get()
  @ApiOperation({ summary: 'List active marketing gallery slides (public read)' })
  @ApiValidationOnlyResponse()
  @ApiOkResponse({
    description: 'Active Texture & tone gallery images',
    schema: {
      type: 'array',
      items: gallerySlideResponseOpenApiSchema,
    },
  })
  list(): Promise<GallerySlideResponse[]> {
    return this.gallerySlidesService.listActive();
  }
}
