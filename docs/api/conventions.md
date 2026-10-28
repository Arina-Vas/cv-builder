# API conventions

Rules every GraphQL module follows, so modules built by different developers look the same to the frontend.

Status: **draft for review.**

## How the contract works

The API is **code-first**: we write TypeScript classes with NestJS decorators, and NestJS generates the
GraphQL schema from them.

| What we write                        | What it becomes in GraphQL                       |
| ------------------------------------ | ------------------------------------------------ |
| `@ObjectType()` class                | output type (`type Department`)                  |
| `@InputType()` class                 | mutation input (`input CreateDepartmentInput`)   |
| `@ArgsType()` class                  | query arguments (`search`, `page`, …)            |
| `@Query()` / `@Mutation()` method    | operation                                        |
| `class-validator` decorators on DTOs | server-side validation (global `ValidationPipe`) |

- The generated schema is written to `backend/schema.gql` and committed. It is the contract the frontend uses.
- The frontend generates TypeScript types from `schema.gql` with GraphQL Code Generator (`client-preset`).
- A module's first PR is its contract: types, inputs and resolver signatures. Resolver bodies may throw
  `NotImplementedException` until the module is implemented, so the frontend can start on the generated types.
- This file keeps only the rules that the schema itself does not show. Types and operations are documented in the
  schema through `description` and can be browsed in Apollo Sandbox.

### Shared building blocks

Modules import these instead of writing their own:

| What                                                    | File                                               |
| ------------------------------------------------------- | -------------------------------------------------- |
| `ListArgs` (search + sortOrder)                         | `backend/src/common/graphql/list.args.ts`          |
| `PaginatedListArgs` (+ page, pageSize)                  | `backend/src/common/graphql/list.args.ts`          |
| `Paginated(Type)`, `PaginatedResult<T>`                 | `backend/src/common/graphql/paginated.response.ts` |
| `SortOrder`                                             | `backend/src/common/graphql/sort-order.enum.ts`    |
| Pagination defaults, page sizes, `MAX_NAME_LENGTH`      | `backend/src/common/graphql/constants.ts`          |
| `DateScalar`                                            | `backend/src/common/graphql/date.scalar.ts`        |
| `UserRole`, `Mastery`, `Proficiency`                    | `backend/src/common/graphql/enums.ts`              |
| `ErrorCode` and error helpers                           | `backend/src/common/errors/`                       |
| `@Roles()`                                              | `backend/src/common/auth/roles.decorator.ts`       |
| `@NormalizeText()`, `@TrimText()`, `@ToUpperCaseText()` | `backend/src/common/validation/transforms.ts`      |
| `isPrismaError(error, code)`                            | `backend/src/prisma/prisma-errors.ts`              |

Prisma enums are always imported from `common/graphql/enums.ts`, not from `src/generated/prisma`: that file
registers them for GraphQL.

Text inputs are normalized in the DTO, before validation, so a blank value fails `@IsNotEmpty` and services and
uniqueness checks get the stored form:

- `@NormalizeText()` trims and collapses repeated whitespace (`"  Big   Data "` → `"Big Data"`): names and other
  single-line values;
- `@TrimText()` only trims the ends and keeps line breaks: multiline values such as a project description;
- `@ToUpperCaseText()` upper-cases the value (language ISO code), placed together with `@NormalizeText()`.

### Shared entity types

Output types that other modules reference live in the module that owns the entity, not in `common/`, so a module
can return `department: Department` without waiting for the Departments module.

| Type            | Model                                    | Mapper                                         |
| --------------- | ---------------------------------------- | ---------------------------------------------- |
| `Department`    | `departments/models/department.model.ts` | `departments/department.mapper.ts`             |
| `Position`      | `positions/models/position.model.ts`     | `positions/position.mapper.ts`                 |
| `Language`      | `languages/models/language.model.ts`     | `languages/language.mapper.ts`                 |
| `SkillCategory` | `skills/models/skill-category.model.ts`  | `skills/skill.mapper.ts` (`toSkillCategory`)   |
| `Skill`         | `skills/models/skill.model.ts`           | `skills/skill.mapper.ts`                       |
| `ProjectRole`   | `projects/models/project-role.model.ts`  | `projects/project.mapper.ts` (`toProjectRole`) |
| `Project`       | `projects/models/project.model.ts`       | `projects/project.mapper.ts`                   |
| `User`          | `users/models/user.model.ts`             | `users/user.mapper.ts`                         |

Paths are relative to `backend/src/`. Link types that only one module uses (`UserSkill`, `UserLanguage`, `Cv`,
`CvSkill`, `CvProject`) stay in that module's contract.

Rules for output types:

- One class per file, `<entity>.model.ts` in `<module>/models/`; the module folder is plural, the file singular.
- The class name is the GraphQL type name (`@ObjectType()` without an explicit name). The Prisma type is imported
  with an alias: `import type { Department as DepartmentEntity } from '@/generated/prisma/client'`.
- The class declares `implements Pick<XEntity, 'id' | 'name' | …>`, so renaming or removing a column breaks the
  build. `Pick`, never `Omit`: a new column must not appear in the API by default.
- A relation is returned as an object (`category: SkillCategory!`), not as an id field (`categoryId`).
- No back-relations (`Department.users`, `Skill.cvs`): they create import cycles between modules and unbounded
  lists. Such data is fetched through the owning module's queries.
- Nullability follows Prisma: an optional column or relation is `{ nullable: true }` with the type `X | null`.
  Nullable fields need an explicit type in `@Field(() => String, { nullable: true })`.
- `User.emailVerifiedAt: DateTime` is the verification status: `null` means the email is not verified.

Rules for mappers:

- A mapper (`toDepartment`, `toUser`, …) turns a Prisma row into the output type. Services return
  `rows.map(toX)`, never a raw Prisma row.
- Fields are listed explicitly; no `{ ...row }`, so service fields (`passwordHash`, `createdAt`, `…Id`) never leak.
- A type with relations exports its `include` and the matching row type, and services load data with that
  `include`:

  ```ts
  export const skillInclude = { category: true } satisfies Prisma.SkillInclude;
  export type SkillWithCategory = Prisma.SkillGetPayload<{ include: typeof skillInclude }>;
  ```

- A missing optional relation stays `null`: `row.department ? toDepartment(row.department) : null`.
- Mappers are pure: no database calls, access checks or errors. Mappers with logic (nested relations,
  `Project.environment`, `User`) have a `*.mapper.spec.ts`.

## Naming

| What              | Rule                                         | Example                                |
| ----------------- | -------------------------------------------- | -------------------------------------- |
| Types             | singular PascalCase, same as the class name  | `Department`, `UserSkill`              |
| Fields, arguments | camelCase                                    | `firstName`, `pageSize`                |
| List query        | plural noun                                  | `departments`, `skills`                |
| Single-item query | singular noun with `id`                      | `department(id: ID!)`                  |
| Mutations         | verb + noun                                  | `createDepartment`, `deleteUserSkills` |
| Inputs            | `Create<Entity>Input`, `Update<Entity>Input` | `UpdateDepartmentInput`                |
| List arguments    | `<Entity>sArgs`                              | `DepartmentsArgs`                      |
| List response     | `<Entity>Page`                               | `DepartmentPage`                       |
| Sort enum         | `<Entity>SortField`                          | `DepartmentSortField`                  |
| Enum values       | UPPER_CASE, except sort fields (see Sorting) | `ADMIN`, `NATIVE`                      |

Every entity has `id: ID!` (`@Field(() => ID)`). Apollo Client uses `id` and `__typename` to normalize its cache,
so names like `_id` or `departmentId` for an entity's own id are not allowed.

Non-obvious fields, arguments and enum values get a `description` in the decorator.

## List queries

Paginated lists take the same flat arguments:

```graphql
departments(
  search: String
  sortBy: DepartmentSortField
  sortOrder: SortOrder = ASC
  page: Int = 1
  pageSize: Int = 10
): DepartmentPage!
```

and return:

```graphql
type DepartmentPage {
  items: [Department!]!
  total: Int!
  page: Int!
  pageSize: Int!
}
```

This matches the frontend `Pagination` component (`page`, `pageSize`, `total`, page sizes 10 / 20 / 50).

A module builds its arguments by extending the shared class and adding its own `sortBy` and filters:

```ts
@ArgsType()
export class DepartmentsArgs extends PaginatedListArgs {
  @Field(() => DepartmentSortField, { defaultValue: DepartmentSortField.name })
  @IsEnum(DepartmentSortField)
  sortBy: DepartmentSortField = DepartmentSortField.name;
}

@ObjectType()
export class DepartmentPage extends Paginated(Department) {}
```

Lists without pagination extend `ListArgs` instead of `PaginatedListArgs`.

### Defaults and rules

| Parameter      | Default             | Rule                                                                               |
| -------------- | ------------------- | ---------------------------------------------------------------------------------- |
| `page`         | `1`                 | 1-based; `page < 1` → `BAD_USER_INPUT`                                             |
| `pageSize`     | `10`                | only `10`, `20` or `50`; anything else → `BAD_USER_INPUT`                          |
| `sortOrder`    | `ASC`               | `ASC` or `DESC`                                                                    |
| `sortBy`       | per list, see below | only values of the list's sort enum; the backend never sorts by an arbitrary field |
| `search`       | none                | trimmed, case-insensitive, matches part of the value; empty or `null` = no filter  |
| Secondary sort | `id ASC`            | always added by the backend, so rows with equal values do not jump between pages   |

- `total` is the number of items matching `search`, not the number of items on the page.
- A page past the end returns `items: []` with the real `total`; the frontend moves to the last page.
- The frontend resets `page` to 1 when `search`, `sortBy`, `sortOrder` or `pageSize` changes.

### Lists

| List                                                                       | Default `sortBy` | Sort fields                                       | Search by                    | Paginated |
| -------------------------------------------------------------------------- | ---------------- | ------------------------------------------------- | ---------------------------- | --------- |
| `users`                                                                    | `firstName`      | `firstName`, `lastName`, `department`, `position` | first name, last name, email | yes       |
| `departments`                                                              | `name`           | `name`                                            | name                         | yes       |
| `positions`                                                                | `name`           | `name`                                            | name                         | yes       |
| `skills`                                                                   | `name`           | `name`                                            | name                         | yes       |
| `languages`                                                                | `name`           | `name`, `iso`                                     | name                         | yes       |
| `cvs`                                                                      | `name`           | `name`                                            | name                         | yes       |
| `projects`                                                                 | `name`           | `name`, `startDate`, `endDate`                    | name, domain                 | no        |
| `cvProjects`                                                               | `name`           | `name`, `startDate`, `endDate`                    | name, domain                 | no        |
| user skills / languages, CV skills                                         | —                | grouped by category, by name inside a group       | —                            | no        |
| lookups for selects (`skillCategories`, `technologies`, `projectRoles`, …) | `name`           | —                                                 | —                            | no        |

Lists without pagination return `{ items, total }` or a plain list for lookups.

Sort and search fields come from the Sorting and Search sections of each wiki page.

### Sorting

Sort enum values are equal to the DataTable `Column.key` (camelCase), so `SortState` from the table goes into the
query without mapping:

```graphql
enum DepartmentSortField {
  name
}
enum UserSortField {
  firstName
  lastName
  department
  position
}
```

```ts
const { sort } = useTableParams(); // { field: 'name', order: 'ASC' }
useQuery(DepartmentsQuery, {
  variables: { sortBy: sort?.field, sortOrder: sort?.order, page, pageSize },
});
```

The wiki examples use upper-case values (`sortBy = NAME`); they are conceptual, and we use column keys instead to
avoid a column-key → enum map in every table.

## Mutations

- `create*` and `update*` return the entity itself (`createDepartment(input): Department!`), not a payload wrapper.
  Apollo updates the cached entity by `id` automatically.
- `delete*` returns the deleted `ID!`. The frontend removes it from the cache (`cache.evict`) and refetches the list.
- Bulk deletes take a list of ids and return the deleted ids:
  `deleteUserSkills(userId: ID!, skillIds: [ID!]!): [ID!]!`.
- Mutations take one argument named `input` of an `@InputType`, except deletes, which take ids directly.
- `update*` inputs contain `id` and only the fields the user can change.
- Inputs are always validated on the backend, even if the frontend validates them too
  (wiki: "Client-side validation is intended for user experience and must not replace server-side validation").
- The UI treats a mutation as successful only after the response arrives (no optimistic updates without a rollback).

## Errors

Errors use the standard GraphQL `errors` array; the code is in `extensions.code`. Modules throw errors through the
helpers in `backend/src/common/errors/app-errors.ts`; a global exception filter converts everything else.

```json
{
  "errors": [
    {
      "message": "Department with this name already exists",
      "extensions": { "code": "CONFLICT", "field": "name" }
    }
  ]
}
```

### Codes

| Code                    | When                                                 | Extra fields                   | Frontend                                |
| ----------------------- | ---------------------------------------------------- | ------------------------------ | --------------------------------------- |
| `UNAUTHENTICATED`       | no token, invalid or expired token                   | —                              | try `refresh`, otherwise go to Sign In  |
| `FORBIDDEN`             | role or ownership check failed                       | —                              | "not authorized" state                  |
| `NOT_FOUND`             | the entity does not exist (or was deleted meanwhile) | —                              | not-found state, refresh stale data     |
| `BAD_USER_INPUT`        | validation failed                                    | `fields: [{ field, message }]` | inline errors under the fields          |
| `CONFLICT`              | a unique value is already taken                      | `field` (when known)           | inline error under `field`              |
| `ENTITY_IN_USE`         | delete blocked because the item is referenced        | —                              | toast                                   |
| `RATE_LIMITED`          | too many requests (e.g. resend verification code)    | `retryAfter` (seconds)         | "please wait" message                   |
| `INTERNAL_SERVER_ERROR` | unexpected error                                     | —                              | generic error toast with a retry option |

The codes cover the error categories the wiki asks the frontend to handle:

| Wiki category                        | Code                                                                            |
| ------------------------------------ | ------------------------------------------------------------------------------- |
| Validation errors                    | `BAD_USER_INPUT`                                                                |
| Unauthorized / authentication errors | `UNAUTHENTICATED`                                                               |
| Forbidden / authorization errors     | `FORBIDDEN`                                                                     |
| Not-found errors                     | `NOT_FOUND`                                                                     |
| Conflict errors                      | `CONFLICT`                                                                      |
| Dependency / business-rule errors    | `ENTITY_IN_USE`                                                                 |
| Unexpected server errors             | `INTERNAL_SERVER_ERROR`                                                         |
| Rate limiting (Verification page)    | `RATE_LIMITED`                                                                  |
| Network errors                       | no code: the request did not reach the server (`networkError` in Apollo Client) |

`UNAUTHENTICATED`, `FORBIDDEN`, `BAD_USER_INPUT` and `INTERNAL_SERVER_ERROR` follow Apollo Server conventions;
the other codes are ours.

### Messages

The frontend shows **its own text**, chosen by `extensions.code` and `field`, so the UI can be translated.
The backend `message` is English, meant for developers and logs, and is a fallback when the frontend has no text
for a case.

- `message` never contains SQL, stack traces, internal ids or other users' data.
- `field` / `fields[].field` use the input field names (`name`, `iso`, `categoryId`), so the frontend can map them
  to form fields without a lookup.
- Authorization errors are never returned as validation errors.

### How errors are produced

| Source                                                                                            | Code                                                             |
| ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `class-validator` failure (`ValidationPipe`)                                                      | `BAD_USER_INPUT` with `fields`                                   |
| invalid `Date` value                                                                              | `BAD_USER_INPUT` (thrown by the scalar)                          |
| error helper thrown by a service                                                                  | the helper's code                                                |
| Prisma `P2002` (unique constraint)                                                                | `CONFLICT` without `field` (fallback, see rules below)           |
| Prisma `P2003` (foreign key)                                                                      | `ENTITY_IN_USE`                                                  |
| Prisma `P2025` (record not found)                                                                 | `NOT_FOUND`                                                      |
| Nest `UnauthorizedException` / `ForbiddenException` / `NotFoundException` / `BadRequestException` | `UNAUTHENTICATED` / `FORBIDDEN` / `NOT_FOUND` / `BAD_USER_INPUT` |
| HTTP 429 (e.g. a throttler)                                                                       | `RATE_LIMITED` with `retryAfter: 0` (time unknown)               |
| any other exception                                                                               | `INTERNAL_SERVER_ERROR`; the real error is logged                |

Rules for services:

- **Uniqueness.** A service that knows the field catches Prisma `P2002` and throws
  `conflict('<input field>', '<message>')`. Prisma reports database columns (`native_name`), not input fields
  (`nativeName`), so the filter's `CONFLICT` has no `field` and is only a fallback.
- **Several unique fields.** A `P2002` does not say which unique field was taken (with the driver adapter there is
  no `meta.target`), so when an entity has more than one (`Language`: `name`, `iso`) the service checks each field
  with `findUnique` before `create` / `update` and throws `conflict` for that field. The record being updated is
  excluded by its `id` (wiki: "saving an unchanged language must not produce a duplicate error"). The service does
  not catch `P2002`: it only happens when two requests write the same value at once, and the filter returns
  `CONFLICT` without `field`.
- **References.** Before `create` / `update`, a service checks that referenced records exist (`departmentId`,
  `categoryId`, `technologyIds`, …) and throws `badUserInput([{ field, message }])` otherwise (wiki: "Backend validates
  the selected department"). That is why a Prisma `P2003` reaching the filter means a blocked delete.
- **Blocked delete.** Catalogs use `onDelete: Restrict` ([data model](../data-model.md#deletion-policy)), so the
  database rejects deleting a referenced item and the filter returns `ENTITY_IN_USE`.
- **Rate limits.** A service that knows the cooldown throws `rateLimited(<seconds>, '<message>')`.

Which Prisma errors a service catches (with `isPrismaError(error, code)`); everything else is rethrown for the
global filter:

| Code    | Where                                          | Service throws                               | If not caught                     |
| ------- | ---------------------------------------------- | -------------------------------------------- | --------------------------------- |
| `P2002` | `create` / `update` of one unique field        | `conflict('<input field>', '<message>')`     | `CONFLICT` without `field`        |
| `P2003` | `create` / `update` whose input references ids | `badUserInput([{ field: '<id field>', … }])` | `ENTITY_IN_USE`, wrong for a form |
| `P2025` | not caught                                     | —                                            | `NOT_FOUND` (filter)              |
| `P2003` | `delete`: not caught                           | —                                            | `ENTITY_IN_USE` (filter)          |

`P2003` on `create` / `update` happens when a referenced record is deleted between the existence check and the
write. `P2025` is caught only when the frontend needs a specific message (e.g. `notFound('CV not found')`).

```ts
async update({ id, name }: UpdateDepartmentInput): Promise<Department> {
  try {
    return toDepartment(await this.prisma.department.update({ where: { id }, data: { name } }));
  } catch (error) {
    if (isPrismaError(error, 'P2002')) throw conflict('name', 'Department already exists');
    throw error;
  }
}
```

With several unique fields:

```ts
// The language being updated (`id`) does not count as a duplicate of itself
private async assertUnique({ name, iso }: CreateLanguageInput, id?: string): Promise<void> {
  const [byName, byIso] = await Promise.all([
    this.prisma.language.findUnique({ where: { name }, select: { id: true } }),
    this.prisma.language.findUnique({ where: { iso }, select: { id: true } }),
  ]);

  if (byName && byName.id !== id) throw conflict('name', 'Language already exists');
  if (byIso && byIso.id !== id) throw conflict('iso', 'ISO code already exists');
}
```

Errors found by Apollo before a resolver runs (`GRAPHQL_PARSE_FAILED`, `GRAPHQL_VALIDATION_FAILED`, a variable of
the wrong type) do not pass through the filter. They are developer errors; frontend codegen catches most of them at
build time.

## Scalars

| Scalar     | Format          | Used for                                 |
| ---------- | --------------- | ---------------------------------------- |
| `ID`       | uuid            | all ids                                  |
| `Date`     | `YYYY-MM-DD`    | project and CV project dates             |
| `DateTime` | ISO 8601 in UTC | `createdAt` ("Member since"), timestamps |

`DateTime` is the NestJS built-in for every `Date` field without an explicit type. `Date` is our custom scalar
(`DateScalar`) and must be set explicitly: `@Field(() => DateScalar) startDate!: Date`.

Why `Date` exists: the wiki only requires dates to be stored as date values, not display strings; the format is our
decision. Project dates are calendar days (`@db.Date`, picked in a date picker) and have no time. Sent as `DateTime`,
a local midnight would become the previous day in UTC for users east of UTC. `YYYY-MM-DD` has no time zone, so the
day cannot shift.

Frontend side:

- send: `format(date, 'yyyy-MM-dd')`; receive: `parseISO(value)` (`date-fns`);
- codegen config: `scalars: { Date: 'string' }`.

## Authentication and access

- Every operation requires authentication unless it is marked `@Public()`.
- Access and refresh tokens are httpOnly cookies set by the API; the frontend sends them with
  `credentials: 'include'` and never reads them. No `Authorization` header is used. Details in
  [auth.md](../auth.md).
- Users with an unverified email are read-only: mutations are rejected unless marked `@AllowUnverified()`.
- Admin-only operations are marked with `@Roles(UserRole.ADMIN)`. The decorator only stores metadata; the guard that
  checks it is added by the Auth task, and a failed check returns `FORBIDDEN`.
- "Own data or Admin" checks (profile, user skills and languages, CVs) cannot be expressed with `@Roles`. Services
  do them, using the current user from the request, never a user id sent by the client as proof of ownership.
- Catalogs (departments, positions, skills, languages, projects) are readable by every authenticated user, because
  employees pick values from them in forms; only changes are Admin-only.
- Who may do what in each feature is described in [permissions.md](permissions.md).

## Sensitive data

No type exposes `passwordHash`, `tokenHash`, `codeHash` or any other credential. Resolvers return output types
built by mappers from Prisma models, so a field that is not declared on the `@ObjectType` never reaches the client.

## Changing the contract

1. Change the DTO, output type or resolver.
2. Start the backend: `backend/schema.gql` is regenerated.
3. Run the frontend codegen; TypeScript shows every place that needs an update.
4. Commit the code, `schema.gql` and the frontend changes in one PR.
