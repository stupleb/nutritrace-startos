# Updating the upstream version

Upstream is the NutriTrace image `ghcr.io/traceapps/nutritrace`, pinned in `startos/manifest/index.ts` (`images.nutritrace.source.dockerTag`). Upstream publishes only two image tags, `latest` (built from `main`, which carries the stable releases) and `dev`, so the pin is `latest` plus the digest of the build that matches the release.

## Determining the upstream version

The latest stable release is the newest GitHub release that is not a pre-release; the `vX.Y.Z-devNN` tags are pre-releases and are never packaged.

```bash
gh release list -R TraceApps/nutritrace --exclude-pre-releases --limit 1
```

## Applying the bump

1. Read the current `latest` index digest and the commit it was built from:

   ```bash
   docker buildx imagetools inspect ghcr.io/traceapps/nutritrace:latest --format '{{.Manifest.Digest}}'
   docker buildx imagetools inspect ghcr.io/traceapps/nutritrace:latest --format '{{json .Image}}' \
     | jq -r '.["linux/amd64"].config.Labels["org.opencontainers.image.revision"]'
   ```

2. Confirm that commit is the release. It must be the release tag's commit, or a later `main` commit whose diff from the tag touches no runtime code:

   ```bash
   gh api repos/TraceApps/nutritrace/compare/vX.Y.Z...<revision> --jq '.files[].filename'
   ```

   If `main` has moved on to code that is not in the release, wait for the next release rather than pinning it.

3. Set `dockerTag` to `ghcr.io/traceapps/nutritrace:latest@sha256:<index digest>`. Use the index (manifest list) digest, not a per-architecture one, so both `x86_64` and `aarch64` resolve.

4. Check that every variable `startos/main.ts` sets still exists with the same meaning: grep upstream's `server/` for each name (the `SMTP_*` names sit in a map in `server/email.js`, not after `process.env.`), and read its environment reference, `docs/nutritrace/env-vars.md` in `TraceApps/docs`. A renamed variable is ignored without an error.

5. Once the new build is installed, its log should open with `NutriTrace vX.Y.Z running on port 3001`.

6. Run **Set Admin Password** against the new build and sign in with the result. The action imports the image's own `/app/db.js`, `bcryptjs` and `/app/lib/claim-anonymous-data.js` and writes the `users` table directly (`setAdminScript` in `startos/utils.ts`), so an upstream move or schema change there breaks it when it runs, not when it builds.

7. Check that the setting keys and values **Set Regional Defaults** writes (`regionalSettings` and the option lists in `startos/utils.ts`) still match upstream's `src/stores/settings.js`, `src/routes/settings/Regional.svelte` and `src/routes/settings/ConnectedServices.svelte`. A renamed key or value is written without an error and ignored by NutriTrace.
