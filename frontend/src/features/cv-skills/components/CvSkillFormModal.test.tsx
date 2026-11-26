import type { MockLink } from '@apollo/client/testing';
import { screen, within } from '@testing-library/react';
import { GraphQLError } from 'graphql';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { AVAILABLE_CV_SKILLS, CREATE_CV_SKILL } from '../api/cvSkills.operations';
import { CvSkillFormModal } from './CvSkillFormModal';

const CV_ID = 'cv1';

const frontend = { __typename: 'SkillCategory' as const, id: 'c1', name: 'Frontend' };

const vue = { __typename: 'Skill' as const, id: 's2', name: 'Vue' };
const angular = { __typename: 'Skill' as const, id: 's3', name: 'Angular' };

// the owner's skills that are not in the CV yet
const availableMock = (skills = [vue, angular]): MockLink.MockedResponse => ({
  request: { query: AVAILABLE_CV_SKILLS, variables: { cvId: CV_ID } },
  result: { data: { availableCvSkills: skills } },
});

const createRequest = {
  query: CREATE_CV_SKILL,
  variables: { input: { cvId: CV_ID, skillId: 's2' } },
};

const createError = (code: string, message: string): MockLink.MockedResponse => ({
  request: createRequest,
  result: {
    errors: [new GraphQLError(message, { extensions: { code, field: 'skillId' } })],
  },
});

const HINT = "Only skills from the employee's profile are shown";

const renderModal = (mocks: MockLink.MockedResponse[], onOpenChange = vi.fn(), cvSkillsCount = 1) =>
  renderWithProviders(
    <CvSkillFormModal
      open
      onOpenChange={onOpenChange}
      cvId={CV_ID}
      cvSkillsCount={cvSkillsCount}
    />,
    { mocks },
  );

const options = () =>
  within(document.body)
    .queryAllByRole('option')
    .map((option) => option.textContent);

const chooseVue = async (user: ReturnType<typeof renderModal>['user']) => {
  const trigger = screen.getByRole('combobox', { name: 'Skill' });
  await expect.poll(() => trigger).toBeEnabled();
  await user.click(trigger);
  await user.click(await within(document.body).findByRole('option', { name: 'Vue' }));
};

describe('CvSkillFormModal', () => {
  it('has one Skill field with the owner skills not yet in the CV, and no mastery', async () => {
    const { user } = renderModal([availableMock()]);

    expect(screen.getByRole('dialog', { name: 'Add skill' })).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Skill mastery' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('combobox', { name: 'Skill' }));
    await expect.poll(options).toEqual(['Vue', 'Angular']);
  });

  it('explains under Skill that the options come from the employee profile', async () => {
    renderModal([availableMock()]);

    // also while the options load, so nothing jumps in
    expect(screen.getByRole('status')).toHaveTextContent(HINT);
    await expect.poll(() => screen.getByRole('combobox', { name: 'Skill' })).toBeEnabled();
    expect(screen.getByRole('status')).toHaveTextContent(HINT);
  });

  it.each([
    [
      'the CV has no skills',
      0,
      "The employee's profile has no skills yet. Add them to the profile first",
    ],
    ['the CV has skills', 2, "All skills from the employee's profile are already in this CV"],
  ])(
    'locks Skill and says why there is nothing to add when %s',
    async (_case, cvSkillsCount, text) => {
      renderModal([availableMock([])], vi.fn(), cvSkillsCount);

      // the hint line turns into the reason (announced), Skill stays in place so the dialog does not jump
      await expect.poll(() => screen.getByRole('status')).toHaveTextContent(text);
      expect(screen.queryByText(HINT)).not.toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: 'Skill' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
    },
  );

  it('keeps Add disabled until a skill is chosen', async () => {
    const { user } = renderModal([availableMock()]);

    const add = screen.getByRole('button', { name: 'Add' });
    expect(add).toBeDisabled();

    await chooseVue(user);

    expect(add).toBeEnabled();
  });

  it('does not load the options while closed', () => {
    // no mock: a request would fail with "no more mocked responses"
    renderWithProviders(
      <CvSkillFormModal open={false} onOpenChange={vi.fn()} cvId={CV_ID} cvSkillsCount={0} />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('adds the skill to this CV and closes', async () => {
    const onOpenChange = vi.fn();
    const { user } = renderModal(
      [
        availableMock(),
        {
          request: createRequest,
          result: {
            data: {
              createCvSkill: {
                __typename: 'CvSkill',
                id: 'cs2',
                mastery: 'ADVANCED',
                skill: { ...vue, category: frontend },
              },
            },
          },
        },
        // refetchQueries: the options are on screen, so they are reloaded too
        availableMock([angular]),
      ],
      onOpenChange,
    );

    await chooseVue(user);
    await user.click(screen.getByRole('button', { name: 'Add' }));

    await expect.poll(() => onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows an already added skill (CONFLICT) under Skill and reloads the options', async () => {
    const onOpenChange = vi.fn();
    const { user } = renderModal(
      [
        availableMock(),
        createError('CONFLICT', 'Skill is already assigned to the CV'),
        // useRefetchOnError: Vue was added in another tab
        availableMock([angular]),
      ],
      onOpenChange,
    );

    await chooseVue(user);
    await user.click(screen.getByRole('button', { name: 'Add' }));

    const skill = screen.getByRole('combobox', { name: 'Skill' });
    await expect.poll(() => skill).toHaveAccessibleDescription('Skill is already added to the CV');
    expect(onOpenChange).not.toHaveBeenCalled();

    await user.click(skill);
    await expect.poll(options).toEqual(['Angular']);
  });

  it('shows a skill the owner no longer has (BAD_USER_INPUT) under Skill', async () => {
    const onOpenChange = vi.fn();
    const { user } = renderModal(
      [
        availableMock(),
        createError('BAD_USER_INPUT', 'Skill is not assigned to the CV owner'),
        // useRefetchOnError: the owner removed Vue from the profile
        availableMock([angular]),
      ],
      onOpenChange,
    );

    await chooseVue(user);
    await user.click(screen.getByRole('button', { name: 'Add' }));

    await expect
      .poll(() => screen.getByRole('combobox', { name: 'Skill' }))
      .toHaveAccessibleDescription('The CV owner no longer has this skill');
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('shows under Skill that the options could not be loaded', async () => {
    renderModal([
      {
        request: { query: AVAILABLE_CV_SKILLS, variables: { cvId: CV_ID } },
        error: new Error('down'),
      },
    ]);

    await expect
      .poll(() => screen.getByRole('combobox', { name: 'Skill' }))
      .toHaveAccessibleDescription('Something went wrong. Please try again later');
    // a failed load is not "nothing to add"
    expect(screen.queryByText(/already in this CV|has no skills yet/)).not.toBeInTheDocument();
  });
});
