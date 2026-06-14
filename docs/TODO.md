# TODO:

- Remove torch and RAM++, if not used
- Python project .env (change llm models etc)
- Shared envs in one place
- Every picture only once mode
- Pick specific picture for croquis
- Show how many pictures are for a tag when filtering
- Random picture with all tags (current is some tags)
- tests
- ssl
- better blob storage client
- better migrate port
- better empty db state
- Better CSFR https://dev.to/maxiviper117/implementing-csrf-protection-in-sveltekit-3afb
- Label llm services (llm, prod)
- Label prod services (backups, llms)
- Wide events
- Stack robustness (will this work after 10 years?)

## Bonus:

1. Cloudflare automatic terraform infra
2. Extension to autoupload (pinterest, google, screenshots etc.)
3. Throttle large uploads (or queue them, currentyl you can upload infinite images)
4. Query robustness:
   - Transactions
   - Delete images that are not uplaoded to db
5. 3D models (poser)
6. Edit image name
7. Cleanup all dangling pictures in blob storage
8. Update postgres
9. Learning portal? (Personal notes)
