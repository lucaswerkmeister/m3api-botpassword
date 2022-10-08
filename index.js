/**
 * @typedef UserInfo
 * @type {Object}
 * @property {string} name The name of the user.
 * @property {number} id The user ID of the user on the wiki.
 */

/**
 * Log in using the given username and password.
 *
 * @param {Session} session The m3api session to which the login applies.
 * @param {string} username
 * @param {string} password
 * @param {Object} [options] Options for the requests.
 * @return {UserInfo} Object with name and id members.
 * (The name may be different from the given username,
 * if that included the bot password name.)
 */
async function login( session, username, password, options = {} ) {
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
	session.tokens.clear();
	session.defaultParams.assert = 'user';
	return {
		name: response.login.lgusername,
		id: response.login.lguserid,
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
	await session.request( {
		action: 'logout',
	}, {
		...options,
		method: 'POST',
		tokenType: 'csrf',
		tokenName: 'token',
	} );
	session.tokens.clear();
	session.defaultParams.assert = 'anon';
	delete session.defaultParams.assertuser;
	return {};
}

export {
	login,
	logout,
};
