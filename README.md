# m3api-botpassword
[![npm](https://img.shields.io/npm/v/m3api-botpassword.svg)](https://www.npmjs.com/package/m3api-botpassword)
[![documentation](https://img.shields.io/badge/documentation-informational)](https://lucaswerkmeister.github.io/m3api-botpassword/)

m3api-botpassword is an extension package for [m3api][],
making it easy to make requests authenticated by a [bot password][].

## Usage

```js
import Session from 'm3api/node.js';
import { login } from 'm3api-botpassword/index.js';

// create credentials on Special:BotPasswords,
// then load them e.g. from process.env
const username = '...@...';
const password = '...';

// create a session
const session = new Session( 'en.wikipedia.org', {
	formatversion: 2,
}, {
	userAgent: 'm3api-botpassword-README-example',
} );

// log in
await login( session, username, password );

// make other requests, now authenticated
await session.request( {
	action: 'edit',
	title: '...',
	text: '...',
	bot: true,
}, { method: 'POST', tokenType: 'csrf' } );
```

There is also a `logout()` function.

By default, m3api-botpassword adds `assert=user` after logging in,
but does not set the `assertuser` parameter.
Both of these can be changed using request options,
e.g. when creating the session:

```js
const session = new Session( 'en.wikipedia.org', {
	formatversion: 2,
}, {
	userAgent: 'm3api-botpassword-README-example',
	'm3api-botpassword/assert': true, // default
	'm3api-botpassword/assertUser': true, // also add assertuser=[username]
} );
```

Request options can also be specified after the other `login()`/`logout()` arguments,
i.e. `login( session, username, password, options )` and `logout( session, options )`.
This can be useful for the m3api options,
but is not recommended for m3api-botpassword options:
using different `assert`/`assertUser` options for login and logout
will most likely produce confusing errors.

## License

Published under the [ISC License][].
By contributing to this software,
you agree to publish your contribution under the same license.

[m3api]: https://www.npmjs.com/package/m3api
[bot password]: https://www.mediawiki.org/wiki/Special:MyLanguage/Manual:Bot_passwords
[ISC License]: https://spdx.org/licenses/ISC.html
