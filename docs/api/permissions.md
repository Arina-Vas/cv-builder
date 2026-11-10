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
- **Catalogs** (departments, positions, skills, skill categories, languages, projects, project roles) are readable by
  every authenticated user; changing them is Admin-only. The wiki defines only the Admin management pages; read
  access for employees follows from the forms that use the catalogs (department and position in the profile,
  "available skills" and "available languages" in the Add modals).
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
readable by every authenticated user and changed "own or Admin"; catalog changes are Admin-only.

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

| Action                      | Employee, own profile | Employee, another profile | Admin                 |
| --------------------------- | --------------------- | ------------------------- | --------------------- |
| View                        | ✅                    | ✅                        | ✅                    |
| Update profile information  | ✅                    | ❌                        | ✅ any user           |
| Upload or change avatar     | ✅                    | ❌                        | ✅ any user           |
| Initiate email verification | ✅                    | ❌                        | ❌ only the owner can |

### User skills and languages

| Action                                  | Employee, own profile | Employee, another profile | Admin       |
| --------------------------------------- | --------------------- | ------------------------- | ----------- |
| View                                    | ✅                    | ✅                        | ✅          |
| Add, update level, remove (one or many) | ✅                    | ❌                        | ✅ any user |

The personal Skills and Languages pages work only with the current user's own data, for both roles. Admins manage
other users' skills and languages through the User Details tabs.

### Catalogs

| Action                                                                     | Employee | Admin |
| -------------------------------------------------------------------------- | -------- | ----- |
| Read departments, positions, skills, skill categories, languages, projects | ✅       | ✅    |
| Create, update, delete departments, positions, skills, languages, projects | ❌       | ✅    |

### CVs

| Action                                         | Employee       | Admin            |
| ---------------------------------------------- | -------------- | ---------------- |
| View, search, sort the CV list                 | own CVs only   | all CVs          |
| View a CV (details, skills, projects, preview) | own CVs only   | any CV           |
| Create a CV                                    | for themselves | for any employee |
| Update, delete a CV and its skills / projects  | own CVs only   | any CV           |
| CVs tab of a selected employee (User Details)  | ❌             | ✅               |

In the User CVs tab every operation is scoped to the selected employee; the backend rejects a CV of another employee
even for an Admin (wiki: "The Admin must not be able to use this page to create or modify a CV for another employee
by changing a client-supplied user ID").

### Authentication and settings

| Action                                               | Access                                            |
| ---------------------------------------------------- | ------------------------------------------------- |
| Sign up, sign in, refresh, forgot and reset password | Public                                            |
| Sign out                                             | Public, revokes the session of the refresh cookie |
| Verify email, resend code                            | authenticated, email not verified yet (own only)  |
| Current user (`me`)                                  | authenticated, verified or not                    |
| Theme and language preferences                       | authenticated, own only, verified or not          |
| Change password                                      | authenticated, own only, verified email           |

"Public" for the Email Verification page in the wiki access table means no role is required; the verify and resend
operations still need the session started at sign-up, because the backend takes the user from the auth context
([auth.md](../auth.md#sign-up-and-email-verification)).

## Operations

Operation-level tables are added by each module together with its resolvers: the operation name and its access
(**All**, **Admin**, **Own or Admin**, **Public**), matching the rules above.

### Users

| Operation    | Access |
| ------------ | ------ |
| `users`      | All    |
| `user`       | All    |
| `createUser` | Admin  |
| `updateUser` | Admin  |
| `deleteUser` | Admin  |

Errors thrown by the service, besides the [protected users](#users) rules:

| Operation                  | Case                          | Code             | Message                                     |
| -------------------------- | ----------------------------- | ---------------- | ------------------------------------------- |
| `user`                     | the user does not exist       | `NOT_FOUND`      | `User not found`                            |
| `createUser`               | the email is taken            | `CONFLICT`       | `An account with this email already exists` |
| `createUser`, `updateUser` | the department does not exist | `BAD_USER_INPUT` | `Department not found` (`departmentId`)     |
| `createUser`, `updateUser` | the position does not exist   | `BAD_USER_INPUT` | `Position not found` (`positionId`)         |
| `updateUser`, `deleteUser` | the user does not exist       | `NOT_FOUND`      | `User not found`                            |

The email message is the Sign Up one: the Create user modal has no text for a taken email. "Change own role" is
checked only when `role` differs from the caller's current role, because the Update user modal always sends `role`.

The Profile tab mutation (first / last name, department, position; own profile or Admin) is added with the Profile
module.

### Departments

| Operation          | Access |
| ------------------ | ------ |
| `departments`      | All    |
| `createDepartment` | Admin  |
| `updateDepartment` | Admin  |
| `deleteDepartment` | Admin  |

### Positions

| Operation        | Access |
| ---------------- | ------ |
| `positions`      | All    |
| `createPosition` | Admin  |
| `updatePosition` | Admin  |
| `deletePosition` | Admin  |

### Languages

| Operation        | Access |
| ---------------- | ------ |
| `languages`      | All    |
| `createLanguage` | Admin  |
| `updateLanguage` | Admin  |
| `deleteLanguage` | Admin  |

### Skills

| Operation         | Access |
| ----------------- | ------ |
| `skills`          | All    |
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

### Projects

| Operation       | Access |
| --------------- | ------ |
| `projects`      | All    |
| `technologies`  | All    |
| `createProject` | Admin  |
| `updateProject` | Admin  |
| `deleteProject` | Admin  |
