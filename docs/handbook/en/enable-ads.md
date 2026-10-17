---
title: "Chapter 7 · Enable Ads Responsibly"
description: "Check current publisher requirements, configure the template's ad slots, and verify privacy and user experience before enabling ads."
manual: learn
order: 7
icon: lucide:dollar-sign
tldr: "Review your site's content, privacy disclosures, and current publisher eligibility rules before applying. After approval, configure only the ad slots you intend to use, respect consent requirements, and verify the live experience on desktop and mobile. Publisher thresholds, payout methods, and tax steps vary; follow the current guidance in your account and official help center."
updated: 2026-10-17
---

## Where you are, and what this chapter covers

Your site is live and has real content. This chapter explains how to prepare for an ad network, configure the template's optional ad slots, and check that ads do not interfere with privacy choices or reading.

## Before applying

Publisher policies and application criteria can change, and may differ by product, region, and account. Review the current official rules before applying; do not treat a fixed article count, traffic number, or another publisher's experience as a guarantee.

- Check that your site has original, maintained content and that time-sensitive claims have current sources.
- Review your privacy policy and consent controls for the advertising and analytics services you actually use.
- Make sure important pages are reachable and the site works on mobile.
- Confirm current eligibility, supported regions, required ownership checks, and payment options in the publisher's official documentation and your account.

For platform comparisons and current official-source links, see the repository guide [docs/ads.md](https://github.com/HaydenGuo/GameWikiSoleTemplate/blob/main/docs/ads.md). Google's [publisher policies](https://support.google.com/adsense/answer/48182) and [payment threshold guidance](https://support.google.com/adsense/answer/1709871) are the authoritative sources for AdSense rules and account-specific payment thresholds.

## Configure the template's AdSense slots

The template reads the publisher and slot IDs from environment variables. Empty values keep the corresponding ad slot disabled. Use your deployment platform's environment-variable settings, then redeploy the site.

| Variable | Value |
|---|---|
| PUBLIC_ADSENSE_CLIENT | Your approved publisher ID |
| PUBLIC_ADSENSE_SLOT_STICKY | Slot ID for the sticky placement |
| PUBLIC_ADSENSE_SLOT_SIDEBAR | Slot ID for the sidebar placement |
| PUBLIC_ADSENSE_SLOT_INCONTENT | Slot ID for the in-article placement |

The exact variable names and deployment configuration are listed in [docs/deployment.md](https://github.com/HaydenGuo/GameWikiSoleTemplate/blob/main/docs/deployment.md#environment-variables). Enable only the placements you plan to use. Keep any credentials or account-specific values out of source control.

## Privacy and user experience

- Load advertising and analytics scripts only in ways permitted by the applicable privacy rules and the user's consent state.
- Do not bypass the consent component by pasting a third-party script directly into the page head.
- Avoid formats that obscure content, trigger unexpected navigation, or imitate system notices.
- Recheck the privacy policy whenever you add or remove a vendor.
- Inspect the live page on desktop and mobile, including the state where ads are blocked or unavailable.

For a different network, verify its current policy, supported formats, regional availability, and integration instructions in its official publisher account. Adsterra publishes its current publisher information at [adsterra.com/publishers](https://adsterra.com/publishers/); payment methods and minimums depend on the options shown in your account and its current [publisher payout guide](https://adsterra.com/blog/adsterra-minimum-payout-for-publishers/).

## Optional: comments and analytics

Comments, analytics, and advertising are separate options. Configure each only when you have a clear use for it and have reviewed its privacy requirements. See [docs/deployment.md](https://github.com/HaydenGuo/GameWikiSoleTemplate/blob/main/docs/deployment.md) for environment-variable setup and [docs/comments.md](https://github.com/HaydenGuo/GameWikiSoleTemplate/blob/main/docs/comments.md) for Giscus.

When analytics is enabled, confirm the tool is operating after consent where required. Check reports in the provider's dashboard; standard reports may not update immediately. Never infer consent or tracking behavior from the presence of a script alone.

## Review before publishing

1. Read the current official publisher rules and verify that the site is eligible.
2. Confirm that third-party scripts respect privacy choices and regional requirements.
3. Check ad positions, page performance, navigation, and readability on real devices.
4. Confirm the publisher dashboard shows the site and payment details in the expected state.
5. Recheck platform terms before each application or platform change.

This guide does not guarantee approval, revenue, or payment timing. For deeper integration and provider-selection guidance, see [docs/ads.md](https://github.com/HaydenGuo/GameWikiSoleTemplate/blob/main/docs/ads.md).
