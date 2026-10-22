# Store screenshot captures

Version **1.2.0 (202610221728)** has three native iPhone screenshots and three native iPad screenshots uploaded and processed in App Store Connect. Both sets remained present after reopening the version through Apps. The matching signed and simulator artifacts passed metadata and privacy inspection before capture.

The iPhone set shows the fictional Maple House property, its complete furnace-filter note, and the maintenance task list. The iPad set shows the property, note library, and maintenance task list. All records are synthetic; no real addresses, personal photos, email addresses, receipts, or purchase dialogs appear.

The captures came from Device Hub's native Screenshot control on iPhone 18 Pro and iPad Pro 13-inch (M5), running the exact candidate simulator app. Raw PNG captures were retained. Because the native PNGs include an alpha channel, `sips` converted copies to opaque JPEG at full quality, without resizing, cropping, or changing UI content.

| Slot                                       | Native size | Processed screenshots |
| ------------------------------------------ | ----------- | --------------------- |
| iPhone with Dynamic Island, medium display | 1206 × 2622 | 3                     |
| iPad 13-inch                               | 2064 × 2752 | 3                     |

The local capture manifest and files are saved outside the repository in `beta-outreach-results/app-store/screenshots-202610221728/`. Dimensions and absence of alpha were verified before upload. These match Apple's [screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications).

Separate annual and monthly subscription review images were captured from the native Account UI on the iPhone 18 Pro simulator running the matching simulator build 202610221728, with live localized Apple products. The annual and monthly selections were captured individually. Both images were uploaded to their matching App Store Connect review screenshot fields and processed. Source PNGs, upload JPEGs, and hashes are recorded in `beta-outreach-results/app-store/subscription-review-202610221728/capture-manifest.json`. The screenshots document displayed prices and purchase options; they do not prove restore, backend account binding, or quota enforcement. The real generated AI plan remains saved and was verified on both devices, but is not part of the uploaded marketing set.

Due dates are stored; the listing does not imply that notifications are delivered. Sharing and transfer are included free and require an existing recipient HomeDoc account. No real transfer was performed for these captures.
