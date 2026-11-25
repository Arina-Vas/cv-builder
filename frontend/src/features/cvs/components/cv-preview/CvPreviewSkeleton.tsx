import { useTranslations } from 'next-intl';
import { Skeleton } from '@/shared/components/skeleton/Skeleton';
import doc from './document/CvPreviewDocument.module.css';
import s from './CvPreviewSkeleton.module.css';

/** A label + value pair of the document: bold label, then one line of value */
const Field = ({ valueClassName = s.valueWide }: { valueClassName?: string }) => (
  <div className={s.field}>
    <Skeleton className={`${s.line} ${s.label}`} />
    <Skeleton className={`${s.line} ${valueClassName}`} />
  </div>
);

/**
 * Loading layout of the CV preview: the document's own grid (width, header, aside | red line | main),
 * so nothing jumps when the data arrives. The skills table is below the first screen and is left out.
 */
export const CvPreviewSkeleton = () => {
  const t = useTranslations('cvs.preview');

  return (
    <div className={doc.document} aria-busy="true" aria-label={t('loading')}>
      <div className={doc.header}>
        <div>
          <Skeleton className={s.name} />
          <Skeleton className={s.position} />
        </div>
        <Skeleton className={s.button} />
      </div>

      <div className={doc.body}>
        <div className={s.columns}>
          <div className={s.aside}>
            <Field />
            <Field valueClassName={s.valueMedium} />
            <Field valueClassName={s.valueShort} />
          </div>
          <div className={s.main}>
            <Skeleton className={`${s.line} ${s.title}`} />
            <div className={s.paragraph}>
              <Skeleton className={s.line} />
              <Skeleton className={s.line} />
              <Skeleton className={s.line} />
              <Skeleton className={`${s.line} ${s.valueMedium}`} />
            </div>
            <Field valueClassName={s.valueMedium} />
            <Field valueClassName={s.valueShort} />
          </div>
        </div>

        <div>
          <Skeleton className={s.sectionTitle} />
          <div className={s.columns}>
            <div className={s.aside}>
              <Skeleton className={`${s.line} ${s.title}`} />
              <div className={s.paragraph}>
                <Skeleton className={s.line} />
                <Skeleton className={s.line} />
                <Skeleton className={`${s.line} ${s.valueMedium}`} />
              </div>
            </div>
            <div className={s.main}>
              <Field valueClassName={s.valueMedium} />
              <Field valueClassName={s.valueShort} />
              <Field />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
