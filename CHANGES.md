# Changelog

This file records the changes in each m3api-botpassword release.

The annotated tag (and GitHub release) for each version also lists the changes,
but this file may sometimes contain later improvements (e.g. typo fixes).

## next (not yet released)

- `login()` and `LoginError` now understand
  that the `reason` returned by the API in case of failed login
  can be an object rather than a string
  (if the session’s `defaultParams` specify a non-default `errorformat`).
- Updated dependencies.

## v0.2.0 (2023-07-10)

- BREAKING CHANGE:
  m3api-botpassword now requires at least Node.js 18.2.0,
  up from Node 12.22.0 or 14.17.0 previously.
- `login()` now detects if logging in failed,
  and throws a `LoginError` in that case.
  (This new class is also exported,
  in case you want to check for it specifically.)
- Updated dependencies.

## v0.1.1 (2022-12-03)

No significant changes, I just need to publish another release
in order to test the automated parts of the releasing process.

- Publish documentation on GitHub pages:
  [latest version][m3api-botpassword-doc-latest], [v0.1.1][m3api-botpassword-doc-v0.1.1].
- Updated dependencies.

## v0.1.0 (2022-10-29)

Initial release, including:

- `login()` and `logout()` functions.
- `m3api-botpassword/assert` and `m3api-botpassword/assertUser` options.

[m3api-botpassword-doc-latest]: https://lucaswerkmeister.github.io/m3api-botpassword/
[m3api-botpassword-doc-v0.1.1]: https://lucaswerkmeister.github.io/m3api-botpassword/v0.1.1/
