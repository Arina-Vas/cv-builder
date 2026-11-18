import { Cv } from '@/cvs/models/cv.model';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '@/common/auth/current-user.decorator';
import { User } from '@/users/models/user.model';
import { CvPage } from '@/cvs/models/cv-page.model';
import { CvsArgs } from '@/cvs/dto/cvs.args';
import { CvService } from '@/cvs/cv.service';
import { UserCvsArgs } from '@/cvs/dto/user-cvs.args';
import { ParseUUIDPipe } from '@nestjs/common';
import { CreateCvInput } from '@/cvs/dto/create-cv.input';
import { UpdateCvInput } from '@/cvs/dto/update-cv.input';

@Resolver(() => Cv)
export class CvResolver {
  constructor(private readonly cvService: CvService) {}

  @Query(() => CvPage, {
    description:
      'CVs page: own CVs for an Employee, all CVs for an Admin. Search is case-insensitive: ' +
      'by CV name, for an Admin also by the owner email',
  })
  cvs(@CurrentUser() currentUser: User, @Args() args: CvsArgs): Promise<CvPage> {
    return this.cvService.findAll(currentUser, args);
  }

  @Query(() => CvPage, {
    description:
      'CVs of one user (User CVs tab), own profile or Admin. Search is case-insensitive, by CV name only. ' +
      'Fails with FORBIDDEN for another user and NOT_FOUND if the user does not exist',
  })
  userCvs(@CurrentUser() currentUser: User, @Args() args: UserCvsArgs): Promise<CvPage> {
    return this.cvService.findByUser(currentUser, args);
  }

  @Query(() => Cv, {
    description:
      'Own CV or Admin. Fails with NOT_FOUND if the CV does not exist ' +
      "and FORBIDDEN for another user's CV",
  })
  cv(
    @CurrentUser() currentUser: User,
    @Args('id', { type: () => ID }, ParseUUIDPipe) id: string,
  ): Promise<Cv> {
    return this.cvService.findOne(currentUser, id);
  }

  @Mutation(() => Cv, {
    description:
      'Creates a CV for `input.userId`: an Employee only for themselves, an Admin for any user. ' +
      'Fails with FORBIDDEN for another user and NOT_FOUND if the user does not exist',
  })
  createCv(@CurrentUser() currentUser: User, @Args('input') input: CreateCvInput): Promise<Cv> {
    return this.cvService.create(currentUser, input);
  }

  @Mutation(() => Cv, {
    description:
      'Own CV or Admin. Changes name, education and description; `input.userId` is the current owner, ' +
      'used only to check access, the owner never changes. Fails with FORBIDDEN for another user, ' +
      'NOT_FOUND if the user does not exist or the CV does not belong to them',
  })
  updateCv(@CurrentUser() currentUser: User, @Args('input') input: UpdateCvInput): Promise<Cv> {
    return this.cvService.update(currentUser, input);
  }

  @Mutation(() => ID, {
    description:
      'Own CV or Admin; `userId` is the CV owner, used only to check access. Returns the deleted id; ' +
      "the CV's skills and projects are deleted with it. Fails with FORBIDDEN for another user, " +
      'NOT_FOUND if the user does not exist or the CV does not belong to them',
  })
  deleteCv(
    @CurrentUser() currentUser: User,
    @Args('id', { type: () => ID }, ParseUUIDPipe) id: string,
    @Args('userId', { type: () => ID }, ParseUUIDPipe) userId: string,
  ): Promise<string> {
    return this.cvService.delete(currentUser, id, userId);
  }
}
