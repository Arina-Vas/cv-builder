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
- **Admin-only** operations are marked with `@Roles(UserRole.ADMIN)`; the roles guard (Auth task) checks them.
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
which page the menu opens for each role. API access does not depend on the page: user skill and language operations
are "own or Admin", catalog changes are Admin-only.

## Rules per feature

What each role may do, from the Scope and Permissions sections of the wiki pages.

### Users

| Action                            | Employee | Admin |
| --------------------------------- | -------- | ----- |
| View, search, sort the users list | ✅       | ✅    |
| View user details                 | ✅       | ✅    |
| Create, update, delete users      | ❌       | ✅    |

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
