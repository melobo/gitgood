# GitGood Invoice Processing API

A cloud-based REST API for generating, converting, validating, finalising, and downloading **UBL 2.1 compliant** electronic invoices. Built with Node.js, Express, TypeScript, AWS DynamoDB, and S3.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running the Server](#running-the-server)
- [Running Tests](#running-tests)
- [API Reference](#api-reference)
- [Invoice Lifecycle](#invoice-lifecycle)
- [Project Structure](#project-structure)
- [Deployment](#deployment)

---

## Overview

The GitGood Invoice API allows suppliers to:

- Create invoices from manually entered data
- Convert invoices into UBL 2.1 XML format
- Validate invoice data for correctness
- Finalise and download invoices (XML or JSON)
- Manage user accounts with session-based authentication

All endpoints (except health check, register, and login) require an API key passed via the `x-api-key` header.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Express |
| Database | AWS DynamoDB |
| File Storage | AWS S3 |
| Testing | Jest + ts-jest |
| XML Generation | fast-xml-parser |
| API Docs | Swagger UI (OpenAPI 3.0) |
| Backend Hosting | AWS EC2 |
| Frontend Hosting | Vercel |

---

## Getting Started

### Prerequisites

- Node.js v18+
- npm
- AWS account with DynamoDB and S3 configured (for non-test environments)

### Installation

```bash
git clone <repo-url>
cd backend
npm install
```

### Environment Setup

Copy the example environment files and fill in your values:

```bash
cp .env.example .env
cp .env.test.example .env.test
```

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `PORT` | Port the server listens on | `3000` |
| `NODE_ENV` | Environment (`development`, `test`, `production`) | `development` |
| `API_KEY` | API key required in request headers | `your_api_key` |
| `AWS_ACCESS_KEY_ID` | AWS credentials | — |
| `AWS_SECRET_ACCESS_KEY` | AWS credentials | — |
| `AWS_REGION` | AWS region | `ap-southeast-2` |
| `DYNAMO_TABLE` | DynamoDB table for invoices | `invoices` |
| `USER_TABLE` | DynamoDB table for users | `users` |
| `SESSION_TABLE` | DynamoDB table for sessions | `sessions` |
| `S3_BUCKET` | S3 bucket for UBL XML files | `your-bucket-name` |

> In `test` mode, all AWS calls are intercepted by in-memory stores — no real AWS credentials are needed.

---

## Running the Server

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

The server will start at `http://0.0.0.0:3000` by default.

Swagger documentation is available at `http://localhost:3000/docs` (disabled in production via `SHOW_DOCS=false`).

---

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage report
npm run test -- --coverage
```

Tests require **85%+ line coverage** (enforced via Jest config). In test mode, all DynamoDB and S3 operations use in-memory stores — no AWS infrastructure is needed.

### Test Architecture

- **System tests** — test API endpoints end-to-end via HTTP (using `sync-request-curl`)
- **Unit tests** — test individual service functions in isolation
- A real Express server is spawned by `jest.global.setup.ts` before the test suite runs and torn down afterwards

---

## API Reference

Full interactive documentation is available via Swagger UI at `/docs` when running locally.

### Authentication

All protected routes require:
```
x-api-key: <your-api-key>
```

User-scoped routes additionally require a `session` header obtained from login/register.

---

## Invoice Lifecycle

Invoices move through the following states:

```
draft → converted → validated → finalised
```

| State | Description |
|---|---|
| `draft` | Invoice created, can be edited freely |
| `converted` | Converted to UBL 2.1 XML and stored in S3 |
| `validated` | Data validated for correctness (ABN, totals, payment details, etc.) |
| `finalised` | Locked and ready to download |

An invoice can only be downloaded in `finalised` state.

---

## Deployment

| Layer | Provider | URL |
|---|---|---|
| Frontend | Vercel | https://www.gitgood26.site |
| Backend API | AWS EC2 | http://3.107.81.173:3000 |

### Backend (AWS EC2)

The Express API runs on an EC2 instance. Ensure the following when deploying:

- Set `NODE_ENV=production` and `IP=0.0.0.0` so the server binds to all interfaces
- Set all required environment variables (see [Environment Variables](#environment-variables))
- The EC2 security group must allow inbound traffic on the configured port (default `3000`)

### Frontend (Vercel)

The frontend is deployed on Vercel with the custom domain `gitgood26.site`. To redeploy:

1. Connect your Git repository to Vercel
2. Set any required environment variables (e.g. the backend API base URL) in the Vercel dashboard
3. Vercel will automatically redeploy on push to the main branch

---

## Notes

- Passwords are hashed with SHA-256 before storage
- Valid banks: `ANZ`, `CommBank`, `Westpac`, `StGeorge`, `ApplePay`, `NAB`, `PayPal`
- Valid payment methods: `bank_transfer`, `direct_debit`, `credit_card`
- BSB numbers must be in `NNN-NNN` format
- ABNs must be exactly 11 digits
- Tax rate is a decimal between 0 and 1 (e.g. `0.1` for 10% GST)