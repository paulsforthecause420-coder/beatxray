# Recovery Order

1. Freeze deployments and writes when necessary.
2. Identify the last known-good application and migration versions.
3. Create a replacement provider project.
4. Apply migrations from zero.
5. Restore compatible data only.
6. Recreate secrets by name, never from source control.
7. Deploy worker and web staging.
8. Run RLS, billing, upload, processing, and download smoke tests.
9. Switch domains and environment references.
10. Monitor and document the incident.
