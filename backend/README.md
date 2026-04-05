# Invoice Processing API

A RESTful microservice for creating, managing, converting, validating, finalising, and downloading UBL 2.1 compliant invoices. Built by **GitGood** for SENG2021.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Local Setup](#local-setup)
- [Branching Convention](#branching-convention)
- [Coding Standards](#coding-standards)
- [Error Handling](#error-handling)
- [Testing](#testing)
- [Deployed Service](#deployed-service)

---

## Project Overview

The Invoice Processing API is a cloud-based service that allows suppliers to automatically generate, transform, and validate electronic invoices compliant with the **UBL 2.1** (Universal Business Language) standard. It is designed for integration into broader digital trade ecosystems, targeting small and medium-sized enterprises (SMEs) and developer teams who need a plug-in invoicing module.

**Core workflow:** `draft → convert → validate → finalise → download`

**Tech stack:**
- **Deployment:** Render
- **Server/API Layer:** Node.js + Express
- **Application Layer:** fast-xml-parser, AWS SDK for JS
- **Persistence Layer:** AWS DynamoDB + S3 (just using In-File JSON File for Sprint 2)

---

## Local Setup

1. **Clone the repository**

```bash
git clone <repository-url>
cd <repository-name>
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

4. **Run the development server**

```bash
npm run dev
```

The server will start at `http://localhost:3000`.

5. **Run tests**

```bash
npm test
```

---

## Branching Convention

All branches must follow the pattern:

```
sprint2-<name>-<function>
```

**Examples:**
```
sprint2-asna-postInvoice
sprint2-grace-deployment
sprint2-meryl-getInvoice
sprint2-ananya-unitTests
sprint2-rutva-convertEndpoint
```

All merges into `main` must be done via a **merge/pull request** reviewed and approved by at least one other team member.

---

## Coding Standards

- **Naming:** camelCase for all variables, functions, and file names
- **Tests:** All tests must be HTTP-level tests using the request functions from `httpWrapper.ts`
- **Server routes:** All route handlers must include a `try/catch` block using `handleError` from `error.ts`
- **Business logic functions:** Must throw `ServerError` from `error.ts` — do **not** use `handleError` directly inside functions
- **Style:** DRY, KISS, meaningful names, proper modularisation

---

## Error Handling

All errors follow a consistent structure:

```json
{
  "error": "<ERROR_CODE>",
  "message": "<Human-readable description>"
}
```

| HTTP Status | Error Code | Description |
|---|---|---|
| 400 | `INVALID_REQUEST` | Missing or invalid request fields |
| 404 | `NOT_FOUND` | Resource does not exist |
| 409 | `INVALID_REQUEST` | Workflow state conflict (e.g. already converted) |
| 422 | `INSUFFICIENT_DATA` | Insufficient data to complete the operation |
| 500 | `INTERNAL_SERVER_ERROR` | Unexpected server-side error |

**Implementation pattern:**

```typescript
// In server route handlers — use handleError from error.ts
router.post('/invoice', (req, res) => {
  try {
    const result = await createInvoice(req.body);
    res.status(201).json(result);
  } catch (err) {
    handleError(err, res);
  }
});

// In business logic functions — throw ServerError from error.ts
  if (!data.buyerName) {
    throw new ServerError(400, 'INVALID_REQUEST', 'Missing or Invalid Fields');
  }
};
```

---

## Testing

All tests are HTTP-level integration tests using the request functions from `httpWrapper.ts`.

**Run all tests:**

```bash
npm test
```

**Run with coverage:**

```bash
npm run start-coverage
```

The project targets **>85% code coverage**. Coverage reports are generated in the `/coverage` directory.

Test files are located in the `tests/` directory and follow the naming convention `<featureName>.test.ts`.

---

## Deployed Service

The API is publicly available at:

```
https://gitgood.onrender.com/docs/
```

---

## Team

| Member | Role |
|---|---|
| Rutva Molkar | Product Owner |
| Meryl Lobo | Scrum Master |
| Grace Thomas | Software Architect |
| Asna Hassan | Developer & Delivery Manager |
| Ananya Narayanaswamy | Tester |
