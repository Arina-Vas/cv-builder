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
    "\n  fragment DepartmentFields on Department {\n    id\n    name\n  }\n": typeof types.DepartmentFieldsFragmentDoc,
    "\n  query Departments(\n    $page: Int!\n    $pageSize: Int!\n    $search: String\n    $sortBy: DepartmentSortField!\n    $sortOrder: SortOrder!\n  ) {\n    departments(\n      page: $page\n      pageSize: $pageSize\n      sortBy: $sortBy\n      sortOrder: $sortOrder\n      search: $search\n    ) {\n      items {\n        ...DepartmentFields\n      }\n      page\n      pageSize\n      total\n    }\n  }\n": typeof types.DepartmentsDocument,
    "\n  mutation CreateDepartment($input: CreateDepartmentInput!) {\n    createDepartment(input: $input) {\n      ...DepartmentFields\n    }\n  }\n": typeof types.CreateDepartmentDocument,
    "\n  mutation UpdateDepartment($input: UpdateDepartmentInput!) {\n    updateDepartment(input: $input) {\n      ...DepartmentFields\n    }\n  }\n": typeof types.UpdateDepartmentDocument,
    "\n  mutation DeleteDepartment($id: ID!) {\n    deleteDepartment(id: $id)\n  }\n": typeof types.DeleteDepartmentDocument,
    "\n  fragment UserListFields on User {\n    id\n    email\n    firstName\n    lastName\n    avatarUrl\n    role\n    department {\n      id\n      name\n    }\n    position {\n      id\n      name\n    }\n  }\n": typeof types.UserListFieldsFragmentDoc,
    "\n  query Users(\n    $page: Int!\n    $pageSize: Int!\n    $search: String\n    $sortBy: UserSortField\n    $sortOrder: SortOrder!\n  ) {\n    users(\n      page: $page\n      pageSize: $pageSize\n      sortBy: $sortBy\n      sortOrder: $sortOrder\n      search: $search\n    ) {\n      items {\n        ...UserListFields\n      }\n      page\n      pageSize\n      total\n    }\n  }\n": typeof types.UsersDocument,
    "\n  mutation CreateUser($input: CreateUserInput!) {\n    createUser(input: $input) {\n      ...UserListFields\n    }\n  }\n": typeof types.CreateUserDocument,
    "\n  mutation UpdateUser($input: UpdateUserInput!) {\n    updateUser(input: $input) {\n      ...UserListFields\n    }\n  }\n": typeof types.UpdateUserDocument,
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
    "\n  fragment DepartmentFields on Department {\n    id\n    name\n  }\n": types.DepartmentFieldsFragmentDoc,
    "\n  query Departments(\n    $page: Int!\n    $pageSize: Int!\n    $search: String\n    $sortBy: DepartmentSortField!\n    $sortOrder: SortOrder!\n  ) {\n    departments(\n      page: $page\n      pageSize: $pageSize\n      sortBy: $sortBy\n      sortOrder: $sortOrder\n      search: $search\n    ) {\n      items {\n        ...DepartmentFields\n      }\n      page\n      pageSize\n      total\n    }\n  }\n": types.DepartmentsDocument,
    "\n  mutation CreateDepartment($input: CreateDepartmentInput!) {\n    createDepartment(input: $input) {\n      ...DepartmentFields\n    }\n  }\n": types.CreateDepartmentDocument,
    "\n  mutation UpdateDepartment($input: UpdateDepartmentInput!) {\n    updateDepartment(input: $input) {\n      ...DepartmentFields\n    }\n  }\n": types.UpdateDepartmentDocument,
    "\n  mutation DeleteDepartment($id: ID!) {\n    deleteDepartment(id: $id)\n  }\n": types.DeleteDepartmentDocument,
    "\n  fragment UserListFields on User {\n    id\n    email\n    firstName\n    lastName\n    avatarUrl\n    role\n    department {\n      id\n      name\n    }\n    position {\n      id\n      name\n    }\n  }\n": types.UserListFieldsFragmentDoc,
    "\n  query Users(\n    $page: Int!\n    $pageSize: Int!\n    $search: String\n    $sortBy: UserSortField\n    $sortOrder: SortOrder!\n  ) {\n    users(\n      page: $page\n      pageSize: $pageSize\n      sortBy: $sortBy\n      sortOrder: $sortOrder\n      search: $search\n    ) {\n      items {\n        ...UserListFields\n      }\n      page\n      pageSize\n      total\n    }\n  }\n": types.UsersDocument,
    "\n  mutation CreateUser($input: CreateUserInput!) {\n    createUser(input: $input) {\n      ...UserListFields\n    }\n  }\n": types.CreateUserDocument,
    "\n  mutation UpdateUser($input: UpdateUserInput!) {\n    updateUser(input: $input) {\n      ...UserListFields\n    }\n  }\n": types.UpdateUserDocument,
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
export function graphql(source: "\n  fragment UserListFields on User {\n    id\n    email\n    firstName\n    lastName\n    avatarUrl\n    role\n    department {\n      id\n      name\n    }\n    position {\n      id\n      name\n    }\n  }\n"): (typeof documents)["\n  fragment UserListFields on User {\n    id\n    email\n    firstName\n    lastName\n    avatarUrl\n    role\n    department {\n      id\n      name\n    }\n    position {\n      id\n      name\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Users(\n    $page: Int!\n    $pageSize: Int!\n    $search: String\n    $sortBy: UserSortField\n    $sortOrder: SortOrder!\n  ) {\n    users(\n      page: $page\n      pageSize: $pageSize\n      sortBy: $sortBy\n      sortOrder: $sortOrder\n      search: $search\n    ) {\n      items {\n        ...UserListFields\n      }\n      page\n      pageSize\n      total\n    }\n  }\n"): (typeof documents)["\n  query Users(\n    $page: Int!\n    $pageSize: Int!\n    $search: String\n    $sortBy: UserSortField\n    $sortOrder: SortOrder!\n  ) {\n    users(\n      page: $page\n      pageSize: $pageSize\n      sortBy: $sortBy\n      sortOrder: $sortOrder\n      search: $search\n    ) {\n      items {\n        ...UserListFields\n      }\n      page\n      pageSize\n      total\n    }\n  }\n"];
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
export function graphql(source: "\n  mutation DeleteUser($id: ID!) {\n    deleteUser(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteUser($id: ID!) {\n    deleteUser(id: $id)\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;