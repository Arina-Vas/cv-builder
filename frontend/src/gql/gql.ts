/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  fragment AuthUserFields on User {\n    id\n    email\n    role\n    emailVerifiedAt\n  }\n": typeof types.AuthUserFieldsFragmentDoc,
    "\n  mutation SignIn($input: SignInInput!) {\n    signIn(input: $input) {\n      ...AuthUserFields\n    }\n  }\n": typeof types.SignInDocument,
    "\n  mutation SignUp($input: SignUpInput!) {\n    signUp(input: $input) {\n      ...AuthUserFields\n    }\n  }\n": typeof types.SignUpDocument,
    "\n  mutation VerifyEmail($input: VerifyEmailInput!) {\n    verifyEmail(input: $input) {\n      ...AuthUserFields\n    }\n  }\n": typeof types.VerifyEmailDocument,
    "\n  mutation ResendVerificationCode {\n    resendVerificationCode\n  }\n": typeof types.ResendVerificationCodeDocument,
    "\n  mutation RequestPasswordReset($input: RequestPasswordResetInput!) {\n    requestPasswordReset(input: $input)\n  }\n": typeof types.RequestPasswordResetDocument,
    "\n  mutation ResetPassword($input: ResetPasswordInput!) {\n    resetPassword(input: $input)\n  }\n": typeof types.ResetPasswordDocument,
    "\n  query Me {\n    me {\n      ...AuthUserFields\n      firstName\n      lastName\n      avatarUrl\n    }\n  }\n": typeof types.MeDocument,
    "\n  mutation Logout {\n    logout\n  }\n": typeof types.LogoutDocument,
    "\n  query BreadcrumbUser($id: ID!) {\n    user(id: $id) {\n      id\n      email\n      firstName\n      lastName\n    }\n  }\n": typeof types.BreadcrumbUserDocument,
    "\n  query BreadcrumbCv($id: ID!) {\n    cv(id: $id) {\n      id\n      name\n    }\n  }\n": typeof types.BreadcrumbCvDocument,
    "\n  fragment CvPdfFields on CvPdf {\n    content\n    fileName\n  }\n": typeof types.CvPdfFieldsFragmentDoc,
    "\n  mutation GenerateCvPdf($input: GenerateCvPdfInput!) {\n    generateCvPdf(input: $input) {\n      ...CvPdfFields\n    }\n  }\n": typeof types.GenerateCvPdfDocument,
    "\n  fragment CvProjectFields on CvProject {\n    id\n    startDate\n    endDate\n    responsibilities\n    roles {\n      id\n      name\n    }\n    project {\n      ...ProjectFields\n    }\n  }\n": typeof types.CvProjectFieldsFragmentDoc,
    "\n  query CvProjects(\n    $cvId: ID!\n    $search: String\n    $sortBy: CvProjectSortField!\n    $sortOrder: SortOrder!\n  ) {\n    cvProjects(cvId: $cvId, search: $search, sortBy: $sortBy, sortOrder: $sortOrder) {\n      items {\n        ...CvProjectFields\n      }\n      total\n    }\n  }\n": typeof types.CvProjectsDocument,
    "\n  query AvailableCvProjects($cvId: ID!) {\n    availableCvProjects(cvId: $cvId) {\n      ...ProjectFields\n    }\n  }\n": typeof types.AvailableCvProjectsDocument,
    "\n  query ProjectRoles {\n    projectRoles {\n      id\n      name\n    }\n  }\n": typeof types.ProjectRolesDocument,
    "\n  mutation CreateCvProject($input: CreateCvProjectInput!) {\n    createCvProject(input: $input) {\n      ...CvProjectFields\n    }\n  }\n": typeof types.CreateCvProjectDocument,
    "\n  mutation UpdateCvProject($input: UpdateCvProjectInput!) {\n    updateCvProject(input: $input) {\n      ...CvProjectFields\n    }\n  }\n": typeof types.UpdateCvProjectDocument,
    "\n  mutation DeleteCvProject($id: ID!, $cvId: ID!) {\n    deleteCvProject(id: $id, cvId: $cvId)\n  }\n": typeof types.DeleteCvProjectDocument,
    "\n  fragment CvSkillFields on CvSkill {\n    id\n    skill {\n      id\n      name\n      category {\n        id\n        name\n      }\n    }\n    mastery\n  }\n": typeof types.CvSkillFieldsFragmentDoc,
    "\n  query CvSkills($cvId: ID!) {\n    cvSkills(cvId: $cvId) {\n      ...CvSkillFields\n    }\n  }\n": typeof types.CvSkillsDocument,
    "\n  query AvailableCvSkills($cvId: ID!) {\n    availableCvSkills(cvId: $cvId) {\n      id\n      name\n    }\n  }\n": typeof types.AvailableCvSkillsDocument,
    "\n  mutation CreateCvSkill($input: CreateCvSkillInput!) {\n    createCvSkill(input: $input) {\n      ...CvSkillFields\n    }\n  }\n": typeof types.CreateCvSkillDocument,
    "\n  mutation UpdateCvSkill($input: UpdateCvSkillInput!) {\n    updateCvSkill(input: $input) {\n      ...CvSkillFields\n    }\n  }\n": typeof types.UpdateCvSkillDocument,
    "\n  mutation DeleteCvSkills($cvId: ID!, $ids: [ID!]!) {\n    deleteCvSkills(cvId: $cvId, ids: $ids)\n  }\n": typeof types.DeleteCvSkillsDocument,
    "\n  fragment CvFields on Cv {\n    id\n    name\n    description\n    education\n    user {\n      id\n      email\n    }\n  }\n": typeof types.CvFieldsFragmentDoc,
    "\n  query Cvs(\n    $page: Int!\n    $pageSize: Int!\n    $search: String\n    $sortBy: CvSortField!\n    $sortOrder: SortOrder!\n  ) {\n    cvs(page: $page, pageSize: $pageSize, search: $search, sortBy: $sortBy, sortOrder: $sortOrder) {\n      items {\n        ...CvFields\n      }\n      page\n      pageSize\n      total\n    }\n  }\n": typeof types.CvsDocument,
    "\n  query CvPreview($id: ID!) {\n    cvPreview(id: $id) {\n      id\n      name\n      education\n      description\n      domains\n      user {\n        id\n        email\n        firstName\n        lastName\n        position {\n          id\n          name\n        }\n      }\n      languages {\n        id\n        proficiency\n        language {\n          id\n          name\n        }\n      }\n      skillGroups {\n        category {\n          id\n          name\n        }\n        skills {\n          experienceYears\n          lastUsedYear\n          skill {\n            id\n            name\n          }\n        }\n      }\n      projects {\n        ...CvProjectFields\n      }\n    }\n  }\n": typeof types.CvPreviewDocument,
    "\n  query UserCvs(\n    $page: Int!\n    $pageSize: Int!\n    $search: String\n    $sortBy: CvSortField!\n    $sortOrder: SortOrder!\n    $userId: ID!\n  ) {\n    userCvs(\n      page: $page\n      pageSize: $pageSize\n      search: $search\n      sortBy: $sortBy\n      sortOrder: $sortOrder\n      userId: $userId\n    ) {\n      items {\n        ...CvFields\n      }\n      page\n      pageSize\n      total\n    }\n  }\n": typeof types.UserCvsDocument,
    "\n  query Cv($id: ID!) {\n    cv(id: $id) {\n      ...CvFields\n    }\n  }\n": typeof types.CvDocument,
    "\n  mutation CreateCv($input: CreateCvInput!) {\n    createCv(input: $input) {\n      ...CvFields\n    }\n  }\n": typeof types.CreateCvDocument,
    "\n  mutation UpdateCv($input: UpdateCvInput!) {\n    updateCv(input: $input) {\n      ...CvFields\n    }\n  }\n": typeof types.UpdateCvDocument,
    "\n  mutation DeleteCv($id: ID!, $userId: ID!) {\n    deleteCv(id: $id, userId: $userId)\n  }\n": typeof types.DeleteCvDocument,
    "\n  fragment DepartmentFields on Department {\n    id\n    name\n  }\n": typeof types.DepartmentFieldsFragmentDoc,
    "\n  query Departments(\n    $page: Int!\n    $pageSize: Int!\n    $search: String\n    $sortBy: DepartmentSortField!\n    $sortOrder: SortOrder!\n  ) {\n    departments(\n      page: $page\n      pageSize: $pageSize\n      sortBy: $sortBy\n      sortOrder: $sortOrder\n      search: $search\n    ) {\n      items {\n        ...DepartmentFields\n      }\n      page\n      pageSize\n      total\n    }\n  }\n": typeof types.DepartmentsDocument,
    "\n  mutation CreateDepartment($input: CreateDepartmentInput!) {\n    createDepartment(input: $input) {\n      ...DepartmentFields\n    }\n  }\n": typeof types.CreateDepartmentDocument,
    "\n  mutation UpdateDepartment($input: UpdateDepartmentInput!) {\n    updateDepartment(input: $input) {\n      ...DepartmentFields\n    }\n  }\n": typeof types.UpdateDepartmentDocument,
    "\n  mutation DeleteDepartment($id: ID!) {\n    deleteDepartment(id: $id)\n  }\n": typeof types.DeleteDepartmentDocument,
    "\n  fragment LanguageFields on Language {\n    id\n    name\n    iso\n    nativeName\n  }\n": typeof types.LanguageFieldsFragmentDoc,
    "\n  query Languages(\n    $page: Int!\n    $pageSize: Int!\n    $search: String\n    $sortBy: LanguageSortField!\n    $sortOrder: SortOrder!\n  ) {\n    languages(\n      page: $page\n      pageSize: $pageSize\n      search: $search\n      sortBy: $sortBy\n      sortOrder: $sortOrder\n    ) {\n      items {\n        ...LanguageFields\n      }\n      page\n      pageSize\n      total\n    }\n  }\n": typeof types.LanguagesDocument,
    "\n  mutation CreateLanguage($input: CreateLanguageInput!) {\n    createLanguage(input: $input) {\n      ...LanguageFields\n    }\n  }\n": typeof types.CreateLanguageDocument,
    "\n  mutation UpdateLanguage($input: UpdateLanguageInput!) {\n    updateLanguage(input: $input) {\n      ...LanguageFields\n    }\n  }\n": typeof types.UpdateLanguageDocument,
    "\n  mutation DeleteLanguage($id: ID!) {\n    deleteLanguage(id: $id)\n  }\n": typeof types.DeleteLanguageDocument,
    "\n  fragment UserLanguageFields on UserLanguage {\n    id\n    language {\n      id\n      name\n    }\n    proficiency\n  }\n": typeof types.UserLanguageFieldsFragmentDoc,
    "\n  query UserLanguages($userId: ID!) {\n    userLanguages(userId: $userId) {\n      ...UserLanguageFields\n    }\n  }\n": typeof types.UserLanguagesDocument,
    "\n  query AvailableUserLanguages($userId: ID!) {\n    availableUserLanguages(userId: $userId) {\n      id\n      name\n    }\n  }\n": typeof types.AvailableUserLanguagesDocument,
    "\n  mutation CreateUserLanguage($input: CreateUserLanguageInput!) {\n    createUserLanguage(input: $input) {\n      ...UserLanguageFields\n    }\n  }\n": typeof types.CreateUserLanguageDocument,
    "\n  mutation UpdateUserLanguage($input: UpdateUserLanguageInput!) {\n    updateUserLanguage(input: $input) {\n      ...UserLanguageFields\n    }\n  }\n": typeof types.UpdateUserLanguageDocument,
    "\n  mutation DeleteUserLanguages($ids: [ID!]!, $userId: ID!) {\n    deleteUserLanguages(ids: $ids, userId: $userId)\n  }\n": typeof types.DeleteUserLanguagesDocument,
    "\n  fragment PositionFields on Position {\n    id\n    name\n  }\n": typeof types.PositionFieldsFragmentDoc,
    "\n  query Positions(\n    $page: Int!\n    $pageSize: Int!\n    $search: String\n    $sortBy: PositionSortField!\n    $sortOrder: SortOrder!\n  ) {\n    positions(\n      page: $page\n      pageSize: $pageSize\n      sortBy: $sortBy\n      sortOrder: $sortOrder\n      search: $search\n    ) {\n      items {\n        ...PositionFields\n      }\n      page\n      pageSize\n      total\n    }\n  }\n": typeof types.PositionsDocument,
    "\n  mutation CreatePosition($input: CreatePositionInput!) {\n    createPosition(input: $input) {\n      ...PositionFields\n    }\n  }\n": typeof types.CreatePositionDocument,
    "\n  mutation UpdatePosition($input: UpdatePositionInput!) {\n    updatePosition(input: $input) {\n      ...PositionFields\n    }\n  }\n": typeof types.UpdatePositionDocument,
    "\n  mutation DeletePosition($id: ID!) {\n    deletePosition(id: $id)\n  }\n": typeof types.DeletePositionDocument,
    "\n  fragment ProjectFields on Project {\n    id\n    name\n    description\n    domain\n    startDate\n    endDate\n    technologies {\n      id\n      name\n    }\n  }\n": typeof types.ProjectFieldsFragmentDoc,
    "\n  query Projects($search: String, $sortBy: ProjectSortField!, $sortOrder: SortOrder!) {\n    projects(search: $search, sortBy: $sortBy, sortOrder: $sortOrder) {\n      items {\n        ...ProjectFields\n      }\n      total\n    }\n  }\n": typeof types.ProjectsDocument,
    "\n  query Technologies {\n    technologies {\n      id\n      name\n    }\n  }\n": typeof types.TechnologiesDocument,
    "\n  mutation CreateProject($input: CreateProjectInput!) {\n    createProject(input: $input) {\n      ...ProjectFields\n    }\n  }\n": typeof types.CreateProjectDocument,
    "\n  mutation UpdateProject($input: UpdateProjectInput!) {\n    updateProject(input: $input) {\n      ...ProjectFields\n    }\n  }\n": typeof types.UpdateProjectDocument,
    "\n  mutation DeleteProject($id: ID!) {\n    deleteProject(id: $id)\n  }\n": typeof types.DeleteProjectDocument,
    "\n  mutation ChangePassword($input: ChangePasswordInput!) {\n    changePassword(input: $input)\n  }\n": typeof types.ChangePasswordDocument,
    "\n  fragment SkillFields on Skill {\n    id\n    name\n    category {\n      id\n      name\n      type\n    }\n  }\n": typeof types.SkillFieldsFragmentDoc,
    "\n  query Skills(\n    $page: Int!\n    $pageSize: Int!\n    $search: String\n    $sortBy: SkillSortField!\n    $sortOrder: SortOrder!\n  ) {\n    skills(\n      page: $page\n      pageSize: $pageSize\n      search: $search\n      sortBy: $sortBy\n      sortOrder: $sortOrder\n    ) {\n      items {\n        ...SkillFields\n      }\n      page\n      pageSize\n      total\n    }\n  }\n": typeof types.SkillsDocument,
    "\n  query SkillCategories {\n    skillCategories {\n      id\n      name\n      type\n    }\n  }\n": typeof types.SkillCategoriesDocument,
    "\n  mutation CreateSkill($input: CreateSkillInput!) {\n    createSkill(input: $input) {\n      ...SkillFields\n    }\n  }\n": typeof types.CreateSkillDocument,
    "\n  mutation UpdateSkill($input: UpdateSkillInput!) {\n    updateSkill(input: $input) {\n      ...SkillFields\n    }\n  }\n": typeof types.UpdateSkillDocument,
    "\n  mutation DeleteSkill($id: ID!) {\n    deleteSkill(id: $id)\n  }\n": typeof types.DeleteSkillDocument,
    "\n  fragment UserSkillFields on UserSkill {\n    id\n    skill {\n      id\n      name\n      category {\n        id\n        name\n      }\n    }\n    mastery\n  }\n": typeof types.UserSkillFieldsFragmentDoc,
    "\n  query UserSkills($userId: ID!) {\n    userSkills(userId: $userId) {\n      ...UserSkillFields\n    }\n  }\n": typeof types.UserSkillsDocument,
    "\n  query AvailableUserSkills($userId: ID!) {\n    availableUserSkills(userId: $userId) {\n      id\n      name\n    }\n  }\n": typeof types.AvailableUserSkillsDocument,
    "\n  mutation CreateUserSkill($input: CreateUserSkillInput!) {\n    createUserSkill(input: $input) {\n      ...UserSkillFields\n    }\n  }\n": typeof types.CreateUserSkillDocument,
    "\n  mutation UpdateUserSkill($input: UpdateUserSkillInput!) {\n    updateUserSkill(input: $input) {\n      ...UserSkillFields\n    }\n  }\n": typeof types.UpdateUserSkillDocument,
    "\n  mutation DeleteUserSkills($ids: [ID!]!, $userId: ID!) {\n    deleteUserSkills(ids: $ids, userId: $userId)\n  }\n": typeof types.DeleteUserSkillsDocument,
    "\n  fragment UserListFields on User {\n    id\n    email\n    firstName\n    lastName\n    avatarUrl\n    role\n    department {\n      id\n      name\n    }\n    position {\n      id\n      name\n    }\n  }\n": typeof types.UserListFieldsFragmentDoc,
    "\n  query Users(\n    $page: Int!\n    $pageSize: Int!\n    $search: String\n    $sortBy: UserSortField\n    $sortOrder: SortOrder!\n  ) {\n    users(\n      page: $page\n      pageSize: $pageSize\n      sortBy: $sortBy\n      sortOrder: $sortOrder\n      search: $search\n    ) {\n      items {\n        ...UserListFields\n      }\n      page\n      pageSize\n      total\n    }\n  }\n": typeof types.UsersDocument,
    "\n  query User($id: ID!) {\n    user(id: $id) {\n      ...UserListFields\n      createdAt\n      emailVerifiedAt\n    }\n  }\n": typeof types.UserDocument,
    "\n  query UserFormOptions {\n    departmentOptions {\n      id\n      name\n    }\n    positionOptions {\n      id\n      name\n    }\n  }\n": typeof types.UserFormOptionsDocument,
    "\n  mutation CreateUser($input: CreateUserInput!) {\n    createUser(input: $input) {\n      ...UserListFields\n    }\n  }\n": typeof types.CreateUserDocument,
    "\n  mutation UpdateUser($input: UpdateUserInput!) {\n    updateUser(input: $input) {\n      ...UserListFields\n    }\n  }\n": typeof types.UpdateUserDocument,
    "\n  mutation UpdateProfile($input: UpdateProfileInput!) {\n    updateProfile(input: $input) {\n      ...UserListFields\n      createdAt\n      emailVerifiedAt\n    }\n  }\n": typeof types.UpdateProfileDocument,
    "\n  mutation UploadAvatar($userId: ID!, $file: Upload!) {\n    uploadAvatar(userId: $userId, file: $file) {\n      id\n      avatarUrl\n    }\n  }\n": typeof types.UploadAvatarDocument,
    "\n  mutation RemoveAvatar($userId: ID!) {\n    removeAvatar(userId: $userId) {\n      id\n      avatarUrl\n    }\n  }\n": typeof types.RemoveAvatarDocument,
    "\n  mutation DeleteUser($id: ID!) {\n    deleteUser(id: $id)\n  }\n": typeof types.DeleteUserDocument,
};
const documents: Documents = {
    "\n  fragment AuthUserFields on User {\n    id\n    email\n    role\n    emailVerifiedAt\n  }\n": types.AuthUserFieldsFragmentDoc,
    "\n  mutation SignIn($input: SignInInput!) {\n    signIn(input: $input) {\n      ...AuthUserFields\n    }\n  }\n": types.SignInDocument,
    "\n  mutation SignUp($input: SignUpInput!) {\n    signUp(input: $input) {\n      ...AuthUserFields\n    }\n  }\n": types.SignUpDocument,
    "\n  mutation VerifyEmail($input: VerifyEmailInput!) {\n    verifyEmail(input: $input) {\n      ...AuthUserFields\n    }\n  }\n": types.VerifyEmailDocument,
    "\n  mutation ResendVerificationCode {\n    resendVerificationCode\n  }\n": types.ResendVerificationCodeDocument,
    "\n  mutation RequestPasswordReset($input: RequestPasswordResetInput!) {\n    requestPasswordReset(input: $input)\n  }\n": types.RequestPasswordResetDocument,
    "\n  mutation ResetPassword($input: ResetPasswordInput!) {\n    resetPassword(input: $input)\n  }\n": types.ResetPasswordDocument,
    "\n  query Me {\n    me {\n      ...AuthUserFields\n      firstName\n      lastName\n      avatarUrl\n    }\n  }\n": types.MeDocument,
    "\n  mutation Logout {\n    logout\n  }\n": types.LogoutDocument,
    "\n  query BreadcrumbUser($id: ID!) {\n    user(id: $id) {\n      id\n      email\n      firstName\n      lastName\n    }\n  }\n": types.BreadcrumbUserDocument,
    "\n  query BreadcrumbCv($id: ID!) {\n    cv(id: $id) {\n      id\n      name\n    }\n  }\n": types.BreadcrumbCvDocument,
    "\n  fragment CvPdfFields on CvPdf {\n    content\n    fileName\n  }\n": types.CvPdfFieldsFragmentDoc,
    "\n  mutation GenerateCvPdf($input: GenerateCvPdfInput!) {\n    generateCvPdf(input: $input) {\n      ...CvPdfFields\n    }\n  }\n": types.GenerateCvPdfDocument,
    "\n  fragment CvProjectFields on CvProject {\n    id\n    startDate\n    endDate\n    responsibilities\n    roles {\n      id\n      name\n    }\n    project {\n      ...ProjectFields\n    }\n  }\n": types.CvProjectFieldsFragmentDoc,
    "\n  query CvProjects(\n    $cvId: ID!\n    $search: String\n    $sortBy: CvProjectSortField!\n    $sortOrder: SortOrder!\n  ) {\n    cvProjects(cvId: $cvId, search: $search, sortBy: $sortBy, sortOrder: $sortOrder) {\n      items {\n        ...CvProjectFields\n      }\n      total\n    }\n  }\n": types.CvProjectsDocument,
    "\n  query AvailableCvProjects($cvId: ID!) {\n    availableCvProjects(cvId: $cvId) {\n      ...ProjectFields\n    }\n  }\n": types.AvailableCvProjectsDocument,
    "\n  query ProjectRoles {\n    projectRoles {\n      id\n      name\n    }\n  }\n": types.ProjectRolesDocument,
    "\n  mutation CreateCvProject($input: CreateCvProjectInput!) {\n    createCvProject(input: $input) {\n      ...CvProjectFields\n    }\n  }\n": types.CreateCvProjectDocument,
    "\n  mutation UpdateCvProject($input: UpdateCvProjectInput!) {\n    updateCvProject(input: $input) {\n      ...CvProjectFields\n    }\n  }\n": types.UpdateCvProjectDocument,
    "\n  mutation DeleteCvProject($id: ID!, $cvId: ID!) {\n    deleteCvProject(id: $id, cvId: $cvId)\n  }\n": types.DeleteCvProjectDocument,
    "\n  fragment CvSkillFields on CvSkill {\n    id\n    skill {\n      id\n      name\n      category {\n        id\n        name\n      }\n    }\n    mastery\n  }\n": types.CvSkillFieldsFragmentDoc,
    "\n  query CvSkills($cvId: ID!) {\n    cvSkills(cvId: $cvId) {\n      ...CvSkillFields\n    }\n  }\n": types.CvSkillsDocument,
    "\n  query AvailableCvSkills($cvId: ID!) {\n    availableCvSkills(cvId: $cvId) {\n      id\n      name\n    }\n  }\n": types.AvailableCvSkillsDocument,
    "\n  mutation CreateCvSkill($input: CreateCvSkillInput!) {\n    createCvSkill(input: $input) {\n      ...CvSkillFields\n    }\n  }\n": types.CreateCvSkillDocument,
    "\n  mutation UpdateCvSkill($input: UpdateCvSkillInput!) {\n    updateCvSkill(input: $input) {\n      ...CvSkillFields\n    }\n  }\n": types.UpdateCvSkillDocument,
    "\n  mutation DeleteCvSkills($cvId: ID!, $ids: [ID!]!) {\n    deleteCvSkills(cvId: $cvId, ids: $ids)\n  }\n": types.DeleteCvSkillsDocument,
    "\n  fragment CvFields on Cv {\n    id\n    name\n    description\n    education\n    user {\n      id\n      email\n    }\n  }\n": types.CvFieldsFragmentDoc,
    "\n  query Cvs(\n    $page: Int!\n    $pageSize: Int!\n    $search: String\n    $sortBy: CvSortField!\n    $sortOrder: SortOrder!\n  ) {\n    cvs(page: $page, pageSize: $pageSize, search: $search, sortBy: $sortBy, sortOrder: $sortOrder) {\n      items {\n        ...CvFields\n      }\n      page\n      pageSize\n      total\n    }\n  }\n": types.CvsDocument,
    "\n  query CvPreview($id: ID!) {\n    cvPreview(id: $id) {\n      id\n      name\n      education\n      description\n      domains\n      user {\n        id\n        email\n        firstName\n        lastName\n        position {\n          id\n          name\n        }\n      }\n      languages {\n        id\n        proficiency\n        language {\n          id\n          name\n        }\n      }\n      skillGroups {\n        category {\n          id\n          name\n        }\n        skills {\n          experienceYears\n          lastUsedYear\n          skill {\n            id\n            name\n          }\n        }\n      }\n      projects {\n        ...CvProjectFields\n      }\n    }\n  }\n": types.CvPreviewDocument,
    "\n  query UserCvs(\n    $page: Int!\n    $pageSize: Int!\n    $search: String\n    $sortBy: CvSortField!\n    $sortOrder: SortOrder!\n    $userId: ID!\n  ) {\n    userCvs(\n      page: $page\n      pageSize: $pageSize\n      search: $search\n      sortBy: $sortBy\n      sortOrder: $sortOrder\n      userId: $userId\n    ) {\n      items {\n        ...CvFields\n      }\n      page\n      pageSize\n      total\n    }\n  }\n": types.UserCvsDocument,
    "\n  query Cv($id: ID!) {\n    cv(id: $id) {\n      ...CvFields\n    }\n  }\n": types.CvDocument,
    "\n  mutation CreateCv($input: CreateCvInput!) {\n    createCv(input: $input) {\n      ...CvFields\n    }\n  }\n": types.CreateCvDocument,
    "\n  mutation UpdateCv($input: UpdateCvInput!) {\n    updateCv(input: $input) {\n      ...CvFields\n    }\n  }\n": types.UpdateCvDocument,
    "\n  mutation DeleteCv($id: ID!, $userId: ID!) {\n    deleteCv(id: $id, userId: $userId)\n  }\n": types.DeleteCvDocument,
    "\n  fragment DepartmentFields on Department {\n    id\n    name\n  }\n": types.DepartmentFieldsFragmentDoc,
    "\n  query Departments(\n    $page: Int!\n    $pageSize: Int!\n    $search: String\n    $sortBy: DepartmentSortField!\n    $sortOrder: SortOrder!\n  ) {\n    departments(\n      page: $page\n      pageSize: $pageSize\n      sortBy: $sortBy\n      sortOrder: $sortOrder\n      search: $search\n    ) {\n      items {\n        ...DepartmentFields\n      }\n      page\n      pageSize\n      total\n    }\n  }\n": types.DepartmentsDocument,
    "\n  mutation CreateDepartment($input: CreateDepartmentInput!) {\n    createDepartment(input: $input) {\n      ...DepartmentFields\n    }\n  }\n": types.CreateDepartmentDocument,
    "\n  mutation UpdateDepartment($input: UpdateDepartmentInput!) {\n    updateDepartment(input: $input) {\n      ...DepartmentFields\n    }\n  }\n": types.UpdateDepartmentDocument,
    "\n  mutation DeleteDepartment($id: ID!) {\n    deleteDepartment(id: $id)\n  }\n": types.DeleteDepartmentDocument,
    "\n  fragment LanguageFields on Language {\n    id\n    name\n    iso\n    nativeName\n  }\n": types.LanguageFieldsFragmentDoc,
    "\n  query Languages(\n    $page: Int!\n    $pageSize: Int!\n    $search: String\n    $sortBy: LanguageSortField!\n    $sortOrder: SortOrder!\n  ) {\n    languages(\n      page: $page\n      pageSize: $pageSize\n      search: $search\n      sortBy: $sortBy\n      sortOrder: $sortOrder\n    ) {\n      items {\n        ...LanguageFields\n      }\n      page\n      pageSize\n      total\n    }\n  }\n": types.LanguagesDocument,
    "\n  mutation CreateLanguage($input: CreateLanguageInput!) {\n    createLanguage(input: $input) {\n      ...LanguageFields\n    }\n  }\n": types.CreateLanguageDocument,
    "\n  mutation UpdateLanguage($input: UpdateLanguageInput!) {\n    updateLanguage(input: $input) {\n      ...LanguageFields\n    }\n  }\n": types.UpdateLanguageDocument,
    "\n  mutation DeleteLanguage($id: ID!) {\n    deleteLanguage(id: $id)\n  }\n": types.DeleteLanguageDocument,
    "\n  fragment UserLanguageFields on UserLanguage {\n    id\n    language {\n      id\n      name\n    }\n    proficiency\n  }\n": types.UserLanguageFieldsFragmentDoc,
    "\n  query UserLanguages($userId: ID!) {\n    userLanguages(userId: $userId) {\n      ...UserLanguageFields\n    }\n  }\n": types.UserLanguagesDocument,
    "\n  query AvailableUserLanguages($userId: ID!) {\n    availableUserLanguages(userId: $userId) {\n      id\n      name\n    }\n  }\n": types.AvailableUserLanguagesDocument,
    "\n  mutation CreateUserLanguage($input: CreateUserLanguageInput!) {\n    createUserLanguage(input: $input) {\n      ...UserLanguageFields\n    }\n  }\n": types.CreateUserLanguageDocument,
    "\n  mutation UpdateUserLanguage($input: UpdateUserLanguageInput!) {\n    updateUserLanguage(input: $input) {\n      ...UserLanguageFields\n    }\n  }\n": types.UpdateUserLanguageDocument,
    "\n  mutation DeleteUserLanguages($ids: [ID!]!, $userId: ID!) {\n    deleteUserLanguages(ids: $ids, userId: $userId)\n  }\n": types.DeleteUserLanguagesDocument,
    "\n  fragment PositionFields on Position {\n    id\n    name\n  }\n": types.PositionFieldsFragmentDoc,
    "\n  query Positions(\n    $page: Int!\n    $pageSize: Int!\n    $search: String\n    $sortBy: PositionSortField!\n    $sortOrder: SortOrder!\n  ) {\n    positions(\n      page: $page\n      pageSize: $pageSize\n      sortBy: $sortBy\n      sortOrder: $sortOrder\n      search: $search\n    ) {\n      items {\n        ...PositionFields\n      }\n      page\n      pageSize\n      total\n    }\n  }\n": types.PositionsDocument,
    "\n  mutation CreatePosition($input: CreatePositionInput!) {\n    createPosition(input: $input) {\n      ...PositionFields\n    }\n  }\n": types.CreatePositionDocument,
    "\n  mutation UpdatePosition($input: UpdatePositionInput!) {\n    updatePosition(input: $input) {\n      ...PositionFields\n    }\n  }\n": types.UpdatePositionDocument,
    "\n  mutation DeletePosition($id: ID!) {\n    deletePosition(id: $id)\n  }\n": types.DeletePositionDocument,
    "\n  fragment ProjectFields on Project {\n    id\n    name\n    description\n    domain\n    startDate\n    endDate\n    technologies {\n      id\n      name\n    }\n  }\n": types.ProjectFieldsFragmentDoc,
    "\n  query Projects($search: String, $sortBy: ProjectSortField!, $sortOrder: SortOrder!) {\n    projects(search: $search, sortBy: $sortBy, sortOrder: $sortOrder) {\n      items {\n        ...ProjectFields\n      }\n      total\n    }\n  }\n": types.ProjectsDocument,
    "\n  query Technologies {\n    technologies {\n      id\n      name\n    }\n  }\n": types.TechnologiesDocument,
    "\n  mutation CreateProject($input: CreateProjectInput!) {\n    createProject(input: $input) {\n      ...ProjectFields\n    }\n  }\n": types.CreateProjectDocument,
    "\n  mutation UpdateProject($input: UpdateProjectInput!) {\n    updateProject(input: $input) {\n      ...ProjectFields\n    }\n  }\n": types.UpdateProjectDocument,
    "\n  mutation DeleteProject($id: ID!) {\n    deleteProject(id: $id)\n  }\n": types.DeleteProjectDocument,
    "\n  mutation ChangePassword($input: ChangePasswordInput!) {\n    changePassword(input: $input)\n  }\n": types.ChangePasswordDocument,
    "\n  fragment SkillFields on Skill {\n    id\n    name\n    category {\n      id\n      name\n      type\n    }\n  }\n": types.SkillFieldsFragmentDoc,
    "\n  query Skills(\n    $page: Int!\n    $pageSize: Int!\n    $search: String\n    $sortBy: SkillSortField!\n    $sortOrder: SortOrder!\n  ) {\n    skills(\n      page: $page\n      pageSize: $pageSize\n      search: $search\n      sortBy: $sortBy\n      sortOrder: $sortOrder\n    ) {\n      items {\n        ...SkillFields\n      }\n      page\n      pageSize\n      total\n    }\n  }\n": types.SkillsDocument,
    "\n  query SkillCategories {\n    skillCategories {\n      id\n      name\n      type\n    }\n  }\n": types.SkillCategoriesDocument,
    "\n  mutation CreateSkill($input: CreateSkillInput!) {\n    createSkill(input: $input) {\n      ...SkillFields\n    }\n  }\n": types.CreateSkillDocument,
    "\n  mutation UpdateSkill($input: UpdateSkillInput!) {\n    updateSkill(input: $input) {\n      ...SkillFields\n    }\n  }\n": types.UpdateSkillDocument,
    "\n  mutation DeleteSkill($id: ID!) {\n    deleteSkill(id: $id)\n  }\n": types.DeleteSkillDocument,
    "\n  fragment UserSkillFields on UserSkill {\n    id\n    skill {\n      id\n      name\n      category {\n        id\n        name\n      }\n    }\n    mastery\n  }\n": types.UserSkillFieldsFragmentDoc,
    "\n  query UserSkills($userId: ID!) {\n    userSkills(userId: $userId) {\n      ...UserSkillFields\n    }\n  }\n": types.UserSkillsDocument,
    "\n  query AvailableUserSkills($userId: ID!) {\n    availableUserSkills(userId: $userId) {\n      id\n      name\n    }\n  }\n": types.AvailableUserSkillsDocument,
    "\n  mutation CreateUserSkill($input: CreateUserSkillInput!) {\n    createUserSkill(input: $input) {\n      ...UserSkillFields\n    }\n  }\n": types.CreateUserSkillDocument,
    "\n  mutation UpdateUserSkill($input: UpdateUserSkillInput!) {\n    updateUserSkill(input: $input) {\n      ...UserSkillFields\n    }\n  }\n": types.UpdateUserSkillDocument,
    "\n  mutation DeleteUserSkills($ids: [ID!]!, $userId: ID!) {\n    deleteUserSkills(ids: $ids, userId: $userId)\n  }\n": types.DeleteUserSkillsDocument,
    "\n  fragment UserListFields on User {\n    id\n    email\n    firstName\n    lastName\n    avatarUrl\n    role\n    department {\n      id\n      name\n    }\n    position {\n      id\n      name\n    }\n  }\n": types.UserListFieldsFragmentDoc,
    "\n  query Users(\n    $page: Int!\n    $pageSize: Int!\n    $search: String\n    $sortBy: UserSortField\n    $sortOrder: SortOrder!\n  ) {\n    users(\n      page: $page\n      pageSize: $pageSize\n      sortBy: $sortBy\n      sortOrder: $sortOrder\n      search: $search\n    ) {\n      items {\n        ...UserListFields\n      }\n      page\n      pageSize\n      total\n    }\n  }\n": types.UsersDocument,
    "\n  query User($id: ID!) {\n    user(id: $id) {\n      ...UserListFields\n      createdAt\n      emailVerifiedAt\n    }\n  }\n": types.UserDocument,
    "\n  query UserFormOptions {\n    departmentOptions {\n      id\n      name\n    }\n    positionOptions {\n      id\n      name\n    }\n  }\n": types.UserFormOptionsDocument,
    "\n  mutation CreateUser($input: CreateUserInput!) {\n    createUser(input: $input) {\n      ...UserListFields\n    }\n  }\n": types.CreateUserDocument,
    "\n  mutation UpdateUser($input: UpdateUserInput!) {\n    updateUser(input: $input) {\n      ...UserListFields\n    }\n  }\n": types.UpdateUserDocument,
    "\n  mutation UpdateProfile($input: UpdateProfileInput!) {\n    updateProfile(input: $input) {\n      ...UserListFields\n      createdAt\n      emailVerifiedAt\n    }\n  }\n": types.UpdateProfileDocument,
    "\n  mutation UploadAvatar($userId: ID!, $file: Upload!) {\n    uploadAvatar(userId: $userId, file: $file) {\n      id\n      avatarUrl\n    }\n  }\n": types.UploadAvatarDocument,
    "\n  mutation RemoveAvatar($userId: ID!) {\n    removeAvatar(userId: $userId) {\n      id\n      avatarUrl\n    }\n  }\n": types.RemoveAvatarDocument,
    "\n  mutation DeleteUser($id: ID!) {\n    deleteUser(id: $id)\n  }\n": types.DeleteUserDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment AuthUserFields on User {\n    id\n    email\n    role\n    emailVerifiedAt\n  }\n"): (typeof documents)["\n  fragment AuthUserFields on User {\n    id\n    email\n    role\n    emailVerifiedAt\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SignIn($input: SignInInput!) {\n    signIn(input: $input) {\n      ...AuthUserFields\n    }\n  }\n"): (typeof documents)["\n  mutation SignIn($input: SignInInput!) {\n    signIn(input: $input) {\n      ...AuthUserFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SignUp($input: SignUpInput!) {\n    signUp(input: $input) {\n      ...AuthUserFields\n    }\n  }\n"): (typeof documents)["\n  mutation SignUp($input: SignUpInput!) {\n    signUp(input: $input) {\n      ...AuthUserFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation VerifyEmail($input: VerifyEmailInput!) {\n    verifyEmail(input: $input) {\n      ...AuthUserFields\n    }\n  }\n"): (typeof documents)["\n  mutation VerifyEmail($input: VerifyEmailInput!) {\n    verifyEmail(input: $input) {\n      ...AuthUserFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ResendVerificationCode {\n    resendVerificationCode\n  }\n"): (typeof documents)["\n  mutation ResendVerificationCode {\n    resendVerificationCode\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RequestPasswordReset($input: RequestPasswordResetInput!) {\n    requestPasswordReset(input: $input)\n  }\n"): (typeof documents)["\n  mutation RequestPasswordReset($input: RequestPasswordResetInput!) {\n    requestPasswordReset(input: $input)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ResetPassword($input: ResetPasswordInput!) {\n    resetPassword(input: $input)\n  }\n"): (typeof documents)["\n  mutation ResetPassword($input: ResetPasswordInput!) {\n    resetPassword(input: $input)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Me {\n    me {\n      ...AuthUserFields\n      firstName\n      lastName\n      avatarUrl\n    }\n  }\n"): (typeof documents)["\n  query Me {\n    me {\n      ...AuthUserFields\n      firstName\n      lastName\n      avatarUrl\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation Logout {\n    logout\n  }\n"): (typeof documents)["\n  mutation Logout {\n    logout\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query BreadcrumbUser($id: ID!) {\n    user(id: $id) {\n      id\n      email\n      firstName\n      lastName\n    }\n  }\n"): (typeof documents)["\n  query BreadcrumbUser($id: ID!) {\n    user(id: $id) {\n      id\n      email\n      firstName\n      lastName\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query BreadcrumbCv($id: ID!) {\n    cv(id: $id) {\n      id\n      name\n    }\n  }\n"): (typeof documents)["\n  query BreadcrumbCv($id: ID!) {\n    cv(id: $id) {\n      id\n      name\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment CvPdfFields on CvPdf {\n    content\n    fileName\n  }\n"): (typeof documents)["\n  fragment CvPdfFields on CvPdf {\n    content\n    fileName\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation GenerateCvPdf($input: GenerateCvPdfInput!) {\n    generateCvPdf(input: $input) {\n      ...CvPdfFields\n    }\n  }\n"): (typeof documents)["\n  mutation GenerateCvPdf($input: GenerateCvPdfInput!) {\n    generateCvPdf(input: $input) {\n      ...CvPdfFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment CvProjectFields on CvProject {\n    id\n    startDate\n    endDate\n    responsibilities\n    roles {\n      id\n      name\n    }\n    project {\n      ...ProjectFields\n    }\n  }\n"): (typeof documents)["\n  fragment CvProjectFields on CvProject {\n    id\n    startDate\n    endDate\n    responsibilities\n    roles {\n      id\n      name\n    }\n    project {\n      ...ProjectFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query CvProjects(\n    $cvId: ID!\n    $search: String\n    $sortBy: CvProjectSortField!\n    $sortOrder: SortOrder!\n  ) {\n    cvProjects(cvId: $cvId, search: $search, sortBy: $sortBy, sortOrder: $sortOrder) {\n      items {\n        ...CvProjectFields\n      }\n      total\n    }\n  }\n"): (typeof documents)["\n  query CvProjects(\n    $cvId: ID!\n    $search: String\n    $sortBy: CvProjectSortField!\n    $sortOrder: SortOrder!\n  ) {\n    cvProjects(cvId: $cvId, search: $search, sortBy: $sortBy, sortOrder: $sortOrder) {\n      items {\n        ...CvProjectFields\n      }\n      total\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AvailableCvProjects($cvId: ID!) {\n    availableCvProjects(cvId: $cvId) {\n      ...ProjectFields\n    }\n  }\n"): (typeof documents)["\n  query AvailableCvProjects($cvId: ID!) {\n    availableCvProjects(cvId: $cvId) {\n      ...ProjectFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProjectRoles {\n    projectRoles {\n      id\n      name\n    }\n  }\n"): (typeof documents)["\n  query ProjectRoles {\n    projectRoles {\n      id\n      name\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateCvProject($input: CreateCvProjectInput!) {\n    createCvProject(input: $input) {\n      ...CvProjectFields\n    }\n  }\n"): (typeof documents)["\n  mutation CreateCvProject($input: CreateCvProjectInput!) {\n    createCvProject(input: $input) {\n      ...CvProjectFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateCvProject($input: UpdateCvProjectInput!) {\n    updateCvProject(input: $input) {\n      ...CvProjectFields\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateCvProject($input: UpdateCvProjectInput!) {\n    updateCvProject(input: $input) {\n      ...CvProjectFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteCvProject($id: ID!, $cvId: ID!) {\n    deleteCvProject(id: $id, cvId: $cvId)\n  }\n"): (typeof documents)["\n  mutation DeleteCvProject($id: ID!, $cvId: ID!) {\n    deleteCvProject(id: $id, cvId: $cvId)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment CvSkillFields on CvSkill {\n    id\n    skill {\n      id\n      name\n      category {\n        id\n        name\n      }\n    }\n    mastery\n  }\n"): (typeof documents)["\n  fragment CvSkillFields on CvSkill {\n    id\n    skill {\n      id\n      name\n      category {\n        id\n        name\n      }\n    }\n    mastery\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query CvSkills($cvId: ID!) {\n    cvSkills(cvId: $cvId) {\n      ...CvSkillFields\n    }\n  }\n"): (typeof documents)["\n  query CvSkills($cvId: ID!) {\n    cvSkills(cvId: $cvId) {\n      ...CvSkillFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AvailableCvSkills($cvId: ID!) {\n    availableCvSkills(cvId: $cvId) {\n      id\n      name\n    }\n  }\n"): (typeof documents)["\n  query AvailableCvSkills($cvId: ID!) {\n    availableCvSkills(cvId: $cvId) {\n      id\n      name\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateCvSkill($input: CreateCvSkillInput!) {\n    createCvSkill(input: $input) {\n      ...CvSkillFields\n    }\n  }\n"): (typeof documents)["\n  mutation CreateCvSkill($input: CreateCvSkillInput!) {\n    createCvSkill(input: $input) {\n      ...CvSkillFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateCvSkill($input: UpdateCvSkillInput!) {\n    updateCvSkill(input: $input) {\n      ...CvSkillFields\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateCvSkill($input: UpdateCvSkillInput!) {\n    updateCvSkill(input: $input) {\n      ...CvSkillFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteCvSkills($cvId: ID!, $ids: [ID!]!) {\n    deleteCvSkills(cvId: $cvId, ids: $ids)\n  }\n"): (typeof documents)["\n  mutation DeleteCvSkills($cvId: ID!, $ids: [ID!]!) {\n    deleteCvSkills(cvId: $cvId, ids: $ids)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment CvFields on Cv {\n    id\n    name\n    description\n    education\n    user {\n      id\n      email\n    }\n  }\n"): (typeof documents)["\n  fragment CvFields on Cv {\n    id\n    name\n    description\n    education\n    user {\n      id\n      email\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Cvs(\n    $page: Int!\n    $pageSize: Int!\n    $search: String\n    $sortBy: CvSortField!\n    $sortOrder: SortOrder!\n  ) {\n    cvs(page: $page, pageSize: $pageSize, search: $search, sortBy: $sortBy, sortOrder: $sortOrder) {\n      items {\n        ...CvFields\n      }\n      page\n      pageSize\n      total\n    }\n  }\n"): (typeof documents)["\n  query Cvs(\n    $page: Int!\n    $pageSize: Int!\n    $search: String\n    $sortBy: CvSortField!\n    $sortOrder: SortOrder!\n  ) {\n    cvs(page: $page, pageSize: $pageSize, search: $search, sortBy: $sortBy, sortOrder: $sortOrder) {\n      items {\n        ...CvFields\n      }\n      page\n      pageSize\n      total\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query CvPreview($id: ID!) {\n    cvPreview(id: $id) {\n      id\n      name\n      education\n      description\n      domains\n      user {\n        id\n        email\n        firstName\n        lastName\n        position {\n          id\n          name\n        }\n      }\n      languages {\n        id\n        proficiency\n        language {\n          id\n          name\n        }\n      }\n      skillGroups {\n        category {\n          id\n          name\n        }\n        skills {\n          experienceYears\n          lastUsedYear\n          skill {\n            id\n            name\n          }\n        }\n      }\n      projects {\n        ...CvProjectFields\n      }\n    }\n  }\n"): (typeof documents)["\n  query CvPreview($id: ID!) {\n    cvPreview(id: $id) {\n      id\n      name\n      education\n      description\n      domains\n      user {\n        id\n        email\n        firstName\n        lastName\n        position {\n          id\n          name\n        }\n      }\n      languages {\n        id\n        proficiency\n        language {\n          id\n          name\n        }\n      }\n      skillGroups {\n        category {\n          id\n          name\n        }\n        skills {\n          experienceYears\n          lastUsedYear\n          skill {\n            id\n            name\n          }\n        }\n      }\n      projects {\n        ...CvProjectFields\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query UserCvs(\n    $page: Int!\n    $pageSize: Int!\n    $search: String\n    $sortBy: CvSortField!\n    $sortOrder: SortOrder!\n    $userId: ID!\n  ) {\n    userCvs(\n      page: $page\n      pageSize: $pageSize\n      search: $search\n      sortBy: $sortBy\n      sortOrder: $sortOrder\n      userId: $userId\n    ) {\n      items {\n        ...CvFields\n      }\n      page\n      pageSize\n      total\n    }\n  }\n"): (typeof documents)["\n  query UserCvs(\n    $page: Int!\n    $pageSize: Int!\n    $search: String\n    $sortBy: CvSortField!\n    $sortOrder: SortOrder!\n    $userId: ID!\n  ) {\n    userCvs(\n      page: $page\n      pageSize: $pageSize\n      search: $search\n      sortBy: $sortBy\n      sortOrder: $sortOrder\n      userId: $userId\n    ) {\n      items {\n        ...CvFields\n      }\n      page\n      pageSize\n      total\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Cv($id: ID!) {\n    cv(id: $id) {\n      ...CvFields\n    }\n  }\n"): (typeof documents)["\n  query Cv($id: ID!) {\n    cv(id: $id) {\n      ...CvFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateCv($input: CreateCvInput!) {\n    createCv(input: $input) {\n      ...CvFields\n    }\n  }\n"): (typeof documents)["\n  mutation CreateCv($input: CreateCvInput!) {\n    createCv(input: $input) {\n      ...CvFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateCv($input: UpdateCvInput!) {\n    updateCv(input: $input) {\n      ...CvFields\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateCv($input: UpdateCvInput!) {\n    updateCv(input: $input) {\n      ...CvFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteCv($id: ID!, $userId: ID!) {\n    deleteCv(id: $id, userId: $userId)\n  }\n"): (typeof documents)["\n  mutation DeleteCv($id: ID!, $userId: ID!) {\n    deleteCv(id: $id, userId: $userId)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment DepartmentFields on Department {\n    id\n    name\n  }\n"): (typeof documents)["\n  fragment DepartmentFields on Department {\n    id\n    name\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Departments(\n    $page: Int!\n    $pageSize: Int!\n    $search: String\n    $sortBy: DepartmentSortField!\n    $sortOrder: SortOrder!\n  ) {\n    departments(\n      page: $page\n      pageSize: $pageSize\n      sortBy: $sortBy\n      sortOrder: $sortOrder\n      search: $search\n    ) {\n      items {\n        ...DepartmentFields\n      }\n      page\n      pageSize\n      total\n    }\n  }\n"): (typeof documents)["\n  query Departments(\n    $page: Int!\n    $pageSize: Int!\n    $search: String\n    $sortBy: DepartmentSortField!\n    $sortOrder: SortOrder!\n  ) {\n    departments(\n      page: $page\n      pageSize: $pageSize\n      sortBy: $sortBy\n      sortOrder: $sortOrder\n      search: $search\n    ) {\n      items {\n        ...DepartmentFields\n      }\n      page\n      pageSize\n      total\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateDepartment($input: CreateDepartmentInput!) {\n    createDepartment(input: $input) {\n      ...DepartmentFields\n    }\n  }\n"): (typeof documents)["\n  mutation CreateDepartment($input: CreateDepartmentInput!) {\n    createDepartment(input: $input) {\n      ...DepartmentFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateDepartment($input: UpdateDepartmentInput!) {\n    updateDepartment(input: $input) {\n      ...DepartmentFields\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateDepartment($input: UpdateDepartmentInput!) {\n    updateDepartment(input: $input) {\n      ...DepartmentFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteDepartment($id: ID!) {\n    deleteDepartment(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteDepartment($id: ID!) {\n    deleteDepartment(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment LanguageFields on Language {\n    id\n    name\n    iso\n    nativeName\n  }\n"): (typeof documents)["\n  fragment LanguageFields on Language {\n    id\n    name\n    iso\n    nativeName\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Languages(\n    $page: Int!\n    $pageSize: Int!\n    $search: String\n    $sortBy: LanguageSortField!\n    $sortOrder: SortOrder!\n  ) {\n    languages(\n      page: $page\n      pageSize: $pageSize\n      search: $search\n      sortBy: $sortBy\n      sortOrder: $sortOrder\n    ) {\n      items {\n        ...LanguageFields\n      }\n      page\n      pageSize\n      total\n    }\n  }\n"): (typeof documents)["\n  query Languages(\n    $page: Int!\n    $pageSize: Int!\n    $search: String\n    $sortBy: LanguageSortField!\n    $sortOrder: SortOrder!\n  ) {\n    languages(\n      page: $page\n      pageSize: $pageSize\n      search: $search\n      sortBy: $sortBy\n      sortOrder: $sortOrder\n    ) {\n      items {\n        ...LanguageFields\n      }\n      page\n      pageSize\n      total\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateLanguage($input: CreateLanguageInput!) {\n    createLanguage(input: $input) {\n      ...LanguageFields\n    }\n  }\n"): (typeof documents)["\n  mutation CreateLanguage($input: CreateLanguageInput!) {\n    createLanguage(input: $input) {\n      ...LanguageFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateLanguage($input: UpdateLanguageInput!) {\n    updateLanguage(input: $input) {\n      ...LanguageFields\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateLanguage($input: UpdateLanguageInput!) {\n    updateLanguage(input: $input) {\n      ...LanguageFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteLanguage($id: ID!) {\n    deleteLanguage(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteLanguage($id: ID!) {\n    deleteLanguage(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment UserLanguageFields on UserLanguage {\n    id\n    language {\n      id\n      name\n    }\n    proficiency\n  }\n"): (typeof documents)["\n  fragment UserLanguageFields on UserLanguage {\n    id\n    language {\n      id\n      name\n    }\n    proficiency\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query UserLanguages($userId: ID!) {\n    userLanguages(userId: $userId) {\n      ...UserLanguageFields\n    }\n  }\n"): (typeof documents)["\n  query UserLanguages($userId: ID!) {\n    userLanguages(userId: $userId) {\n      ...UserLanguageFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AvailableUserLanguages($userId: ID!) {\n    availableUserLanguages(userId: $userId) {\n      id\n      name\n    }\n  }\n"): (typeof documents)["\n  query AvailableUserLanguages($userId: ID!) {\n    availableUserLanguages(userId: $userId) {\n      id\n      name\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateUserLanguage($input: CreateUserLanguageInput!) {\n    createUserLanguage(input: $input) {\n      ...UserLanguageFields\n    }\n  }\n"): (typeof documents)["\n  mutation CreateUserLanguage($input: CreateUserLanguageInput!) {\n    createUserLanguage(input: $input) {\n      ...UserLanguageFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateUserLanguage($input: UpdateUserLanguageInput!) {\n    updateUserLanguage(input: $input) {\n      ...UserLanguageFields\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateUserLanguage($input: UpdateUserLanguageInput!) {\n    updateUserLanguage(input: $input) {\n      ...UserLanguageFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteUserLanguages($ids: [ID!]!, $userId: ID!) {\n    deleteUserLanguages(ids: $ids, userId: $userId)\n  }\n"): (typeof documents)["\n  mutation DeleteUserLanguages($ids: [ID!]!, $userId: ID!) {\n    deleteUserLanguages(ids: $ids, userId: $userId)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment PositionFields on Position {\n    id\n    name\n  }\n"): (typeof documents)["\n  fragment PositionFields on Position {\n    id\n    name\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Positions(\n    $page: Int!\n    $pageSize: Int!\n    $search: String\n    $sortBy: PositionSortField!\n    $sortOrder: SortOrder!\n  ) {\n    positions(\n      page: $page\n      pageSize: $pageSize\n      sortBy: $sortBy\n      sortOrder: $sortOrder\n      search: $search\n    ) {\n      items {\n        ...PositionFields\n      }\n      page\n      pageSize\n      total\n    }\n  }\n"): (typeof documents)["\n  query Positions(\n    $page: Int!\n    $pageSize: Int!\n    $search: String\n    $sortBy: PositionSortField!\n    $sortOrder: SortOrder!\n  ) {\n    positions(\n      page: $page\n      pageSize: $pageSize\n      sortBy: $sortBy\n      sortOrder: $sortOrder\n      search: $search\n    ) {\n      items {\n        ...PositionFields\n      }\n      page\n      pageSize\n      total\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreatePosition($input: CreatePositionInput!) {\n    createPosition(input: $input) {\n      ...PositionFields\n    }\n  }\n"): (typeof documents)["\n  mutation CreatePosition($input: CreatePositionInput!) {\n    createPosition(input: $input) {\n      ...PositionFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdatePosition($input: UpdatePositionInput!) {\n    updatePosition(input: $input) {\n      ...PositionFields\n    }\n  }\n"): (typeof documents)["\n  mutation UpdatePosition($input: UpdatePositionInput!) {\n    updatePosition(input: $input) {\n      ...PositionFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeletePosition($id: ID!) {\n    deletePosition(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeletePosition($id: ID!) {\n    deletePosition(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProjectFields on Project {\n    id\n    name\n    description\n    domain\n    startDate\n    endDate\n    technologies {\n      id\n      name\n    }\n  }\n"): (typeof documents)["\n  fragment ProjectFields on Project {\n    id\n    name\n    description\n    domain\n    startDate\n    endDate\n    technologies {\n      id\n      name\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Projects($search: String, $sortBy: ProjectSortField!, $sortOrder: SortOrder!) {\n    projects(search: $search, sortBy: $sortBy, sortOrder: $sortOrder) {\n      items {\n        ...ProjectFields\n      }\n      total\n    }\n  }\n"): (typeof documents)["\n  query Projects($search: String, $sortBy: ProjectSortField!, $sortOrder: SortOrder!) {\n    projects(search: $search, sortBy: $sortBy, sortOrder: $sortOrder) {\n      items {\n        ...ProjectFields\n      }\n      total\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Technologies {\n    technologies {\n      id\n      name\n    }\n  }\n"): (typeof documents)["\n  query Technologies {\n    technologies {\n      id\n      name\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateProject($input: CreateProjectInput!) {\n    createProject(input: $input) {\n      ...ProjectFields\n    }\n  }\n"): (typeof documents)["\n  mutation CreateProject($input: CreateProjectInput!) {\n    createProject(input: $input) {\n      ...ProjectFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateProject($input: UpdateProjectInput!) {\n    updateProject(input: $input) {\n      ...ProjectFields\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateProject($input: UpdateProjectInput!) {\n    updateProject(input: $input) {\n      ...ProjectFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteProject($id: ID!) {\n    deleteProject(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteProject($id: ID!) {\n    deleteProject(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation ChangePassword($input: ChangePasswordInput!) {\n    changePassword(input: $input)\n  }\n"): (typeof documents)["\n  mutation ChangePassword($input: ChangePasswordInput!) {\n    changePassword(input: $input)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment SkillFields on Skill {\n    id\n    name\n    category {\n      id\n      name\n      type\n    }\n  }\n"): (typeof documents)["\n  fragment SkillFields on Skill {\n    id\n    name\n    category {\n      id\n      name\n      type\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Skills(\n    $page: Int!\n    $pageSize: Int!\n    $search: String\n    $sortBy: SkillSortField!\n    $sortOrder: SortOrder!\n  ) {\n    skills(\n      page: $page\n      pageSize: $pageSize\n      search: $search\n      sortBy: $sortBy\n      sortOrder: $sortOrder\n    ) {\n      items {\n        ...SkillFields\n      }\n      page\n      pageSize\n      total\n    }\n  }\n"): (typeof documents)["\n  query Skills(\n    $page: Int!\n    $pageSize: Int!\n    $search: String\n    $sortBy: SkillSortField!\n    $sortOrder: SortOrder!\n  ) {\n    skills(\n      page: $page\n      pageSize: $pageSize\n      search: $search\n      sortBy: $sortBy\n      sortOrder: $sortOrder\n    ) {\n      items {\n        ...SkillFields\n      }\n      page\n      pageSize\n      total\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query SkillCategories {\n    skillCategories {\n      id\n      name\n      type\n    }\n  }\n"): (typeof documents)["\n  query SkillCategories {\n    skillCategories {\n      id\n      name\n      type\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateSkill($input: CreateSkillInput!) {\n    createSkill(input: $input) {\n      ...SkillFields\n    }\n  }\n"): (typeof documents)["\n  mutation CreateSkill($input: CreateSkillInput!) {\n    createSkill(input: $input) {\n      ...SkillFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateSkill($input: UpdateSkillInput!) {\n    updateSkill(input: $input) {\n      ...SkillFields\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateSkill($input: UpdateSkillInput!) {\n    updateSkill(input: $input) {\n      ...SkillFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteSkill($id: ID!) {\n    deleteSkill(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteSkill($id: ID!) {\n    deleteSkill(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment UserSkillFields on UserSkill {\n    id\n    skill {\n      id\n      name\n      category {\n        id\n        name\n      }\n    }\n    mastery\n  }\n"): (typeof documents)["\n  fragment UserSkillFields on UserSkill {\n    id\n    skill {\n      id\n      name\n      category {\n        id\n        name\n      }\n    }\n    mastery\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query UserSkills($userId: ID!) {\n    userSkills(userId: $userId) {\n      ...UserSkillFields\n    }\n  }\n"): (typeof documents)["\n  query UserSkills($userId: ID!) {\n    userSkills(userId: $userId) {\n      ...UserSkillFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AvailableUserSkills($userId: ID!) {\n    availableUserSkills(userId: $userId) {\n      id\n      name\n    }\n  }\n"): (typeof documents)["\n  query AvailableUserSkills($userId: ID!) {\n    availableUserSkills(userId: $userId) {\n      id\n      name\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateUserSkill($input: CreateUserSkillInput!) {\n    createUserSkill(input: $input) {\n      ...UserSkillFields\n    }\n  }\n"): (typeof documents)["\n  mutation CreateUserSkill($input: CreateUserSkillInput!) {\n    createUserSkill(input: $input) {\n      ...UserSkillFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateUserSkill($input: UpdateUserSkillInput!) {\n    updateUserSkill(input: $input) {\n      ...UserSkillFields\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateUserSkill($input: UpdateUserSkillInput!) {\n    updateUserSkill(input: $input) {\n      ...UserSkillFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteUserSkills($ids: [ID!]!, $userId: ID!) {\n    deleteUserSkills(ids: $ids, userId: $userId)\n  }\n"): (typeof documents)["\n  mutation DeleteUserSkills($ids: [ID!]!, $userId: ID!) {\n    deleteUserSkills(ids: $ids, userId: $userId)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment UserListFields on User {\n    id\n    email\n    firstName\n    lastName\n    avatarUrl\n    role\n    department {\n      id\n      name\n    }\n    position {\n      id\n      name\n    }\n  }\n"): (typeof documents)["\n  fragment UserListFields on User {\n    id\n    email\n    firstName\n    lastName\n    avatarUrl\n    role\n    department {\n      id\n      name\n    }\n    position {\n      id\n      name\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Users(\n    $page: Int!\n    $pageSize: Int!\n    $search: String\n    $sortBy: UserSortField\n    $sortOrder: SortOrder!\n  ) {\n    users(\n      page: $page\n      pageSize: $pageSize\n      sortBy: $sortBy\n      sortOrder: $sortOrder\n      search: $search\n    ) {\n      items {\n        ...UserListFields\n      }\n      page\n      pageSize\n      total\n    }\n  }\n"): (typeof documents)["\n  query Users(\n    $page: Int!\n    $pageSize: Int!\n    $search: String\n    $sortBy: UserSortField\n    $sortOrder: SortOrder!\n  ) {\n    users(\n      page: $page\n      pageSize: $pageSize\n      sortBy: $sortBy\n      sortOrder: $sortOrder\n      search: $search\n    ) {\n      items {\n        ...UserListFields\n      }\n      page\n      pageSize\n      total\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query User($id: ID!) {\n    user(id: $id) {\n      ...UserListFields\n      createdAt\n      emailVerifiedAt\n    }\n  }\n"): (typeof documents)["\n  query User($id: ID!) {\n    user(id: $id) {\n      ...UserListFields\n      createdAt\n      emailVerifiedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query UserFormOptions {\n    departmentOptions {\n      id\n      name\n    }\n    positionOptions {\n      id\n      name\n    }\n  }\n"): (typeof documents)["\n  query UserFormOptions {\n    departmentOptions {\n      id\n      name\n    }\n    positionOptions {\n      id\n      name\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateUser($input: CreateUserInput!) {\n    createUser(input: $input) {\n      ...UserListFields\n    }\n  }\n"): (typeof documents)["\n  mutation CreateUser($input: CreateUserInput!) {\n    createUser(input: $input) {\n      ...UserListFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateUser($input: UpdateUserInput!) {\n    updateUser(input: $input) {\n      ...UserListFields\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateUser($input: UpdateUserInput!) {\n    updateUser(input: $input) {\n      ...UserListFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateProfile($input: UpdateProfileInput!) {\n    updateProfile(input: $input) {\n      ...UserListFields\n      createdAt\n      emailVerifiedAt\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateProfile($input: UpdateProfileInput!) {\n    updateProfile(input: $input) {\n      ...UserListFields\n      createdAt\n      emailVerifiedAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UploadAvatar($userId: ID!, $file: Upload!) {\n    uploadAvatar(userId: $userId, file: $file) {\n      id\n      avatarUrl\n    }\n  }\n"): (typeof documents)["\n  mutation UploadAvatar($userId: ID!, $file: Upload!) {\n    uploadAvatar(userId: $userId, file: $file) {\n      id\n      avatarUrl\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation RemoveAvatar($userId: ID!) {\n    removeAvatar(userId: $userId) {\n      id\n      avatarUrl\n    }\n  }\n"): (typeof documents)["\n  mutation RemoveAvatar($userId: ID!) {\n    removeAvatar(userId: $userId) {\n      id\n      avatarUrl\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteUser($id: ID!) {\n    deleteUser(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteUser($id: ID!) {\n    deleteUser(id: $id)\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;