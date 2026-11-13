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
    "\n  fragment SkillFields on Skill {\n    id\n    name\n    category {\n      id\n      name\n      type\n    }\n  }\n": typeof types.SkillFieldsFragmentDoc,
    "\n  query Skills(\n    $page: Int!\n    $pageSize: Int!\n    $search: String\n    $sortBy: SkillSortField!\n    $sortOrder: SortOrder!\n  ) {\n    skills(\n      page: $page\n      pageSize: $pageSize\n      search: $search\n      sortBy: $sortBy\n      sortOrder: $sortOrder\n    ) {\n      items {\n        ...SkillFields\n      }\n      page\n      pageSize\n      total\n    }\n  }\n": typeof types.SkillsDocument,
    "\n  query SkillCategories {\n    skillCategories {\n      id\n      name\n      type\n    }\n  }\n": typeof types.SkillCategoriesDocument,
    "\n  mutation CreateSkill($input: CreateSkillInput!) {\n    createSkill(input: $input) {\n      ...SkillFields\n    }\n  }\n": typeof types.CreateSkillDocument,
    "\n  mutation UpdateSkill($input: UpdateSkillInput!) {\n    updateSkill(input: $input) {\n      ...SkillFields\n    }\n  }\n": typeof types.UpdateSkillDocument,
    "\n  mutation DeleteSkill($id: ID!) {\n    deleteSkill(id: $id)\n  }\n": typeof types.DeleteSkillDocument,
    "\n  fragment UserListFields on User {\n    id\n    email\n    firstName\n    lastName\n    avatarUrl\n    role\n    department {\n      id\n      name\n    }\n    position {\n      id\n      name\n    }\n  }\n": typeof types.UserListFieldsFragmentDoc,
    "\n  query Users(\n    $page: Int!\n    $pageSize: Int!\n    $search: String\n    $sortBy: UserSortField\n    $sortOrder: SortOrder!\n  ) {\n    users(\n      page: $page\n      pageSize: $pageSize\n      sortBy: $sortBy\n      sortOrder: $sortOrder\n      search: $search\n    ) {\n      items {\n        ...UserListFields\n      }\n      page\n      pageSize\n      total\n    }\n  }\n": typeof types.UsersDocument,
    "\n  query User($id: ID!) {\n    user(id: $id) {\n      ...UserListFields\n      createdAt\n      emailVerifiedAt\n    }\n  }\n": typeof types.UserDocument,
    "\n  query UserFormOptions {\n    departments(pageSize: 50) {\n      items {\n        id\n        name\n      }\n    }\n    positions(pageSize: 50) {\n      items {\n        id\n        name\n      }\n    }\n  }\n": typeof types.UserFormOptionsDocument,
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
    "\n  fragment SkillFields on Skill {\n    id\n    name\n    category {\n      id\n      name\n      type\n    }\n  }\n": types.SkillFieldsFragmentDoc,
    "\n  query Skills(\n    $page: Int!\n    $pageSize: Int!\n    $search: String\n    $sortBy: SkillSortField!\n    $sortOrder: SortOrder!\n  ) {\n    skills(\n      page: $page\n      pageSize: $pageSize\n      search: $search\n      sortBy: $sortBy\n      sortOrder: $sortOrder\n    ) {\n      items {\n        ...SkillFields\n      }\n      page\n      pageSize\n      total\n    }\n  }\n": types.SkillsDocument,
    "\n  query SkillCategories {\n    skillCategories {\n      id\n      name\n      type\n    }\n  }\n": types.SkillCategoriesDocument,
    "\n  mutation CreateSkill($input: CreateSkillInput!) {\n    createSkill(input: $input) {\n      ...SkillFields\n    }\n  }\n": types.CreateSkillDocument,
    "\n  mutation UpdateSkill($input: UpdateSkillInput!) {\n    updateSkill(input: $input) {\n      ...SkillFields\n    }\n  }\n": types.UpdateSkillDocument,
    "\n  mutation DeleteSkill($id: ID!) {\n    deleteSkill(id: $id)\n  }\n": types.DeleteSkillDocument,
    "\n  fragment UserListFields on User {\n    id\n    email\n    firstName\n    lastName\n    avatarUrl\n    role\n    department {\n      id\n      name\n    }\n    position {\n      id\n      name\n    }\n  }\n": types.UserListFieldsFragmentDoc,
    "\n  query Users(\n    $page: Int!\n    $pageSize: Int!\n    $search: String\n    $sortBy: UserSortField\n    $sortOrder: SortOrder!\n  ) {\n    users(\n      page: $page\n      pageSize: $pageSize\n      sortBy: $sortBy\n      sortOrder: $sortOrder\n      search: $search\n    ) {\n      items {\n        ...UserListFields\n      }\n      page\n      pageSize\n      total\n    }\n  }\n": types.UsersDocument,
    "\n  query User($id: ID!) {\n    user(id: $id) {\n      ...UserListFields\n      createdAt\n      emailVerifiedAt\n    }\n  }\n": types.UserDocument,
    "\n  query UserFormOptions {\n    departments(pageSize: 50) {\n      items {\n        id\n        name\n      }\n    }\n    positions(pageSize: 50) {\n      items {\n        id\n        name\n      }\n    }\n  }\n": types.UserFormOptionsDocument,
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
export function graphql(source: "\n  query UserFormOptions {\n    departments(pageSize: 50) {\n      items {\n        id\n        name\n      }\n    }\n    positions(pageSize: 50) {\n      items {\n        id\n        name\n      }\n    }\n  }\n"): (typeof documents)["\n  query UserFormOptions {\n    departments(pageSize: 50) {\n      items {\n        id\n        name\n      }\n    }\n    positions(pageSize: 50) {\n      items {\n        id\n        name\n      }\n    }\n  }\n"];
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