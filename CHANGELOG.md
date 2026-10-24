# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-10-24

First public release.

### Added

- Text and image (logo) watermarks for images and PDFs, processed entirely in the browser.
- Tiled layout with rotation, horizontal/vertical spacing (density) and staggered rows; single
  watermark with nine anchor positions, margin and drag-to-position.
- Font detection, Local Font Access support and custom font files; weight, italic, size, color,
  opacity, letter spacing, line height and alignment.
- Outline, shadow and stamp-frame effects, one-click style presets and saved named styles.
- Template variables `{date}`, `{time}`, `{datetime}`, `{filename}`, `{page}` and `{pages}`.
- PDF export that keeps the original text (overlay) or flattens pages into images; support for
  password-protected PDFs, rotated pages and crop boxes.
- Batch export as a ZIP archive, folder drop and clipboard paste.
- Live preview with hold-to-compare and page navigation.
- Strict Content Security Policy, self-hosted pdf.js assets, EXIF stripping and offline support
  through a service worker.
- Simplified Chinese and English UI, light and dark themes, mobile layout and keyboard shortcuts.

[1.0.0]: https://github.com/shenyizg/safemark/releases/tag/v1.0.0
