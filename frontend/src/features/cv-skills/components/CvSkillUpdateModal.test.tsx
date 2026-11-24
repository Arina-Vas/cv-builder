import type { MockLink } from '@apollo/client/testing';
import { screen, within } from '@testing-library/react';
import { GraphQLError } from 'graphql';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { UPDATE_CV_SKILL } from '../api/cvSkills.operations';
import { CvSkillUpdateModal } from './CvSkillUpdateModal';

const frontend = { __typename: 'SkillCategory' as const, id: 'c1', name: 'Frontend' };

const react = {
  __typename: 'CvSkill' as const,
  id: 'cs1',
  skill: { __typename: 'Skill' as const, id: 's1', name: 'React', category: frontend },
  mastery: 'ADVANCED' as const,
};

const updateRequest = {
  query: UPDATE_CV_SKILL,
  variables: { input: { id: 'cs1', mastery: 'EXPERT' } },
};

const renderModal = (mocks: MockLink.MockedResponse[] = [], onOpenChange = vi.fn()) =>
  renderWithProviders(<CvSkillUpdateModal cvSkill={react} onOpenChange={onOpenChange} />, {
    mocks,
  });

const chooseExpert = async (user: ReturnType<typeof renderModal>['user']) => {
  await user.click(screen.getByRole('combobox', { name: 'Skill mastery' }));
  await user.click(await within(document.body).findByRole('option', { name: 'Expert' }));
};

describe('CvSkillUpdateModal', () => {
  it('is closed without a skill', () => {
    renderWithProviders(<CvSkillUpdateModal cvSkill={null} onOpenChange={vi.fn()} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows the skill disabled and the CV mastery; Save waits for a change', async () => {
    const { user } = renderModal();

    expect(screen.getByRole('dialog', { name: 'Update skill' })).toBeInTheDocument();
    const skill = screen.getByRole('combobox', { name: 'Skill' });
    expect(skill).toBeDisabled();
    expect(skill).toHaveTextContent('React');
    expect(screen.getByRole('combobox', { name: 'Skill mastery' })).toHaveTextContent('Advanced');

    const save = screen.getByRole('button', { name: 'Save' });
    expect(save).toBeDisabled();

    await chooseExpert(user);

    expect(save).toBeEnabled();
  });

  it('sends only the new mastery of this CV skill and closes', async () => {
    const onOpenChange = vi.fn();
    const { user } = renderModal(
      [
        {
          request: updateRequest,
          result: { data: { updateCvSkill: { ...react, mastery: 'EXPERT' } } },
        },
      ],
      onOpenChange,
    );

    await chooseExpert(user);
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await expect.poll(() => onOpenChange).toHaveBeenCalledWith(false);
  });

  it('stays open with the chosen value when the skill was removed meanwhile (NOT_FOUND)', async () => {
    const onOpenChange = vi.fn();
    const { user } = renderModal(
      [
        {
          request: updateRequest,
          result: {
            errors: [new GraphQLError('CV skill not found', { extensions: { code: 'NOT_FOUND' } })],
          },
        },
      ],
      onOpenChange,
    );

    await chooseExpert(user);
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole('combobox', { name: 'Skill mastery' })).toHaveTextContent('Expert');
  });
});
