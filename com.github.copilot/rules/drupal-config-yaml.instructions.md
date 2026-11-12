---
description: "Use when editing Drupal exported configuration YAML. Covers readable values, schema-aware edits, complete diffs, and safe deployment."
---

# Drupal Config YAML Rules

## Forbidden characters

For new or changed human-readable `label`, `description`, and help-text values,
use plain hyphens and straight quotes instead of the characters below. Do not
rewrite existing translated/editorial content, URLs, code snippets, or opaque
machine values solely to remove punctuation.

| Character | Name | Use instead |
|---|---|---|
| `—` | em dash | ` - ` (space-hyphen-space) |
| `–` | en dash | ` - ` |
| `"` `"` | curly double quotes | `"` |
| `'` `'` | curly single quotes | `'` |

Before finishing any edit, scan every string value you touched. If in doubt,
run an audit scoped to the project's profile-defined config directory:
```bash
grep -Prln "[\x{2013}\x{2014}\x{201C}\x{201D}\x{2018}\x{2019}]" APPROVED_CONFIG_DIRECTORY/
```

## YAML string quoting

- Use single quotes `'...'` for most string values in Drupal config.
- If the value itself contains a single quote, use double quotes `"..."` instead.
- Avoid block scalars (`|` or `>`) in Drupal config YAML unless the target config schema explicitly expects multi-line literal content.
- Exception: Webform config commonly requires block scalars for keys such as `elements: |` and `options: |` in `webform.webform.*.yml` and `webform.webform_options.*.yml`.
- Never truncate an existing config file when making edits. Always read the full file before replacing any section.

## After any config edit

1. Review the complete diff and confirm the intended sync directory/environment.
2. Do not run `drush cim`, `drush cex`, or `drush updb` automatically. These commands
   change active configuration, files, or database state. Run them only when the user
   requests the operation or explicitly approves it for the intended local environment.
3. A configuration-only change does not by itself require `drush updb`. Run database
   updates only when the relevant code/update path requires them and the user approves.
4. After an approved import, rebuild cache and report the command result.

## Domain-Specific Rules

For specific config types, additional rules may apply:
- **Blocks:** See `drupal-blocks.instructions.md`
- **Paragraphs:** See `drupal-paragraphs.instructions.md`
- **Editorial form displays and admin styling:** See `drupal-editorial-ux.instructions.md`
- **Webforms:** See `drupal-webforms.instructions.md`
- **Responsive Images:** See `drupal-responsive-images.instructions.md`
- **SDC Components:** See `drupal-sdc-components.instructions.md`

These domain-specific instructions provide additional constraints beyond the
general YAML rules defined here. Read the project profile for the actual sync
directory and target commands; never use the placeholder as a shell argument.
