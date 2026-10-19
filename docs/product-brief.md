# Product brief: event listings prototype

## Problem and audience

Small community organizers need a straightforward way to publish an event and correct its details. Visitors need clear information about what is happening, when, where and who is organizing it.

These are design assumptions for an original portfolio demonstration. No customer interviews, production usage or commercial results are claimed.

## Goal

Demonstrate the complete event-listing workflow with clear ownership boundaries: browse, sign in, publish, review, edit and delete.

## Users

| User | Main task | Boundary |
| --- | --- | --- |
| Visitor | Browse listings and read details | Cannot create categories, mutate events or upload files anonymously |
| Organizer | Publish and manage their events | Cannot change another organizer's event |
| Maintainer | Configure development services | Keeps credentials and private data outside the repository |

## Scope decisions

The prototype includes event listings, categories, images and organizer controls. It excludes streaming, video delivery, payment processing, ticket checkout and private client integrations.

Price is an informational event field. It does not represent a working purchase feature.

## Acceptance criteria

| Scenario | Expected result | Current evidence |
| --- | --- | --- |
| Anonymous mutation | Creation, updates and deletion are rejected before writes | Unit tests |
| Forged organizer ID | Creation uses the verified session's database user | Unit tests |
| Update or delete another organizer's event | Database operation requires matching event ID and owner; no match is rejected | Unit tests with mocked persistence; two-account integration check pending |
| Extra organizer, creation date or operator fields | Server schema strips non-editable fields | Unit tests |
| Invalid schedule, paid price, category ID or URL | Validation rejects the mutation | Unit tests |
| Anonymous upload | Upload middleware rejects the request | Unit tests; provider integration pending |
| Edit an existing event | Current category and dates appear in the form | Code change; browser integration check pending |

## Next backlog

1. Verify the configured Clerk, MongoDB and UploadThing integration using two test accounts.
2. Improve synchronization idempotency and account-deletion relationship handling.
3. Add listing search, category filters and pagination.
4. Complete accessible labels, keyboard checks and responsive screenshots.
5. Publish a synthetic-data demo and record a short walkthrough.

## Portfolio explanation

Describe this as a personal prototype improved with AI-assisted development. Explain the ownership decision, validation tradeoffs and remaining integration work. Show the implementation and tests, and keep authorship and limitations explicit.
