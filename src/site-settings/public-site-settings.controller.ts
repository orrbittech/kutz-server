import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiValidationOnlyResponse } from '../common/swagger/api-standard-error-responses';
import { siteSettingsPublicOpenApiSchema } from '../common/swagger/openapi-schemas';
import type { SiteSettingsPublic } from './schemas/site-settings.zod';
import { SiteSettingsService } from './site-settings.service';

@ApiTags('public')
@Controller('public')
export class PublicSiteSettingsController {
  constructor(private readonly siteSettings: SiteSettingsService) {}

  @Get('site-settings')
  @ApiOperation({ summary: 'Public salon branding, theme, and NAP (no auth)' })
  @ApiValidationOnlyResponse()
  @ApiOkResponse({
    description: 'Site settings for web theming and SEO',
    schema: siteSettingsPublicOpenApiSchema,
  })
  get(): Promise<SiteSettingsPublic> {
    return this.siteSettings.getPublic();
  }
}
