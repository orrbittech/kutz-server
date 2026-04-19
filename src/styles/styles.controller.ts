import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiValidationOnlyResponse } from '../common/swagger/api-standard-error-responses';
import { styleResponseOpenApiSchema } from '../common/swagger/openapi-schemas';
import { StylesService } from './styles.service';
import type { StyleResponse } from './schemas/style.zod';

@ApiTags('styles')
@Controller('styles')
export class StylesController {
  constructor(private readonly stylesService: StylesService) {}

  @Get()
  @ApiOperation({ summary: 'List active styles (public read)' })
  @ApiValidationOnlyResponse()
  @ApiOkResponse({
    description: 'Active style catalog',
    schema: {
      type: 'array',
      items: styleResponseOpenApiSchema,
    },
  })
  list(): Promise<StyleResponse[]> {
    return this.stylesService.listActive();
  }
}
