# Wedding Check-In

A modern wedding guest management and event check-in platform built with Next.js, Supabase, and TypeScript.

Wedding Check-In allows event organizers to manage guests, generate digital invitations with unique QR codes, and check guests in quickly using a mobile-friendly QR scanner.

---

## Features

### Authentication

- Supabase authentication
- Persistent login sessions
- Automatic routing based on authentication state
- Role-based access control
- Organization membership support
- Owner, admin, and staff roles
- Logout functionality

### Organizations

Organizations represent the event organizer or wedding host.

Organization owners and administrators can:

- Manage events
- Manage guests
- Generate invitations
- Manage invitation status
- Manage check-in activity
- Access the administrative dashboard

### Events

Each organization can manage its events.

Events support:

- Event name
- Event date
- Organization association
- Active/archived state
- Guest management
- Invitation management
- Event check-in

### Guest Management

Guests can be:

- Added individually
- Imported through CSV
- Deleted individually
- Selected in bulk for deletion
- Categorized
- Assigned a status
- Assigned a plus-one

Guest information includes:

- First name
- Last name
- Email
- Phone
- Category
- Plus-one status
- RSVP/check-in status

### Digital Invitations

Invitations use secure, unique tokens.

Each invitation:

1. Is generated for a guest
2. Receives a cryptographically secure token
3. Stores the token in the database
4. Stores a SHA-256 hash for token verification
5. Can be shared through WhatsApp
6. Can be copied as a URL
7. Can be opened directly by the guest
8. Contains a QR code used for event check-in

Invitations can be generated:

- Individually
- In bulk

An invitation is generated only once for a guest.

### Guest Invitation Page

Guests can open their invitation using a URL such as:

```text
/invite/{token}