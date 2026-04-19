import { Body, Controller, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AdminGuard } from '../auth/admin.guard';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { ClerkRequestUser } from '../auth/clerk-user.types';
import { ApiAdminStandardErrorResponses } from '../common/swagger/api-standard-error-responses';
import { siteSettingsPublicOpenApiSchema } from '../common/swagger/openapi-schemas';
import type { SiteSettingsPublic } from './schemas/site-settings.zod';
import { PatchSiteSettingsBodyDto } from './schemas/site-settings.zod';
import { SiteSettingsService } from './site-settings.service';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard, AdminGuard)
@Controller('admin/site-settings')
export class AdminSiteSettingsController {
  constructor(private readonly siteSettings: SiteSettingsService) {}

  @Patch()
  @ApiOperation({ summary: 'Update site settings (admin only)' })
  @ApiAdminStandardErrorResponses()
  @ApiOkResponse({
    description: 'Updated site settings',
    schema: siteSettingsPublicOpenApiSchema,
  })
  patch(
    @CurrentUser() user: ClerkRequestUser,
    @Body() body: PatchSiteSettingsBodyDto,
  ): Promise<SiteSettingsPublic> {
    return this.siteSettings.patch(body, user.clerkUserId);
  }
}
