# Security baseline

- Secrets stay in ignored environment files; `.env.example` contains names only.
- Admin mutations require a signed, HTTP-only server session.
- Mesh and wardrobe writes require an admin session; mesh destinations are contained and payloads size-limited.
- Response headers provide clickjacking, MIME-sniffing, referrer and browser-permission protections plus a CSP compatible with the mounted YouTube player.
- Payment callback logs avoid receipts and phone numbers.
