import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { NotImplementedException, ParseUUIDPipe } from '@nestjs/common';
import { CvPreview } from './models/cv-preview.model';
import { User } from '@/users/models/user.model';
import { CurrentUser } from '@/common/auth/current-user.decorator';

const ACCESS =
  'Own CV or Admin. Fails with NOT_FOUND if the CV does not exist ' +
  "and FORBIDDEN for another user's CV";

@Resolver(() => CvPreview)
export class CvPreviewResolver {
  @Query(() => CvPreview, {
    description: 'Read-only data of one CV for the Preview tab and the PDF export. ' + ACCESS,
  })
  cvPreview(
    @CurrentUser() _currentUser: User,
    @Args('id', { type: () => ID }, ParseUUIDPipe) _id: string,
  ): Promise<CvPreview> {
    throw new NotImplementedException();
  }
}
