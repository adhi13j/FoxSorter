# FoxSorter

FoxSorter is a browser extension project for organizing tabs into user-defined categories and saved sessions.

The repository currently contains the extension interface and a JavaScript file structure for future implementation. The JavaScript files are placeholders and contain comments only. No tab sorting, persistence, messaging, or session management logic is implemented yet.

## Project Status

| Area | Status |
| --- | --- |
| Popup layout | Present in `Fox/popup.html` |
| Popup styling | Present in `Fox/popup.css` |
| Extension metadata | Present in `Fox/manifest.json` |
| Extension icons | Present under `Fox/images/` and referenced by the manifest |
| Task-specific JavaScript files | Present under `Fox/scripts/` as comment-only placeholders |
| Popup behavior | Not implemented |
| Background behavior | Not implemented |
| Tab sorting | Not implemented |
| Category storage | Not implemented |
| Saved sessions | Not implemented |
| Automated tests | Not present |
| Build system or package manager | Not present |

The current manifest references `background.js`, but that file is not present in the repository. The background placeholder is currently named `Fox/scripts/background-service.js`. This mismatch must be resolved before the extension can be loaded reliably.

## Interface Functions

The popup markup currently provides controls and screens for the following functions. These are interface elements only until their corresponding scripts are implemented.

- Display the current tab's domain, title, favicon, and category.
- Display the number of tabs in the current window.
- Open a category picker for the current tab.
- Choose among the initial categories: Study, Entertainment, Hobbies, and Neutral.
- Request that tabs be sorted immediately.
- Enable or disable automatic sorting when a session starts.
- Enable or disable sorting when new tabs are opened.
- Browse category counts and associated domains.
- View and change the category sorting order.
- Open a selected saved session.
- Browse saved sessions.
- Open, rename, or delete a saved session from the sessions screen.
- Save the current browser window as a session.
- Enable or disable FoxSorter from the popup header.

## Planned Script Responsibilities

Each file in `Fox/scripts/` has one intended responsibility. The files currently contain English comments describing those responsibilities and no executable logic.

| File | Intended responsibility |
| --- | --- |
| `popup-navigation.js` | Switch between popup screens and return to the home screen |
| `current-tab.js` | Read the active tab and update its title, domain, favicon, category, and tab count |
| `categorization.js` | Control the category picker and save a category for a domain |
| `tab-sorting.js` | Ask the background context to sort tabs |
| `sort-settings.js` | Load and save automatic and live sorting settings |
| `saved-sessions.js` | List, open, save, rename, and delete sessions |
| `sorting-order.js` | Load, change, and save category order |
| `extension-state.js` | Load, display, and save the enabled or disabled state |
| `background-service.js` | Receive extension commands and perform background tab and session operations |

## Repository Structure

```text
FoxSorter/
├── README.md
└── Fox/
	├── images/
	├── manifest.json
	├── popup.css
	├── popup.html
	└── scripts/
		├── background-service.js
		├── categorization.js
		├── current-tab.js
		├── extension-state.js
		├── popup-navigation.js
		├── saved-sessions.js
		├── sort-settings.js
		├── sorting-order.js
		└── tab-sorting.js
```

## Browser Extension Configuration

The manifest declares Manifest Version 3 metadata and a popup at `Fox/popup.html`. It currently declares these permissions:

- `tabs`: intended for reading and organizing browser tabs.
- `storage`: intended for saving categories, settings, ordering, and sessions.
- `history`: declared in the manifest, but no history-related feature is implemented in the current code.
- `activeTab`: declared for access to the active tab when the extension is used.

The manifest also declares `<all_urls>` as a host permission and includes Firefox-specific metadata with a minimum version of 109. Permission use should be reviewed when implementation begins so the extension requests only the access it needs.

## Local Development

There is no build step, dependency installation, or test command in this repository. The extension is intended to use plain HTML, CSS, JavaScript, and browser extension APIs.

Before loading the extension locally:

1. Resolve the background script path mismatch in `Fox/manifest.json`.
2. Ensure the manifest points to the intended background script file.
3. Load the `Fox/` directory as an unpacked extension in the target browser's extension or add-on management page.
4. Inspect the extension's background and popup console for errors.

The extension should not be considered functional until the manifest path is corrected and the placeholder scripts are replaced with implementations.

## Data Model To Define

The implementation still needs explicit data formats for:

- Domain-to-category mappings.
- Category definitions and category counts.
- Category ordering.
- Automatic and live sorting settings.
- Saved session names, tab details, and timestamps.
- The enabled or disabled extension state.

These formats should be defined before storage and background messaging are implemented so the popup and background contexts use the same contract.

## Implementation Considerations

- Keep popup-only DOM work in the popup scripts.
- Keep tab movement and session restoration in the background context.
- Validate browser API failures and display a usable state in the popup.
- Handle browser pages that do not expose a normal web hostname, such as internal browser pages.
- Keep storage keys and message names documented as the background and popup logic are added.
- Test category assignment, ordering, sorting, session restoration, and disabled-state behavior independently.
- Reassess the `history` and `<all_urls>` permissions before release.

## Future Work

This section is intentionally left unfilled for future project decisions.

## License

No license has been specified for this repository.
