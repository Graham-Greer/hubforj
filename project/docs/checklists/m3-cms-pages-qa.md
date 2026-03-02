# M3 CMS Pages Manual QA (Minimum)

1. Open `/platform/hubs/{hubId}/cms` as superadmin and create a new custom page.
2. Edit page settings (title, slug, SEO title/description/image) and save draft.
3. Add blocks via BlockPicker, reorder with drag handle, and edit block fields with structured forms.
4. Use Media Library to select media for block fields and SEO image.
5. Set global header/footer variants for the hub and save.
6. Set per-page header/footer overrides and save draft.
7. Open draft preview and verify effective header/footer match override-or-global selection.
8. Publish page and verify live route renders published composition at `/{hubSlug}/pages/{pageSlug}` with matching header/footer.
9. Verify custom-domain `/pages/{pageSlug}` also renders published composition for mapped host with matching header/footer.
10. Attempt publish with media missing alt text and verify publish is blocked with a safe error.
11. Verify media usageRefs/usageCount update after save/publish.
12. Verify hub-admin route `/{hubSlug}/admin/cms` remains locked and does not expose CMS editing.
13. In Media Library, create a folder, rename it, and delete it; verify delete moves assets back to “All assets”.
14. Verify `Missing alt` and `Recently added` tabs return expected assets and search matches filename/alt/folder.
15. Attempt deleting a media asset with `usageCount > 0` and verify delete is blocked with usage references shown.
