# Permissions

Who can do what in the API. Based on the wiki: the Module Page Access table (Overview) and the Purpose / Scope /
Permissions sections of each page.

Status: **draft for review.** Operation tables are added together with the resolvers of each module.

## Roles

| Role       | Who                                                                                   |
| ---------- | ------------------------------------------------------------------------------------- |
| `EMPLOYEE` | default role after sign-up ("User" in the wiki); manages own data                     |
| `ADMIN`    | manages users, any user's profile, skills, languages and CVs, and the global catalogs |

## Rules

- Every operation requires authentication unless it is marked **Public**.
- **Verified email**: a user whose email is not verified can run queries, but mutations are rejected (except the ones
  marked `@AllowUnverified()`). The wiki does not list which features need a verified email, so this is a team
  decision, see [auth.md](../auth.md#unverified-users-are-read-only).
- **Admin-only** operations are marked with `@Roles(UserRole.ADMIN)`; the global roles guard (`backend/src/common/auth/roles.guard.ts`) checks them.
- **Own or Admin**: an Employee may change only their own data; an Admin may change anyone's. The service compares
  the owner with the current user from the request. A user id or CV id sent by the client is never proof of
  ownership (wiki: "The backend must determine the ownership of the CV using the authenticated user rather than
  trusting an employee ID supplied by the frontend").
- **Catalogs** (departments, positions, skills, languages, projects): the paginated list queries and all changes
  are Admin-only, because only the Management pages use them (wiki: "Admin only ... BE rejects non-admin").
  Employees read catalogs only through the lookups for selects and Add modals (`departmentOptions`,
  `positionOptions`, `skillCategories`, `technologies`, `projectRoles`, `availableUserSkills`,
  `availableUserLanguages`, `availableCvSkills`, `availableCvProjects`), which every authenticated user may call.
- Hiding a control on the frontend is not authorization (wiki: "Frontend role-based UI restrictions must not be
  considered a security mechanism"). Every protected operation is checked on the backend.
- A failed check returns `FORBIDDEN`; a missing or invalid token returns `UNAUTHENTICATED`
  (see [conventions](conventions.md#errors)).

## Page access

From the wiki Module Page Access table.

| Module         | Page                                                                  | Access          |
| -------------- | --------------------------------------------------------------------- | --------------- |
| Authentication | Sign In, Sign Up, Forgot Password, Reset Password, Email Verification | Public          |
| System         | Not Found, No Internet, Unsupported Device                            | Public          |
| Users          | Users (main page)                                                     | Employee, Admin |
| Users          | User Profile                                                          | Employee, Admin |
| Users          | User Skills                                                           | Employee, Admin |
| Users          | User Languages                                                        | Employee, Admin |
| Users          | User CVs list                                                         | Admin           |
| Skills         | Skills (user version)                                                 | Employee \*     |
| Skills         | Skills Management                                                     | Admin           |
| Languages      | Languages (user version)                                              | Employee \*     |
| Languages      | Languages Management                                                  | Admin           |
| CVs            | CV List, CV Details, CV Skills, CV Projects, CV Preview               | Employee, Admin |
| Positions      | Positions Management                                                  | Admin           |
| Departments    | Departments Management                                                | Admin           |
| Projects       | Projects Management                                                   | Admin           |
| Settings       | Settings                                                              | Employee, Admin |

\* Two different pages share the name. The user version manages the current user's own skills / languages
(`user_skills`, `user_languages`); Management manages the global catalog (`skills`, `languages`). The table shows
which page the menu opens for each role. API access does not depend on the page: user skills and languages are
readable by every authenticated user and changed "own or Admin"; catalog lists and changes are Admin-only.

## Rules per feature

What each role may do, from the Scope and Permissions sections of the wiki pages.

### Users

| Action                            | Employee | Admin |
| --------------------------------- | -------- | ----- |
| View, search, sort the users list | ✅       | ✅    |
| View user details                 | ✅       | ✅    |
| Create, update, delete users      | ❌       | ✅    |

Protected users (wiki: "The exact business rules should be defined by the team"). An Admin may delete or change
the role of another Admin, with these exceptions:

| Action                            | Result                                                                                           |
| --------------------------------- | ------------------------------------------------------------------------------------------------ |
| Delete own account                | `OPERATION_NOT_ALLOWED` "You cannot delete your own account"; the UI hides Delete in the own row |
| Change own role                   | `OPERATION_NOT_ALLOWED` "You cannot change your own role"; the UI disables Role for the own row  |
| Delete the last Admin             | `OPERATION_NOT_ALLOWED` "The last admin cannot be deleted"                                       |
| Change the role of the last Admin | `OPERATION_NOT_ALLOWED` "The last admin cannot be demoted"                                       |

The checks run in the service, after the role check. There are no system accounts. A deleted user's sessions are
removed with the user, and the auth guard loads the user and the session on every request, so the deleted user's
next request gets `UNAUTHENTICATED`. If two Admins delete the same user, the second gets `NOT_FOUND`; the
frontend shows a toast and refetches the list.

### Profile

| Action                          | Employee, own profile | Employee, another profile | Admin                 |
| ------------------------------- | --------------------- | ------------------------- | --------------------- |
| View                            | ✅                    | ✅                        | ✅                    |
| Update profile information      | ✅                    | ❌                        | ✅ any user           |
| Upload, change or remove avatar | ✅                    | ❌                        | ✅ any user           |
| Initiate email verification     | ✅                    | ❌                        | ❌ only the owner can |

### User skills and languages

| Action                                  | Employee, own profile | Employee, another profile | Admin       |
| --------------------------------------- | --------------------- | ------------------------- | ----------- |
| View                                    | ✅                    | ✅                        | ✅          |
| Add, update level, remove (one or many) | ✅                    | ❌                        | ✅ any user |

The personal Skills and Languages pages work only with the current user's own data, for both roles. Admins manage
other users' skills and languages through the User Details tabs.

### Catalogs

| Action                                                                                       | Employee | Admin |
| -------------------------------------------------------------------------------------------- | -------- | ----- |
| Lookups for selects (department and position options, skill categories, technologies, roles) | ✅       | ✅    |
| List, search, sort departments, positions, skills, languages, projects (Management pages)    | ❌       | ✅    |
| Create, update, delete departments, positions, skills, languages, projects                   | ❌       | ✅    |

### CVs

| Action                                         | Employee       | Admin            |
| ---------------------------------------------- | -------------- | ---------------- |
| View, search, sort the CV list                 | own CVs only   | all CVs          |
| View a CV (details, skills, projects, preview) | own CVs only   | any CV           |
| Create a CV                                    | for themselves | for any employee |
| Update, delete a CV and its skills / projects  | own CVs only   | any CV           |
| CVs tab of a selected employee (User Details)  | ❌             | ✅               |

The CV owner is never taken on trust from the client (audit question 3; wiki: "The backend must determine the
ownership of the CV using the authenticated user rather than trusting an employee ID supplied by the frontend"):

- `createCv`, `updateCv` and `deleteCv` take the owner's `userId`, like the user skills mutations. An Employee may
  pass only their own id, otherwise `FORBIDDEN`; an Admin may pass any existing user.
- In `updateCv` and `deleteCv` the `userId` only scopes the operation: a CV that does not belong to that user is
  `NOT_FOUND`, for an Admin as well. The owner of a CV never changes.
- In the User CVs tab every operation is therefore scoped to the selected employee (wiki: "The Admin must not be
  able to use this page to create or modify a CV for another employee by changing a client-supplied user ID").
- The CV list has two queries: `cvs` for the CVs page (own CVs for an Employee, all for an Admin) and
  `userCvs(userId)` for the User CVs tab. The tab is Admin-only in the UI; the API allows "own or Admin", like
  `userSkills`.
- Operations that get only a CV id (`cv`, CV projects, and later CV skills, preview and PDF) check access with
  `CvAccessService.getAccessibleCv(cvId, currentUser)` (`backend/src/cvs/cv-access.service.ts`): `NOT_FOUND` if
  the CV does not exist, `FORBIDDEN` if an Employee asks for another user's CV.

### Authentication and settings

| Action                                               | Access                                            |
| ---------------------------------------------------- | ------------------------------------------------- |
| Sign up, sign in, refresh, forgot and reset password | Public                                            |
| Sign out                                             | Public, revokes the session of the refresh cookie |
| Verify email, resend code                            | authenticated, email not verified yet (own only)  |
| Current user (`me`)                                  | authenticated, verified or not                    |
| Theme and language preferences                       | no API: stored in the browser                     |
| Change password                                      | authenticated, own only, verified email           |

"Public" for the Email Verification page in the wiki access table means no role is required; the verify and resend
operations still need the session started at sign-up, because the backend takes the user from the auth context
([auth.md](../auth.md#sign-up-and-email-verification)).

## Operations

Operation-level tables are added by each module together with its resolvers: the operation name and its access
(**All**, **Admin**, **Own or Admin**, **Public**), matching the rules above.

### Users

| Operation       | Access       |
| --------------- | ------------ |
| `users`         | All          |
| `user`          | All          |
| `createUser`    | Admin        |
| `updateUser`    | Admin        |
| `updateProfile` | Own or Admin |
| `deleteUser`    | Admin        |

Errors thrown by the service, besides the [protected users](#users) rules:

| Operation                                   | Case                                | Code             | Message                                         |
| ------------------------------------------- | ----------------------------------- | ---------------- | ----------------------------------------------- |
| `user`                                      | the user does not exist             | `NOT_FOUND`      | `User not found`                                |
| `createUser`                                | the email is taken                  | `CONFLICT`       | `An account with this email already exists`     |
| `createUser`, `updateUser`, `updateProfile` | the department does not exist       | `BAD_USER_INPUT` | `Department not found` (`departmentId`)         |
| `createUser`, `updateUser`, `updateProfile` | the position does not exist         | `BAD_USER_INPUT` | `Position not found` (`positionId`)             |
| `updateUser`, `updateProfile`, `deleteUser` | the user does not exist             | `NOT_FOUND`      | `User not found`                                |
| `updateProfile`                             | an Employee sends another user's id | `FORBIDDEN`      | `You are not authorized to perform this action` |

The email message is the Sign Up one: the Create user modal has no text for a taken email. "Change own role" is
checked only when `role` differs from the caller's current role, because the Update user modal always sends `role`.

`updateProfile` is the Profile tab mutation: first / last name, department and position, own profile or Admin. It
has no `role` field, so an Employee cannot change their role through it; roles change only through the Admin-only
`updateUser` (Update user modal on the Users page). The ownership check runs before any query, so an Employee does
not learn whether another user's id exists. Like every mutation, it needs a verified email (`EMAIL_NOT_VERIFIED`
otherwise).

### Departments

| Operation           | Access |
| ------------------- | ------ |
| `departments`       | Admin  |
| `departmentOptions` | All    |
| `createDepartment`  | Admin  |
| `updateDepartment`  | Admin  |
| `deleteDepartment`  | Admin  |

### Positions

| Operation         | Access |
| ----------------- | ------ |
| `positions`       | Admin  |
| `positionOptions` | All    |
| `createPosition`  | Admin  |
| `updatePosition`  | Admin  |
| `deletePosition`  | Admin  |

### Languages

| Operation        | Access |
| ---------------- | ------ |
| `languages`      | Admin  |
| `createLanguage` | Admin  |
| `updateLanguage` | Admin  |
| `deleteLanguage` | Admin  |

### Skills

| Operation         | Access |
| ----------------- | ------ |
| `skills`          | Admin  |
| `skillCategories` | All    |
| `createSkill`     | Admin  |
| `updateSkill`     | Admin  |
| `deleteSkill`     | Admin  |

### User skills

| Operation             | Access          |
| --------------------- | --------------- |
| `userSkills`          | All             |
| `availableUserSkills` | All             |
| `createUserSkill`     | Own or Admin \* |
| `updateUserSkill`     | Own or Admin \* |
| `deleteUserSkills`    | Own or Admin \* |

### User languages

| Operation                | Access          |
| ------------------------ | --------------- |
| `userLanguages`          | All             |
| `availableUserLanguages` | All             |
| `createUserLanguage`     | Own or Admin \* |
| `updateUserLanguage`     | Own or Admin \* |
| `deleteUserLanguages`    | Own or Admin \* |

\* The owner is the `userId` of the input, compared with the current user from the request
(`canManageUser`, `backend/src/common/auth/can-manage-user.ts`); the client-sent id is never proof of ownership.
Like every mutation, these need a verified email. An Employee changing another user's skills or languages gets
`FORBIDDEN` before the user is looked up, so the response does not reveal whether that user exists.
The assignment ids must belong to that `userId` too: `updateUser*` with another user's assignment id returns
`NOT_FOUND`, and `deleteUser*` with one returns `FORBIDDEN` and removes nothing, for an Admin as well.

### Projects

| Operation       | Access |
| --------------- | ------ |
| `projects`      | Admin  |
| `technologies`  | All    |
| `createProject` | Admin  |
| `updateProject` | Admin  |
| `deleteProject` | Admin  |

### CVs

| Operation  | Access                                      |
| ---------- | ------------------------------------------- |
| `cvs`      | All: own CVs for an Employee, all for Admin |
| `userCvs`  | Own or Admin \*                             |
| `cv`       | Own or Admin †                              |
| `createCv` | Own or Admin \*                             |
| `updateCv` | Own or Admin \*                             |
| `deleteCv` | Own or Admin \*                             |

\* The owner is the `userId` argument or input field, checked with `canManageUser` before the user is looked up,
as for user skills. In `updateCv` and `deleteCv` it must also be the CV's current owner.
† The owner is read from the CV (`CvAccessService`); the request carries only the CV id.

Search on `cvs` matches the CV name; for an Admin it also matches the owner's email (wiki CVs page: "Admin searches
CVs by Name, Employee email"). `userCvs` searches by CV name only (wiki User CVs page). Both are case-insensitive.

Errors thrown by the service:

| Operation                                     | Case                                       | Code        | Message                                            |
| --------------------------------------------- | ------------------------------------------ | ----------- | -------------------------------------------------- |
| `userCvs`, `createCv`, `updateCv`, `deleteCv` | an Employee sends another user's id        | `FORBIDDEN` | `You are not authorized to perform this action`    |
| `userCvs`, `createCv`, `updateCv`, `deleteCv` | the user does not exist                    | `NOT_FOUND` | `User not found`                                   |
| `cv`                                          | the CV does not exist                      | `NOT_FOUND` | `CV not found`                                     |
| `cv`                                          | an Employee asks for another user's CV     | `FORBIDDEN` | `You are not authorized to perform this action`    |
| `updateCv`, `deleteCv`                        | the CV does not exist or has another owner | `NOT_FOUND` | `Not found` (Prisma `P2025`, mapped by the filter) |

Deleting a CV removes its skills and projects (DB cascade, see [data-model.md](../data-model.md)).

### CV projects

| Operation             | Access         |
| --------------------- | -------------- |
| `projectRoles`        | All            |
| `cvProjects`          | Own or Admin † |
| `availableCvProjects` | Own or Admin † |
| `createCvProject`     | Own or Admin † |
| `updateCvProject`     | Own or Admin † |
| `deleteCvProject`     | Own or Admin † |

† Every operation gets the CV id (`cvId` argument or input field) and checks it first with
`CvAccessService.getAccessibleCv`, before any other lookup. The CV project id is then looked up only inside that
CV, so a CV project of another CV is `NOT_FOUND`, even when both CVs belong to the same user.

Errors thrown by the service:

| Operation                            | Case                                              | Code             | Field / message                                           |
| ------------------------------------ | ------------------------------------------------- | ---------------- | --------------------------------------------------------- |
| all except `projectRoles`            | the CV does not exist                             | `NOT_FOUND`      | `CV not found`                                            |
| all except `projectRoles`            | an Employee asks for another user's CV            | `FORBIDDEN`      | `You are not authorized to perform this action`           |
| `createCvProject`                    | the project does not exist                        | `BAD_USER_INPUT` | `projectId`: `Project not found`                          |
| `createCvProject`                    | the project is already in the CV                  | `CONFLICT`       | `projectId`: `Project is already added to the CV`         |
| `createCvProject`, `updateCvProject` | start date outside the project's dates            | `BAD_USER_INPUT` | `startDate`: `Start date must be within project duration` |
| `createCvProject`, `updateCvProject` | end date after the project's end                  | `BAD_USER_INPUT` | `endDate`: `End date must be within project duration`     |
| `createCvProject`, `updateCvProject` | a role does not exist                             | `BAD_USER_INPUT` | `roleIds`: `Role not found`                               |
| `updateCvProject`, `deleteCvProject` | the CV project does not exist or is in another CV | `NOT_FOUND`      | `CV project not found`                                    |

Both date errors are returned together when both dates are wrong. Rules checked by the input DTO before the
service runs: `End date cannot be earlier than start date`, `At least one role must be selected`.

### CV PDF

| Operation       | Access         |
| --------------- | -------------- |
| `generateCvPdf` | Own or Admin † |

† The PDF is built from `CvPreviewService.getPreview`, which checks the CV with
`CvAccessService.getAccessibleCv`, so an Employee cannot export another user's CV by changing the `cvId` (wiki
CV Preview, AC-31, AC-49). The mutation is marked
`@AllowUnverified()`: it changes nothing, and the Preview it prints is readable without a verified email.
How the PDF is built: [pdf.md](../pdf.md).

Errors:

| Case                                   | Code                    | Message                                         |
| -------------------------------------- | ----------------------- | ----------------------------------------------- |
| `cvId` is not a UUID                   | `BAD_USER_INPUT`        | `fields: [{ field: 'cvId' }]`                   |
| `locale` is not a `Locale` value       | `BAD_USER_INPUT`        | GraphQL variable error, no `fields`             |
| the CV does not exist                  | `NOT_FOUND`             | `CV not found`                                  |
| an Employee asks for another user's CV | `FORBIDDEN`             | `You are not authorized to perform this action` |
| more than 10 requests a minute per IP  | `RATE_LIMITED`          | `Please wait before trying again`, `retryAfter` |
| Chromium failed or timed out           | `INTERNAL_SERVER_ERROR` | generic message, the error is logged            |

There is no incomplete-data error: the required CV data (name, education, description) is validated on create
and update, so every accessible CV can be exported (see [pdf.md](../pdf.md#incomplete-cv-data)).
