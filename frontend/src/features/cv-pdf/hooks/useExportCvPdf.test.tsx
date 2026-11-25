import type { MockLink } from '@apollo/client/testing';
import { MockedProvider } from '@apollo/client/testing/react';
import { act, renderHook, screen, waitFor } from '@testing-library/react';
import { GraphQLError } from 'graphql';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { GENERATE_CV_PDF } from '@/features/cv-pdf/api/cv-pdf.operations';
import type { Locale } from '@/i18n/config';
import { ToastProvider } from '@/shared/components/toast/ToastProvider';
import { downloadBase64File } from '@/shared/lib/download/downloadBase64File';
import en from '../../../../messages/en.json';
import { useExportCvPdf } from './useExportCvPdf';

vi.mock('@/shared/lib/download/downloadBase64File', () => ({ downloadBase64File: vi.fn() }));

const CV_ID = '7f0c9a5e-3d2b-4c1a-9e8f-1a2b3c4d5e6f';
const PDF = { __typename: 'CvPdf', fileName: 'software-engineer.pdf', content: 'JVBERg==' };

const request = (locale: Locale = 'en') => ({
  query: GENERATE_CV_PDF,
  variables: { input: { locale, cvId: CV_ID } },
});

const successMock = (locale?: Locale): MockLink.MockedResponse => ({
  request: request(locale),
  result: { data: { generateCvPdf: PDF } },
});

const errorMock = (code: string): MockLink.MockedResponse => ({
  request: request(),
  result: { errors: [new GraphQLError('raw backend text', { extensions: { code } })] },
});

const networkErrorMock: MockLink.MockedResponse = {
  request: request(),
  error: new TypeError('Failed to fetch'),
};

const setup = (mocks: MockLink.MockedResponse[], locale: Locale = 'en') =>
  renderHook(() => useExportCvPdf(CV_ID), {
    wrapper: ({ children }: { children: ReactNode }) => (
      // en messages for every locale: the hook only needs the locale code
      <NextIntlClientProvider locale={locale} messages={en}>
        <MockedProvider mocks={mocks}>
          <ToastProvider>{children}</ToastProvider>
        </MockedProvider>
      </NextIntlClientProvider>
    ),
  });

describe('useExportCvPdf', () => {
  it('downloads the generated PDF under the name from the backend, without a toast', async () => {
    const { result } = setup([successMock()]);

    await act(() => result.current.exportPdf());

    expect(downloadBase64File).toHaveBeenCalledExactlyOnceWith(
      PDF.content,
      PDF.fileName,
      'application/pdf',
    );
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('sends the current UI locale', async () => {
    const { result } = setup([successMock('de')], 'de');

    await act(() => result.current.exportPdf());

    expect(downloadBase64File).toHaveBeenCalledOnce();
  });

  it('reports loading while the PDF is generated', async () => {
    const { result } = setup([successMock()]);

    let pending!: Promise<void>;
    act(() => {
      pending = result.current.exportPdf();
    });
    await waitFor(() => expect(result.current.loading).toBe(true));

    await act(() => pending);
    expect(result.current.loading).toBe(false);
  });

  // AC-28: `loading` only changes after a re-render, so a fast double click must not send two requests
  it('sends one request for a double click', async () => {
    const { result } = setup([successMock()]);

    await act(() => Promise.all([result.current.exportPdf(), result.current.exportPdf()]));

    expect(downloadBase64File).toHaveBeenCalledOnce();
    expect(screen.queryByText(en.errors.INTERNAL_SERVER_ERROR)).toBeNull();
  });

  it('can export again after the previous export has finished', async () => {
    const { result } = setup([successMock(), successMock()]);

    await act(() => result.current.exportPdf());
    await act(() => result.current.exportPdf());

    expect(downloadBase64File).toHaveBeenCalledTimes(2);
  });

  it('can export again after a failed export', async () => {
    const { result } = setup([errorMock('INTERNAL_SERVER_ERROR'), successMock()]);

    await act(() => result.current.exportPdf());
    await act(() => result.current.exportPdf());

    expect(downloadBase64File).toHaveBeenCalledOnce();
  });

  it.each([
    ['FORBIDDEN', en.errors.FORBIDDEN],
    ['NOT_FOUND', en.errors.NOT_FOUND],
    ['BAD_USER_INPUT', en.errors.BAD_USER_INPUT],
    ['INTERNAL_SERVER_ERROR', en.errors.INTERNAL_SERVER_ERROR],
  ])('shows our own text for %s, not the backend message', async (code, text) => {
    const { result } = setup([errorMock(code)]);

    await act(() => result.current.exportPdf());

    expect(await screen.findByText(text)).toBeInTheDocument();
    expect(screen.queryByText('raw backend text')).toBeNull();
    expect(downloadBase64File).not.toHaveBeenCalled();
  });

  it('shows the export error for a network failure', async () => {
    const { result } = setup([networkErrorMock]);

    await act(() => result.current.exportPdf());

    expect(await screen.findByText(en.cvs.preview.exportError)).toBeInTheDocument();
    expect(downloadBase64File).not.toHaveBeenCalled();
  });
});
