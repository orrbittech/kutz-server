import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiValidationOnlyResponse } from '../common/swagger/api-standard-error-responses';
import { teamMemberResponseOpenApiSchema } from '../common/swagger/openapi-schemas';
import { TeamMembersService } from './team-members.service';
import type { TeamMemberResponse } from './schemas/team-member.zod';

@ApiTags('team-members')
@Controller('team-members')
export class TeamMembersController {
  constructor(private readonly teamMembersService: TeamMembersService) {}

  @Get()
  @ApiOperation({ summary: 'List active team members (public read)' })
  @ApiValidationOnlyResponse()
  @ApiOkResponse({
    description: 'Active salon team roster',
    schema: {
      type: 'array',
      items: teamMemberResponseOpenApiSchema,
    },
  })
  list(): Promise<TeamMemberResponse[]> {
    return this.teamMembersService.listActive();
  }
}
