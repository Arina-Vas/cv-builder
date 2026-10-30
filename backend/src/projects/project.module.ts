import { Module } from '@nestjs/common';
import { ProjectResolver } from '@/projects/project.resolver';
import { ProjectService } from '@/projects/project.service';

@Module({
  providers: [ProjectService, ProjectResolver],
})
export class ProjectModule {}
