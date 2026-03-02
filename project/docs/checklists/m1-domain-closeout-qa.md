# M1.5 Domain Close-out QA Checklist

Use this checklist after deploying the M1.5 close-out slice.

## Domain add + resolve
- [ ] Add a custom domain in `/platform/hubs/{hubId}` and save.
- [ ] Request `/` with `Host` set to that domain.
- [ ] Confirm hub placeholder shell renders (no 404).

## Duplicate prevention
- [ ] Attempt to add a domain already used by another hub.
- [ ] Confirm save is rejected with a safe error message.
- [ ] Attempt same-domain variants (`example.com` and `www.example.com`) on one hub.
- [ ] Confirm canonical duplicate is rejected.

## Admin block on custom domain
- [ ] Request any admin or platform route from the custom domain host.
- [ ] Confirm admin/platform access is blocked with a clear message.

## Domain removal
- [ ] Open hub config and click Remove on a configured domain.
- [ ] Confirm `ConfirmModal` appears before removal.
- [ ] Confirm removal succeeds and domain no longer resolves to that hub.

