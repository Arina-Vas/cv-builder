import { useMutation } from '@apollo/client/react';
import { GENERATE_CV_PDF } from '@/features/cv-pdf/api/cv-pdf.operations';
import { NO_ERROR_TOAST } from '@/shared/lib/apollo/error-toast-link';
import { parseError } from '@/shared/lib/apollo/graphql-errors';
import { useErrorMessage } from '@/shared/lib/apollo/useErrorMessage';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { downloadBase64File } from '@/shared/lib/download/downloadBase64File';
import { useLocale, useTranslations } from 'next-intl';
import { useRef } from 'react';

export const useExportCvPdf = (cvId: string) => {
  const locale = useLocale();
  const t = useTranslations('cvs.preview');
  const [generatePdf, { loading }] = useMutation(GENERATE_CV_PDF, {
    context: NO_ERROR_TOAST,
  });
  const errorMessage = useErrorMessage();
  const toast = useToast();

  const inFlight = useRef(false);

  const exportPdf = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const { data } = await generatePdf({
        variables: { input: { locale, cvId } },
      });
      if (data)
        downloadBase64File(
          data.generateCvPdf.content,
          data.generateCvPdf.fileName,
          'application/pdf',
        );
    } catch (error) {
      const appError = parseError(error);
      toast.error(appError.code ? errorMessage(appError) : t('exportError'));
    } finally {
      inFlight.current = false;
    }
  };

  return {
    exportPdf,
    loading,
  };
};
