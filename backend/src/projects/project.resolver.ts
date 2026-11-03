import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Project } from '@/projects/models/project.model';
import { ProjectService } from '@/projects/project.service';
import { ProjectList } from '@/projects/models/project-list.model';
import { ProjectsArgs } from '@/projects/dto/projects.args';
import { CreateProjectInput } from '@/projects/dto/create-project.input';
import { UpdateProjectInput } from '@/projects/dto/update-project.input';
import { ParseUUIDPipe } from '@nestjs/common';
import { UserRole } from '@/common/graphql/enums';
import { Roles } from '@/common/auth/roles.decorator';
import { Skill } from '@/skills/models/skill.model';

@Resolver(() => Project)
export class ProjectResolver {
  constructor(private readonly projectService: ProjectService) {}

  @Query(() => ProjectList)
  projects(@Args() args: ProjectsArgs): Promise<ProjectList> {
    return this.projectService.findAll(args);
  }

  @Query(() => [Skill], { description: 'Skills available as project technologies ("Environment")' })
  technologies(): Promise<Skill[]> {
    return this.projectService.findTechnologies();
  }

  @Roles(UserRole.ADMIN)
  @Mutation(() => Project)
  createProject(@Args('input') input: CreateProjectInput): Promise<Project> {
    return this.projectService.create(input);
  }

  @Roles(UserRole.ADMIN)
  @Mutation(() => Project)
  updateProject(@Args('input') input: UpdateProjectInput): Promise<Project> {
    return this.projectService.update(input);
  }

  @Roles(UserRole.ADMIN)
  @Mutation(() => ID, { description: 'Fails with ENTITY_IN_USE if the project is used in CVs' })
  deleteProject(@Args('id', { type: () => ID }, ParseUUIDPipe) id: string): Promise<string> {
    return this.projectService.delete(id);
  }
}
