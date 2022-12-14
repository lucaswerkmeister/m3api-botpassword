import {
	DEFAULT_OPTIONS,
} from 'm3api/core.js';

/**
 * @typedef UserInfo
 * @type {Object}
 * @property {string} name The name of the user.
 * @property {number} id The user ID of the user on the wiki.
 */

/**
 * Request options understood by this package.
 * All other options will be passed through to m3api.
 *
 * It’s strongly recommended to use the same options for {@link #login} and {@link #logout},
 * typically by including them in the session’s defaultOptions at construction time.
 * Using different options, especially logging in with an option set to true
 * and then logging out with it set to false,
 * will likely result in all future requests failing with an 'assertuserfailed' error.
 *
 * @typedef Options
 * @type {Object}
 * @property {boolean} ['m3api-botpassword/assert']
 * Whether to set the 'assert' parameter in the session’s defaultParams,
 * to 'user' ({@link #login}) or 'anon' ({@link #logout}) respectively.
 * Defaults to true.
 * @property {boolean} ['m3api-botpassword/assertUser']
 * Whether to set ({@link #login}) or delete ({@link #logout})
 * the 'assertuser' parameter in the session’s defaultParams.
 * Defaults to false.
 */

Object.assign( DEFAULT_OPTIONS, {
	'm3api-botpassword/assert': true,
	'm3api-botpassword/assertUser': false,
} );

/**
 * Log in using the given username and password.
 *
 * @param {Session} session The m3api session to which the login applies.
 * @param {string} username
 * @param {string} password
 * @param {Options} [options] Options for the requests,
 * including custom options for this package (see the type documentation).
 * @return {UserInfo} Object with name and id members.
 * (The name may be different from the given username,
 * if that included the bot password name.)
 */
async function login( session, username, password, options = {} ) {
	const {
		'm3api-botpassword/assert': assert,
		'm3api-botpassword/assertUser': assertUser,
	} = {
		...DEFAULT_OPTIONS,
		...session.defaultOptions,
		...options,
	};

	const response = await session.request( {
		action: 'login',
		lgname: username,
		lgpassword: password,
	}, {
		...options,
		method: 'POST',
		tokenType: 'login',
		tokenName: 'lgtoken',
	} );
	const {
		lgusername: name,
		lguserid: id,
	} = response.login;

	session.tokens.clear();

	if ( assert ) {
		session.defaultParams.assert = 'user';
	}
	if ( assertUser ) {
		session.defaultParams.assertuser = name;
	}

	return {
		name,
		id,
	};
}

/**
 * Log out of the session.
 *
 * @param {Session} session The m3api session to which the logout applies.
 * @param {Object} [options] Options for the requests.
 * @return {Object} Empty object.
 */
async function logout( session, options = {} ) {
	const {
		'm3api-botpassword/assert': assert,
		'm3api-botpassword/assertUser': assertUser,
	} = {
		...DEFAULT_OPTIONS,
		...session.defaultOptions,
		...options,
	};

	await session.request( {
		action: 'logout',
	}, {
		...options,
		method: 'POST',
		tokenType: 'csrf',
		tokenName: 'token',
	} );

	session.tokens.clear();

	if ( assert ) {
		session.defaultParams.assert = 'anon';
	}
	if ( assertUser ) {
		delete session.defaultParams.assertuser;
	}

	return {};
}

export {
	login,
	logout,
};
