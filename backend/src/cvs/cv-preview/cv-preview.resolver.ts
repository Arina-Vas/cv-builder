import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { ParseUUIDPipe } from '@nestjs/common';
import { CvPreview } from './models/cv-preview.model';
import { CvPreviewService } from './cv-preview.service';
import { User } from '@/users/models/user.model';
import { CurrentUser } from '@/common/auth/current-user.decorator';

const ACCESS =
  'Own CV or Admin. Fails with NOT_FOUND if the CV does not exist ' +
  "and FORBIDDEN for another user's CV";

@Resolver(() => CvPreview)
export class CvPreviewResolver {
  constructor(private readonly cvPreviewService: CvPreviewService) {}

  @Query(() => CvPreview, {
    description: 'Read-only data of one CV for the Preview tab and the PDF export. ' + ACCESS,
  })
  cvPreview(
    @CurrentUser() currentUser: User,
    @Args('id', { type: () => ID }, ParseUUIDPipe) id: string,
  ): Promise<CvPreview> {
    return this.cvPreviewService.getPreview(currentUser, id);
  }
}
