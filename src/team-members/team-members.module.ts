import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamMemberEntity } from '../database/entities/team-member.entity';
import { TeamMembersController } from './team-members.controller';
import { TeamMembersService } from './team-members.service';

@Module({
  imports: [TypeOrmModule.forFeature([TeamMemberEntity])],
  controllers: [TeamMembersController],
  providers: [TeamMembersService],
})
export class TeamMembersModule {}
