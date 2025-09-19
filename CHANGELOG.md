# 0.0.5

- Fixed `style` tags getting picked up and yielding ugly CSS in extracted text.

# 0.0.4

- Fixed the parser being broken after the structure of Wiktionary's layout changed.

# 0.0.3

- Fixed the etymology section not returning results if the heading had any dots in its number. (e.g. 'Etymology 1.2' instead of 'Etymology 1')
- Fixed unencoded URIs.

# 0.0.2-patch.1

- Fixed the etymology section being broken after the structure of Wiktionary's HTML changed.

# 0.0.2

- Added option to override the links used by the scraper to allow specifying custom URLs (in case of proxies, etc.).

# 0.0.1-patch.3

- Fixed package having been published without re-compilation via `tsc`.

# 0.0.1-patch.2

- Fixed oversight involving the parser only parsing 1 part of speech per etymology.

# 0.0.1-patch.1

- Switched from Rome to Biome, following the package having been renamed.

# 0.0.1

- Initial commit.
