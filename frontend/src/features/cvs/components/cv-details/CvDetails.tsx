import { useQuery } from '@apollo/client/react';
import { CV } from '@/features/cvs/api/cvs.operations';
import { useTranslations } from 'next-intl';
import { CvDetailsForm } from '@/features/cvs/components/cv-details/CvDetailsForm';
import { hasErrorCode } from '@/shared/lib/apollo/graphql-errors';
import { notFound } from 'next/navigation';
import { CvDetailsSkeleton } from './CvDetailsSkeleton';
import { ErrorState } from '@/shared/components/error-state/ErrorState';

type Props = {
  cvId: string;
};
export const CvDetails = ({ cvId }: Props) => {
  const t = useTranslations('cvs.details');

  const { data, error, loading, refetch } = useQuery(CV, { variables: { id: cvId } });

  if (error) {
    if (hasErrorCode(error, 'NOT_FOUND')) notFound();
    if (hasErrorCode(error, 'FORBIDDEN'))
      return <ErrorState inline title={t('forbidden.title')} message={t('forbidden.message')} />;
    return (
      <ErrorState
        inline
        title={t('loadErrorTitle')}
        action={{ label: t('retry'), onClick: () => void refetch(), loading }}
        message={t('loadError')}
      />
    );
  }

  if (!data) return <CvDetailsSkeleton />;

  return <CvDetailsForm key={data.cv.id} cv={data.cv} />;
};
