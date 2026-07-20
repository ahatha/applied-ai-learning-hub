# Privacy checklist

Review this checklist before every public deployment or push to a GitHub Pages branch.

## Personal information

- [ ] No personal phone number
- [ ] No home address
- [ ] No private family information
- [ ] No personal email unless explicitly approved for public use
- [ ] No student email address

## University identifiers and access

- [ ] No LTU username / student ID
- [ ] No MFA status or setup details
- [ ] No Eduroam credentials
- [ ] No VPN credentials
- [ ] No Citrix or portal login details
- [ ] No private timetable
- [ ] No grades unless explicitly approved for publication
- [ ] No billing or payment information
- [ ] No student-only portal URLs that expose account flows

## Credentials and secrets

- [ ] No passwords or password hints
- [ ] No API keys or access tokens
- [ ] No `.env` files
- [ ] No database credentials
- [ ] No cloud credentials
- [ ] No private notes intended only for personal use

## Screenshots and media

- [ ] Screenshots do not show identifying account details
- [ ] No student portal screenshots with personal data
- [ ] Image EXIF / metadata checked for location or device leakage
- [ ] Alt text does not reveal private details

## Repositories, datasets, and links

- [ ] No private repository links
- [ ] No confidential employer or client material
- [ ] No patient names, IDs, or health records
- [ ] No proprietary claim or business datasets
- [ ] Only public, synthetic, or clearly approved datasets
- [ ] External links verified or marked as placeholders

## Academic and copyright checks

- [ ] No restricted course PDFs or slides
- [ ] No assignment solutions unless publication is allowed
- [ ] No copyrighted course content reproduced in full
- [ ] Official information attributed carefully and verified where possible

## Git hygiene

- [ ] `.gitignore` excludes secrets and local env files
- [ ] Git history does not contain accidentally committed credentials
- [ ] Large private exports are not staged for commit

## Final confirmation

- [ ] Site still includes the LTU non-endorsement disclaimer
- [ ] Contact page does not expose unintended personal contact details
- [ ] Status labels remain honest (no false “completed” claims)

Signed off by: _______________ Date: _______________
