<!-- deno-fmt-ignore-file -->

# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/) and this
project adheres to [Semantic Versioning](https://semver.org/).

## [0.1.9] - 2025-07-29
### Fixed
- Reset all inherited CSS styles.
- Styles of links in the title of items.

## [0.1.8] - 2025-06-12
### Fixed
- Don't open automatically the current item if it wasn't opened before.

## [0.1.7] - 2025-06-11
### Added
- Allow to place icons in the item title.
- Save in localStorage if th bar was visible the last time.

### Changed
- Show automatically the first tab on open.

### Fixed
- Use tabular numbers.
- Position sticky of the items.
- More contrast of the code in the titles.

## [0.1.6] - 2025-06-05
### Changed
- Hide the bar by default.

### Fixed
- Action types.
- Disable action button when it's pressed.
- UI styles tweaks.
- Don't block the UI while the bar is hidden.

## [0.1.5] - 2025-06-04
### Added
- Ability to send data from websocket.

### Changed
- Use popover API to ensure the bar is always on top of other elements.

### Fixed
- Summary styles in Safari.
- Font rendering on macOS.
- Bar height in small sizes.
- `href` property of an action should be optional.
- Typography tweaks.

## [0.1.4] - 2025-05-10
### Fixed
- Changed some colors and fonts to improve the legibility.

## [0.1.3] - 2025-05-10
### Added
- Types for the data structure
- Allow to customize the title of a context.

## [0.1.2] - 2025-05-09
### Changed
- More permisive about initial badges of item titles.

## [0.1.1] - 2025-05-06
### Fixed
- `update()` must remove the previous tabs.

## [0.1.0] - 2025-05-06
First version

[0.1.9]: https://github.com/lumeland/bar/compare/v0.1.8...v0.1.9
[0.1.8]: https://github.com/lumeland/bar/compare/v0.1.7...v0.1.8
[0.1.7]: https://github.com/lumeland/bar/compare/v0.1.6...v0.1.7
[0.1.6]: https://github.com/lumeland/bar/compare/v0.1.5...v0.1.6
[0.1.5]: https://github.com/lumeland/bar/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/lumeland/bar/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/lumeland/bar/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/lumeland/bar/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/lumeland/bar/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/lumeland/bar/releases/tag/v0.1.0
