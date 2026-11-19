import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ParseUUIDPipe } from '@nestjs/common';
import { CurrentUser } from '@/common/auth/current-user.decorator';
import { User } from '@/users/models/user.model';
import { CvProject } from '@/cvs/cv-projects/models/cv-project.model';
import { CvProjectList } from '@/cvs/cv-projects/models/cv-project-list.model';
import { CvProjectService } from '@/cvs/cv-projects/cv-project.service';
import { CvProjectsArgs } from '@/cvs/cv-projects/dto/cv-projects.args';
import { CreateCvProjectInput } from '@/cvs/cv-projects/dto/create-cv-project.input';
import { UpdateCvProjectInput } from '@/cvs/cv-projects/dto/update-cv-project.input';
import { Project } from '@/projects/models/project.model';

const ACCESS =
  'Own CV or Admin. Fails with NOT_FOUND if the CV does not exist ' +
  "and FORBIDDEN for another user's CV";

@Resolver(() => CvProject)
export class CvProjectResolver {
  constructor(private readonly cvProjectService: CvProjectService) {}

  @Query(() => CvProjectList, {
    description: `Projects of one CV. Search is case-insensitive, by project name or domain. ${ACCESS}`,
  })
  cvProjects(
    @CurrentUser() currentUser: User,
    @Args() args: CvProjectsArgs,
  ): Promise<CvProjectList> {
    return this.cvProjectService.findAll(currentUser, args);
  }

  @Query(() => [Project], {
    description: `Catalog projects not yet added to the CV (Add project modal). ${ACCESS}`,
  })
  availableCvProjects(
    @CurrentUser() currentUser: User,
    @Args('cvId', { type: () => ID }, ParseUUIDPipe) cvId: string,
  ): Promise<Project[]> {
    return this.cvProjectService.findAvailable(currentUser, cvId);
  }

  @Mutation(() => CvProject, {
    description:
      `Adds a catalog project to the CV. ${ACCESS}. ` +
      'BAD_USER_INPUT for dates outside the project period or unknown project / roles, ' +
      'CONFLICT on projectId if the project is already in the CV',
  })
  createCvProject(
    @CurrentUser() currentUser: User,
    @Args('input') input: CreateCvProjectInput,
  ): Promise<CvProject> {
    return this.cvProjectService.create(currentUser, input);
  }

  @Mutation(() => CvProject, {
    description:
      `Changes dates, roles and responsibilities; the project never changes. ${ACCESS}. ` +
      'NOT_FOUND if the CV project is not in this CV',
  })
  updateCvProject(
    @CurrentUser() currentUser: User,
    @Args('input') input: UpdateCvProjectInput,
  ): Promise<CvProject> {
    return this.cvProjectService.update(currentUser, input);
  }

  @Mutation(() => ID, {
    description:
      `Removes the project from the CV with its roles and returns the id; the catalog project ` +
      `and roles stay. ${ACCESS}. NOT_FOUND if the CV project is not in this CV`,
  })
  deleteCvProject(
    @CurrentUser() currentUser: User,
    @Args('id', { type: () => ID }, ParseUUIDPipe) id: string,
    @Args('cvId', { type: () => ID }, ParseUUIDPipe) cvId: string,
  ): Promise<string> {
    return this.cvProjectService.delete(currentUser, id, cvId);
  }
}
