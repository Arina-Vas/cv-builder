import type { MockLink } from '@apollo/client/testing';
import { screen } from '@testing-library/react';
import { GraphQLError } from 'graphql';
import { notFound } from 'next/navigation';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { CatchErrors } from '@/test/catch-errors';
import { CV, UPDATE_CV } from '../../api/cvs.operations';
import { CvDetails } from './CvDetails';

const CV_ID = 'c1';

const cv = {
  __typename: 'Cv' as const,
  id: CV_ID,
  name: 'Frontend Developer',
  education: 'Applied Mathematics',
  description: 'React and TypeScript',
  user: { __typename: 'User' as const, id: 'owner', email: 'owner@example.com' },
};

const cvRequest = { query: CV, variables: { id: CV_ID } };

const cvMock = (data = cv): MockLink.MockedResponse => ({
  request: cvRequest,
  result: { data: { cv: data } },
});

const errorMock = (code: string): MockLink.MockedResponse => ({
  request: cvRequest,
  result: { errors: [new GraphQLError('backend text', { extensions: { code } })] },
});

const updateRequest = (name: string) => ({
  query: UPDATE_CV,
  variables: {
    input: {
      name,
      education: 'Applied Mathematics',
      description: 'React and TypeScript',
      id: CV_ID,
      userId: 'owner',
    },
  },
});

const renderDetails = (mocks: MockLink.MockedResponse[]) =>
  renderWithProviders(
    <CatchErrors>
      <CvDetails cvId={CV_ID} />
    </CatchErrors>,
    { mocks },
  );

describe('CvDetails', () => {
  describe('loading', () => {
    it('shows a skeleton with the form layout while the CV loads', () => {
      renderDetails([cvMock()]);

      expect(screen.getByLabelText('Loading CV')).toHaveAttribute('aria-busy', 'true');
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('shows the form filled with the CV and UPDATE disabled', async () => {
      renderDetails([cvMock()]);

      expect(await screen.findByLabelText('Name')).toHaveValue('Frontend Developer');
      expect(screen.getByLabelText('Education')).toHaveValue('Applied Mathematics');
      expect(screen.getByLabelText('Description')).toHaveValue('React and TypeScript');
      expect(screen.getByRole('button', { name: 'Update' })).toBeDisabled();
    });

    it('opens the 404 page when the CV does not exist', async () => {
      // React logs the error caught by the boundary; keep the test output clean
      vi.spyOn(console, 'error').mockImplementation(() => {});

      renderDetails([errorMock('NOT_FOUND')]);

      await vi.waitFor(() => expect(notFound).toHaveBeenCalled());
    });

    it("shows Access denied without any CV data for another user's CV", async () => {
      renderDetails([errorMock('FORBIDDEN')]);

      expect(await screen.findByText('Access denied')).toBeInTheDocument();
      expect(screen.getByText('You are not authorized to access this CV')).toBeInTheDocument();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
    });

    it('shows the load error with Retry that repeats the request', async () => {
      const { user } = renderDetails([
        { request: cvRequest, error: new Error('Network down') },
        cvMock(),
      ]);

      expect(await screen.findByRole('heading', { name: 'Oops' })).toBeInTheDocument();
      expect(screen.getByText('Failed to load CV details')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Retry' }));

      expect(await screen.findByLabelText('Name')).toHaveValue('Frontend Developer');
    });
  });

  describe('form', () => {
    it('enables UPDATE after a change and disables it while a field is invalid', async () => {
      const { user } = renderDetails([cvMock()]);

      const name = await screen.findByLabelText('Name');
      const update = screen.getByRole('button', { name: 'Update' });

      await user.type(name, ' v2');
      await expect.poll(() => update).toBeEnabled();

      await user.clear(name);
      await user.tab();
      expect(await screen.findByText('Name is required')).toBeInTheDocument();
      expect(update).toBeDisabled();
    });

    // userId is the CV owner: an Admin updates someone else's CV
    it('saves with the owner userId, shows a toast and disables UPDATE with the saved values', async () => {
      const saved = { ...cv, name: 'Frontend Developer v2' };
      const { user } = renderDetails([
        cvMock(),
        {
          request: updateRequest('Frontend Developer v2'),
          result: { data: { updateCv: saved } },
        },
      ]);

      await user.type(await screen.findByLabelText('Name'), ' v2');
      await user.click(screen.getByRole('button', { name: 'Update' }));

      expect(await screen.findByText('CV has been updated')).toBeInTheDocument();
      expect(screen.getByLabelText('Name')).toHaveValue('Frontend Developer v2');
      expect(screen.getByRole('button', { name: 'Update' })).toBeDisabled();
    });

    it('keeps the entered values and shows a friendly message when the save fails', async () => {
      const { user } = renderDetails([
        cvMock(),
        {
          request: updateRequest('Frontend Developer v2'),
          result: {
            errors: [new GraphQLError('backend text', { extensions: { code: 'FORBIDDEN' } })],
          },
        },
      ]);

      await user.type(await screen.findByLabelText('Name'), ' v2');
      await user.click(screen.getByRole('button', { name: 'Update' }));

      expect(await screen.findByRole('alert')).toHaveTextContent(
        "You don't have permission to do this",
      );
      expect(screen.getByLabelText('Name')).toHaveValue('Frontend Developer v2');
      expect(screen.queryByText('CV has been updated')).not.toBeInTheDocument();
      expect(screen.queryByText('backend text')).not.toBeInTheDocument();
    });

    // wiki: a CV deleted meanwhile must not stay on screen as current data
    it('opens the 404 page when the CV was deleted before saving', async () => {
      // React logs the error caught by the boundary; keep the test output clean
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const gone = {
        errors: [new GraphQLError('backend text', { extensions: { code: 'NOT_FOUND' } })],
      };
      const { user } = renderDetails([
        cvMock(),
        { request: updateRequest('Frontend Developer v2'), result: gone },
        // useRefetchOnError: cv(id) again, now NOT_FOUND, so CvDetails opens Not Found
        { request: cvRequest, result: gone },
      ]);

      await user.type(await screen.findByLabelText('Name'), ' v2');
      await user.click(screen.getByRole('button', { name: 'Update' }));

      await vi.waitFor(() => expect(notFound).toHaveBeenCalled());
    });
  });
});
