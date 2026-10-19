# Morocco Events Platform

A personal web development prototype for discovering and managing event listings in Morocco. It demonstrates event forms, database-backed CRUD, authentication integration and organizer ownership checks.

This is portfolio and learning work. It is not a delivered client product, and it contains no Fanzone implementation or confidential material.

## Current scope

- Browse event listings and view event details.
- Sign in through Clerk.
- Create categories and events with a synchronized account.
- View your events at `/profile`.
- Update or delete events you own.
- Upload one image of up to 4 MB through UploadThing.

Event prices are descriptive listing data. Checkout, ticket purchases and payment processing are not implemented. Search, category filtering and listing pagination remain future work.

## Technology

Next.js 15.5.28, React 18, TypeScript, Tailwind CSS, MongoDB/Mongoose, Clerk, UploadThing, React Hook Form and Zod. The test suite uses Vitest.

Use Node.js 24 LTS for development and tests.

## Local setup

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env.local` and enter your own development values.
3. Create a separate MongoDB database for this demo. The database name used by the app is `MoroccoEvents`.
4. Configure a Clerk development application and its sign-in/sign-up URLs. Register `/api/webhook/clerk` for the `user.created`, `user.updated` and `user.deleted` events. Put that endpoint's signing secret in `WEBHOOK_SECRET`.
5. Configure an UploadThing development application and put its token in `UPLOADTHING_TOKEN`. If its file host differs from `utfs.io`, add the exact host to `next.config.ts` before using it.
6. Run `npm run dev` and open `http://localhost:3000`.

Clerk and the database must be synchronized before an account can create categories or manage events. Session ownership is resolved by looking up the verified Clerk user ID in MongoDB. A custom database user ID claim in the session is not required.

Use synthetic events, names and images you have permission to use. Do not connect an employer's accounts, production database or storage. Never commit `.env.local` or provider secrets.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm test` | Run unit tests |
| `npm run test:watch` | Run tests while developing |
| `npm run typecheck` | Check TypeScript |
| `npm run build` | Build the application |
| `npm start` | Run a completed production build |

A full build needs valid development configuration. The Google font used by the app also requires network access during the build.

## Access controls and validation

Mutation actions authenticate on the server. Event creation uses the signed-in account's database identity. Updates and deletions match both the event ID and organizer in the database operation. Input validation accepts only declared editable event fields, checks dates and prices, and rejects non-HTTP links. Uploads require a verified Clerk session.

User synchronization helpers are server-only modules used by the signed webhook handler. They are not exported as callable Server Actions.

Unit tests cover signed-out requests, forged owner IDs, writes without an owned event match, invalid event input and upload authentication. Database/provider integration still needs verification with real development accounts.

## Product decisions

See [the product brief](docs/product-brief.md) for the intended users, scope, acceptance criteria and remaining work.

## Before publishing a live demo

- Verify the two-account workflow: one organizer must not edit or delete the other's events.
- Test Clerk webhook delivery, retries, profile updates and account deletion. Webhook synchronization and relationship cleanup still need a fuller review.
- Test real image uploads and host configuration.
- Review dependency advisories and rate limits.
- Finish accessible form labels, error handling and navigation checks.
- Add synthetic data and verify mobile layouts.

The application is a prototype. Passing unit tests and TypeScript checks do not establish that the full hosted integration works.

## Maintenance references

- [Next.js authentication and authorization guidance](https://nextjs.org/docs/app/guides/authentication)
- [Next.js 15.5.28 security release](https://nextjs.org/blog/nextjs-security-update-october-14-2026)
- [Clerk Server Actions](https://clerk.com/docs/reference/nextjs/app-router/server-actions)
- [UploadThing file routes](https://docs.uploadthing.com/file-routes)
