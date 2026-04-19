import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StyleEntity } from '../database/entities/style.entity';
import { StylesController } from './styles.controller';
import { StylesService } from './styles.service';

@Module({
  imports: [TypeOrmModule.forFeature([StyleEntity])],
  controllers: [StylesController],
  providers: [StylesService],
})
export class StylesModule {}
