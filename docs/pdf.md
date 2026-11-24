# CV PDF export

How the backend builds the PDF of a CV for the **Export PDF** button on the CV Preview page. Requirements come
from the CV Builder Wiki (Notion), CV Preview Page: Export PDF, Authorization & Security, States. The API
contract is `generateCvPdf` in [api/permissions.md](api/permissions.md#cv-pdf).

## How it works

```
generateCvPdf(cvId) → CvAccessService (NOT_FOUND / FORBIDDEN)
                    → CV data → HTML template → headless Chromium (Puppeteer) → PDF
                    → { fileName, content: base64 }
```

1. **Access.** `CvPdfService.generate` gets the CV through `CvAccessService.getAccessibleCv`, like `cv(id)`:
   `NOT_FOUND` for a missing CV, `FORBIDDEN` when an Employee asks for another user's CV. The owner is never taken
   from the request. Access is checked before Chromium is used.
2. **Data.** Until the CV Preview data service (B7) is ready, `cv-pdf.mapper.ts` builds the data from the CV and
   its owner, with empty languages, domains, skills and projects; the temporary type is `cv-preview.types.ts`.
   With B7 the PDF takes the same data as `cvPreview`, and incomplete data is rejected with `BAD_USER_INPUT`
   before rendering (wiki: the application must not generate an incomplete PDF).
3. **HTML.** `cv-pdf.template.ts` renders a full HTML page as a string. It is a port of the CV Preview components
   (`frontend/src/features/cvs/components/cv-preview/document/`): the same sections, the same rules for hiding
   empty values, the period as `MM.yyyy – Present`, the same list punctuation. Labels are English constants.
   Every value from the data goes through `escapeHtml` (`src/common/html/escape-html.ts`).
4. **Styles.** `cv-pdf.styles.ts` is a port of the Preview CSS modules with design tokens replaced by their values
   and the print palette. It adds the print rules: `@page { size: A4; margin: 16mm 14mm }`, a project and a skill
   category are never split between pages, the head of the skills table repeats on every page.
5. **Fonts.** Roboto (latin and cyrillic, the same files and unicode ranges as `frontend/src/app/layout.tsx`) is
   embedded into the page as base64 `@font-face` rules (`cv-pdf.fonts.ts`). The page loads nothing from the
   network, and a server without system fonts still renders the text.
6. **PDF.** `page.setContent(html)` and `page.pdf({ format: 'A4', printBackground: true })` in Chromium.
7. **Response.** `{ fileName, content }`: `content` is the PDF in base64, `fileName` is the CV name in kebab-case
   with `.pdf` (`toPdfFileName`, see [File name](#file-name)). The frontend turns `content` into a Blob and
   downloads it with `fileName`. The file is not stored anywhere.

### Keeping the PDF in sync with the Preview

The template and the styles are copies of the Preview markup and CSS. A change to
`frontend/src/features/cvs/components/cv-preview/document/**` (markup, CSS modules, labels in
`messages/en.json` → `cvs.preview.document`) needs the same change in `backend/src/cvs/cv-pdf/cv-pdf.template.ts`
or `cv-pdf.styles.ts`. Class names in the PDF have a block prefix (`summary__title`, `project__name`), because
the CSS modules reuse names like `.title` and `.value`.

### Browser lifecycle

- Chromium starts **lazily** on the first PDF, not when the app starts, so `pnpm dev`, unit tests and the other
  integration tests do not start it.
- One browser per process, reused for every PDF. The launch promise is cached, so parallel requests do not
  start two browsers. Every PDF gets its own page, closed in `finally`.
- `onModuleDestroy` closes the browser. `main.ts` calls `app.enableShutdownHooks()`, so it also happens on
  Ctrl+C, SIGTERM and `nest start --watch` restarts; without it a Chromium process stays behind.
- A failed launch stays cached until the backend restarts (accepted for now).

## Files

| File                                       | What it does                                                 |
| ------------------------------------------ | ------------------------------------------------------------ |
| `src/cvs/cv-pdf/cv-pdf.resolver.ts`        | `generateCvPdf(cvId)`, `@AllowUnverified()`, `ParseUUIDPipe` |
| `src/cvs/cv-pdf/cv-pdf.service.ts`         | access → data → HTML → PDF → base64; owns the browser        |
| `src/cvs/cv-pdf/cv-pdf.template.ts`        | HTML of the document; `splitResponsibilities`                |
| `src/cvs/cv-pdf/cv-pdf.styles.ts`          | CSS of the document                                          |
| `src/cvs/cv-pdf/cv-pdf.fonts.ts`, `fonts/` | Roboto `@font-face` rules and the woff2 files                |
| `src/cvs/cv-pdf/cv-pdf-file-name.ts`       | `toPdfFileName`                                              |
| `src/cvs/cv-pdf/cv-pdf.mapper.ts`          | **temporary** (until B7): CV → template data                 |
| `src/cvs/cv-pdf/cv-preview.types.ts`       | **temporary** (until B7): shape of the template data         |
| `src/common/html/escape-html.ts`           | HTML escaping, shared with the email templates               |

The resolver and the service are registered in `CvModule`, next to `CvAccessService`.

## File name

`toPdfFileName(name)` turns the CV name into kebab-case and adds `.pdf`, as in the wiki example
(`software-engineer-with-5-years-of-experience.pdf`):

| CV name                                        | File name                                          |
| ---------------------------------------------- | -------------------------------------------------- |
| `Software Engineer with 5 years of experience` | `software-engineer-with-5-years-of-experience.pdf` |
| `Senior (5+ years), React!`                    | `senior-5-years-react.pdf`                         |
| `Разработчик Ивана`                            | `разработчик-ивана.pdf`                            |
| empty, only symbols or emoji                   | `cv.pdf`                                           |

Anything that is not a letter or a digit becomes one hyphen, so characters not allowed in file names
(`/\:*?"<>|`) never reach the name; there are no repeated hyphens and none at the start or the end. Letters of
any alphabet stay as they are, lowercased (no transliteration). The name is cut to 100 characters before
`.pdf`.

## Settings and requirements

### Puppeteer version

- `puppeteer` is pinned to **24.x** (`^24.43.1`). Puppeteer 25 is published as ESM only; the backend and Jest run
  as CommonJS, and Jest cannot load it, which breaks every test that imports `AppModule`. Move to 25 together
  with moving the backend to ESM.
- `pnpm-workspace.yaml` → `allowBuilds: puppeteer: true`: without it pnpm skips the install script and no browser
  is downloaded.

### Browser download

- `pnpm install` runs the puppeteer install script, which downloads Chrome for Testing and
  `chrome-headless-shell` of the version that puppeteer expects into `~/.cache/puppeteer` (about 700 MB
  together). The backend uses `chrome-headless-shell` (`headless: 'shell'`).
- `PUPPETEER_SKIP_DOWNLOAD=true` skips the download. CI sets it in the jobs that never render a PDF (`lint`,
  `backend-test`, `backend.yml`); the unit tests mock puppeteer.
- After a puppeteer update old browser versions stay in `~/.cache/puppeteer`; they can be deleted by hand.

### Environment variables

| Variable                  | Default | Where          | Meaning                                                                                                   |
| ------------------------- | ------- | -------------- | --------------------------------------------------------------------------------------------------------- |
| `PUPPETEER_NO_SANDBOX`    | `false` | `backend/.env` | `true` starts Chromium with `--no-sandbox`. Only where the Chrome sandbox is unavailable (CI, containers) |
| `PUPPETEER_SKIP_DOWNLOAD` | unset   | install (CI)   | `true` skips the browser download on `pnpm install`                                                       |

`PUPPETEER_NO_SANDBOX` is validated in `config/env.validation.ts` and read through `ConfigService`. Keep the
sandbox on locally. GitHub Actions `ubuntu-24.04` runners do not allow the Chrome sandbox (AppArmor blocks user
namespaces), so `backend-integration` sets `PUPPETEER_NO_SANDBOX: true`.

### Server requirements

- Node 24, the same as the rest of the backend.
- The browser downloaded by `pnpm install` for the same OS as the server, or `PUPPETEER_SKIP_DOWNLOAD` plus a
  separately installed browser.
- On Linux: the system libraries that Chromium needs (`libnss3`, `libatk1.0-0`, `libgbm1` and others from the
  Puppeteer troubleshooting guide). Fonts are embedded, so no font packages are needed.
- Memory: Chromium with one page takes about 200–300 MB on top of the backend.

## Tests

- `cv-pdf.template.spec.ts`: HTML of the document (escaping, hidden empty sections, period, punctuation, skills
  table), `splitResponsibilities`.
- `cv-pdf-file-name.spec.ts`: `toPdfFileName`.
- `cv-pdf.service.spec.ts`: puppeteer is mocked. Access is checked before Chromium starts, one browser for
  sequential and parallel requests, the page is closed after an error, the sandbox flag, `onModuleDestroy`.
- `test/cv-pdf.int-spec.ts`: real Chromium and the test database. Own CV → `%PDF-`, another user's CV →
  `FORBIDDEN` (wiki AC-31, AC-49), Admin, unverified user, `NOT_FOUND`, `BAD_USER_INPUT` for a non-UUID id,
  `UNAUTHENTICATED`.

## Checking by hand

The Apollo Sandbox page at `/graphql` runs on another origin, so the auth cookies are not sent. Sign in on the
frontend (`http://localhost:3000`) and run in the browser console:

```js
const res = await fetch('http://localhost:4000/graphql', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'mutation ($cvId: ID!) { generateCvPdf(cvId: $cvId) { fileName content } }',
    variables: { cvId: '<id of your CV>' },
  }),
});
const { data, errors } = await res.json();
if (errors) console.log(errors);
else {
  const bytes = Uint8Array.from(atob(data.generateCvPdf.content), (c) => c.charCodeAt(0));
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
  link.download = data.generateCvPdf.fileName;
  link.click();
}
```

## Open

- **Data and incomplete-data rule** come with B7 (`CvPreviewService`): replace `cv-pdf.mapper.ts` and
  `cv-preview.types.ts`, add the `BAD_USER_INPUT` check and its test.
- **Language.** The PDF is always in English, while the Preview follows the UI language.
