import type { MockLink } from '@apollo/client/testing';
import { screen, waitFor, within } from '@testing-library/react';
import { GraphQLError } from 'graphql';
import { describe, expect, it } from 'vitest';
import { CatchErrors } from '@/test/catch-errors';
import { renderWithProviders } from '@/test/render';
import { AVAILABLE_CV_SKILLS, CV_SKILLS, DELETE_CV_SKILLS } from '../api/cvSkills.operations';
import { CvSkills } from './CvSkills';

const CV_ID = 'cv1';

const frontend = { __typename: 'SkillCategory' as const, id: 'c1', name: 'Frontend' };
const backend = { __typename: 'SkillCategory' as const, id: 'c2', name: 'Backend' };

const cvSkill = (
  id: string,
  name: string,
  mastery: 'ADVANCED' | 'EXPERT' | 'BEGINNER',
  category: typeof frontend,
) => ({
  __typename: 'CvSkill' as const,
  id,
  skill: { __typename: 'Skill' as const, id: `skill-${id}`, name, category },
  mastery,
});

const react = cvSkill('cs1', 'React', 'ADVANCED', frontend);
const css = cvSkill('cs2', 'CSS', 'BEGINNER', frontend);
const nest = cvSkill('cs3', 'NestJS', 'EXPERT', backend);

const listRequest = { query: CV_SKILLS, variables: { cvId: CV_ID } };

const listMock = (items = [react, css, nest]): MockLink.MockedResponse => ({
  request: listRequest,
  result: { data: { cvSkills: items } },
});

const listError = (code: string): MockLink.MockedResponse => ({
  request: listRequest,
  result: { errors: [new GraphQLError(code, { extensions: { code } })] },
});

const renderList = (mocks: MockLink.MockedResponse[] = [listMock()]) =>
  renderWithProviders(
    <CatchErrors>
      <CvSkills cvId={CV_ID} />
    </CatchErrors>,
    { mocks },
  );

const startRemoving = async (user: ReturnType<typeof renderList>['user']) => {
  await user.click(await screen.findByRole('button', { name: 'Remove skills' }));
};

describe('CvSkills', () => {
  describe('states', () => {
    it('shows placeholders while loading, then the skills with the owner mastery', async () => {
      renderList();

      expect(screen.getByRole('list', { name: 'Loading skills' })).toHaveAttribute(
        'aria-busy',
        'true',
      );

      expect(await screen.findByText('React')).toBeInTheDocument();
      expect(screen.getByRole('meter', { name: 'NestJS' })).toHaveAttribute(
        'aria-valuetext',
        'Expert',
      );
    });

    it('shows each category as its own section, and none for a category without skills', async () => {
      renderList([listMock([react, css])]);

      const frontendSection = await screen.findByRole('region', { name: 'Frontend' });
      expect(within(frontendSection).getByText('React')).toBeInTheDocument();
      expect(within(frontendSection).getByText('CSS')).toBeInTheDocument();
      expect(screen.queryByRole('region', { name: 'Backend' })).not.toBeInTheDocument();
    });

    it('shows the empty message; Add is there, Remove is disabled', async () => {
      renderList([listMock([])]);

      expect(await screen.findByText('No skills added yet')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add skill' })).toBeEnabled();
      expect(screen.getByRole('button', { name: 'Remove skills' })).toBeDisabled();
    });

    it('shows a load error with Retry, and Retry loads the list', async () => {
      const { user } = renderList([{ request: listRequest, error: new Error('down') }, listMock()]);

      expect(await screen.findByRole('alert')).toHaveTextContent('Failed to load skills');
      // no actions without data
      expect(screen.queryByRole('button', { name: 'Add skill' })).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Retry' }));

      expect(await screen.findByText('React')).toBeInTheDocument();
    });

    it('shows that another user CV is not accessible (FORBIDDEN), without Retry', async () => {
      renderList([listError('FORBIDDEN')]);

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'You are not authorized to access this CV',
      );
      expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Add skill' })).not.toBeInTheDocument();
    });

    it('shows CV not found without actions when the CV does not exist', async () => {
      renderList([listError('NOT_FOUND')]);

      expect(await screen.findByRole('heading', { name: 'CV not found' })).toBeInTheDocument();
      expect(screen.getByText('The CV does not exist or has been deleted')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Add skill' })).not.toBeInTheDocument();
    });
  });

  describe('outside selection mode', () => {
    it('opens Update skill with the clicked skill and its CV mastery; Escape closes it', async () => {
      const { user } = renderList();

      await user.click(await screen.findByRole('button', { name: /NestJS/ }));

      const dialog = screen.getByRole('dialog', { name: 'Update skill' });
      expect(within(dialog).getByRole('combobox', { name: 'Skill' })).toHaveTextContent('NestJS');
      expect(within(dialog).getByRole('combobox', { name: 'Skill mastery' })).toHaveTextContent(
        'Expert',
      );

      await user.keyboard('{Escape}');

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    });

    it('opens Add skill with the owner skills not yet in the CV', async () => {
      const { user } = renderList([
        listMock(),
        {
          request: { query: AVAILABLE_CV_SKILLS, variables: { cvId: CV_ID } },
          result: {
            data: { availableCvSkills: [{ __typename: 'Skill', id: 's9', name: 'Vue' }] },
          },
        },
      ]);

      await user.click(await screen.findByRole('button', { name: 'Add skill' }));

      const dialog = screen.getByRole('dialog', { name: 'Add skill' });
      const skill = within(dialog).getByRole('combobox', { name: 'Skill' });
      // disabled until the options are loaded
      await expect.poll(() => skill).toBeEnabled();
      await user.click(skill);
      expect(await within(document.body).findByRole('option', { name: 'Vue' })).toBeInTheDocument();
    });

    it.each([
      [
        'the CV has skills',
        [react],
        "All skills from the employee's profile are already in this CV",
      ],
      [
        'the CV is empty',
        [],
        "The employee's profile has no skills yet. Add them to the profile first",
      ],
    ])('tells in Add skill why there is nothing to add when %s', async (_case, cvSkills, text) => {
      const { user } = renderList([
        listMock(cvSkills),
        {
          request: { query: AVAILABLE_CV_SKILLS, variables: { cvId: CV_ID } },
          result: { data: { availableCvSkills: [] } },
        },
      ]);

      await user.click(await screen.findByRole('button', { name: 'Add skill' }));

      const dialog = screen.getByRole('dialog', { name: 'Add skill' });
      expect(await within(dialog).findByText(text)).toBeInTheDocument();
    });
  });

  describe('remove', () => {
    it('makes the skills selectable and counts them; Add is hidden', async () => {
      const { user } = renderList();

      await startRemoving(user);
      expect(screen.getByRole('button', { name: 'Remove' })).toBeDisabled();
      expect(screen.queryByRole('button', { name: 'Add skill' })).not.toBeInTheDocument();

      const reactButton = screen.getByRole('button', { name: /React/ });
      await user.click(reactButton);
      await user.click(screen.getByRole('button', { name: /NestJS/ }));

      expect(reactButton).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: /CSS/ })).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByRole('button', { name: 'Remove 2' })).toBeEnabled();
    });

    it('Cancel leaves selection mode without a request', async () => {
      const { user } = renderList();

      await startRemoving(user);
      await user.click(screen.getByRole('button', { name: /React/ }));
      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(screen.getByRole('button', { name: 'Remove skills' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /React/ })).not.toHaveAttribute('aria-pressed');
    });

    it('removes the selected CvSkill ids after confirmation and refreshes the list', async () => {
      const { user } = renderList([
        listMock(),
        {
          // the CvSkill ids, not the skill ids
          request: { query: DELETE_CV_SKILLS, variables: { cvId: CV_ID, ids: ['cs1', 'cs3'] } },
          result: { data: { deleteCvSkills: ['cs1', 'cs3'] } },
        },
        // refetchQueries: the list without the removed skills
        listMock([css]),
      ]);

      await startRemoving(user);
      await user.click(screen.getByRole('button', { name: /React/ }));
      await user.click(screen.getByRole('button', { name: /NestJS/ }));
      await user.click(screen.getByRole('button', { name: 'Remove 2' }));

      const dialog = screen.getByRole('dialog', { name: 'Remove skills' });
      expect(dialog).toHaveTextContent('Are you sure you want to remove 2 skills?');
      await user.click(within(dialog).getByRole('button', { name: 'Confirm' }));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(screen.queryByText('React')).not.toBeInTheDocument();
      expect(screen.getByText('CSS')).toBeInTheDocument();
      // selection mode is over
      expect(screen.getByRole('button', { name: 'Remove skills' })).toBeInTheDocument();
    });

    it('keeps the dialog and the selection when removing fails', async () => {
      const { user } = renderList([
        listMock(),
        {
          request: { query: DELETE_CV_SKILLS, variables: { cvId: CV_ID, ids: ['cs1'] } },
          result: {
            errors: [new GraphQLError('Forbidden', { extensions: { code: 'FORBIDDEN' } })],
          },
        },
      ]);

      await startRemoving(user);
      await user.click(screen.getByRole('button', { name: /React/ }));
      await user.click(screen.getByRole('button', { name: 'Remove 1' }));

      const dialog = screen.getByRole('dialog', { name: 'Remove skills' });
      expect(dialog).toHaveTextContent('Are you sure you want to remove 1 skill?');
      await user.click(within(dialog).getByRole('button', { name: 'Confirm' }));

      expect(await within(dialog).findByRole('alert')).toHaveTextContent(
        "You don't have permission to do this",
      );

      await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
      expect(screen.getByRole('button', { name: /React/ })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: 'Remove 1' })).toBeEnabled();
    });
  });
});
