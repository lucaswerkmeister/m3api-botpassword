/* eslint-env mocha */

import { Session } from 'm3api/core.js';
import {
	login,
	logout,
	LoginError,
} from '../../index.js';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use( chaiAsPromised );

class BaseTestSession extends Session {

	constructor( defaultParams = {}, defaultOptions = {} ) {
		super( 'en.wikipedia.org', defaultParams, {
			warn() {
				throw new Error( 'warn() should not be called in this test' );
			},
			userAgent: 'm3api-botpassword-unit-test',
			...defaultOptions,
		} );
	}

	async request() {
		return { login: {
			result: 'Success',
			lguserid: 1234,
			lgusername: 'username',
		} };
	}

}

describe( 'login', () => {

	it( 'makes right request and returns name, id', async () => {
		let called = false;
		class TestSession extends BaseTestSession {
			async request( requestParams, requestOptions ) {
				expect( called, 'request already called' ).to.be.false;
				called = true;
				expect( requestParams ).to.eql( {
					action: 'login',
					lgname: 'username',
					lgpassword: 'password',
				} );
				expect( requestOptions ).to.eql( {
					method: 'POST',
					tokenType: 'login',
					tokenName: 'lgtoken',
					maxRetriesSeconds: 10,
				} );
				return {
					login: {
						result: 'Success',
						lguserid: 1234,
						lgusername: 'Test user name',
					},
				};
			}
		}

		const options = {
			method: 'GET', // should be overridden
			tokenType: 'csrf', // should be overridden
			tokenName: 'token', // should be overridden
			maxRetriesSeconds: 10, // should be kept
		};
		const session = new TestSession();
		expect( await login( session, 'username', 'password', options ) )
			.to.eql( { name: 'Test user name', id: 1234 } );
		expect( options, 'original options modified' ).to.eql( {
			method: 'GET',
			tokenType: 'csrf',
			tokenName: 'token',
			maxRetriesSeconds: 10,
		} );
		expect( called ).to.be.true;
	} );

	it( 'clears existing tokens', async () => {
		const session = new BaseTestSession();
		session.tokens.set( 'xyz', 'XYZ' );
		await login( session, 'username', 'password' );
		expect( session.tokens ).to.be.empty;
	} );

	it( 'adds assert but not assertuser to defaultParams', async () => {
		const session = new BaseTestSession();
		await login( session, 'username', 'password' );
		expect( session.defaultParams ).to.have.property( 'assert', 'user' );
		expect( session.defaultParams ).not.to.have.property( 'assertuser' );
	} );

	[
		[ 'defaultOptions', { 'm3api-botpassword/assert': false }, {} ],
		[ 'options', {}, { 'm3api-botpassword/assert': false } ],
	].forEach( ( [ name, defaultOptions, options ] ) => {
		it( `does not add assert to defaultParams with false in ${name}`, async () => {
			const session = new BaseTestSession( {}, defaultOptions );
			await login( session, 'username', 'password', options );
			expect( session.defaultParams ).not.to.have.property( 'assert' );
		} );
	} );

	[
		[ 'defaultOptions', { 'm3api-botpassword/assertUser': true }, {} ],
		[ 'options', {}, { 'm3api-botpassword/assertUser': true } ],
	].forEach( ( [ name, defaultOptions, options ] ) => {
		it( `adds assertuser to defaultParams with true in ${name}`, async () => {
			const session = new BaseTestSession( {}, defaultOptions );
			await login( session, 'username', 'password', options );
			expect( session.defaultParams ).to.have.property( 'assertuser', 'username' );
		} );
	} );

	it( 'detects failure', async () => {
		class TestSession extends BaseTestSession {
			async request() {
				return {
					login: {
						result: 'Failed',
						reason: 'Incorrect username or password entered. Please try again.',
					},
				};
			}
		}

		const session = new TestSession();
		const error = await expect( login( session, 'username', 'password' ) )
			.to.be.rejectedWith( LoginError, 'Unable to log in as username (Failed): Incorrect username or password entered. Please try again.' );
		expect( error.result ).to.equal( 'Failed' );
		expect( error.reason ).to.equal( 'Incorrect username or password entered. Please try again.' );
		expect( error.username ).to.equal( 'username' );
	} );

} );

describe( 'logout', () => {

	it( 'makes right request', async () => {
		let called = false;
		class TestSession extends BaseTestSession {
			async request( requestParams, requestOptions ) {
				expect( called, 'request already called' ).to.be.false;
				called = true;
				expect( requestParams ).to.eql( {
					action: 'logout',
				} );
				expect( requestOptions ).to.eql( {
					method: 'POST',
					tokenType: 'csrf',
					tokenName: 'token',
					maxRetriesSeconds: 10,
				} );
				return {};
			}
		}

		const options = {
			method: 'GET', // should be overridden
			tokenType: 'login', // should be overridden
			tokenName: 'lgtoken', // should be overridden
			maxRetriesSeconds: 10, // should be kept
		};
		const session = new TestSession();
		expect( await logout( session, options ) ).to.eql( {} );
		expect( options, 'original options modified' ).to.eql( {
			method: 'GET',
			tokenType: 'login',
			tokenName: 'lgtoken',
			maxRetriesSeconds: 10,
		} );
		expect( called ).to.be.true;
	} );

	it( 'clears existing tokens', async () => {
		const session = new BaseTestSession();
		session.tokens.set( 'xyz', 'XYZ' );
		await logout( session );
		expect( session.tokens ).to.be.empty;
	} );

	it( 'adds assert to, does not remove assertuser from defaultParams', async () => {
		const session = new BaseTestSession();
		session.defaultParams.assertuser = 'username';
		await logout( session );
		expect( session.defaultParams ).to.have.property( 'assert', 'anon' );
		expect( session.defaultParams ).to.have.property( 'assertuser', 'username' );
	} );

	[
		[ 'defaultOptions', { 'm3api-botpassword/assert': false }, {} ],
		[ 'options', {}, { 'm3api-botpassword/assert': false } ],
	].forEach( ( [ name, defaultOptions, options ] ) => {
		it( `does not add assert to defaultParams with false in ${name}`, async () => {
			const session = new BaseTestSession( {}, defaultOptions );
			await logout( session, options );
			expect( session.defaultParams ).not.to.have.property( 'assert' );
		} );
	} );

	[
		[ 'defaultOptions', { 'm3api-botpassword/assertUser': true }, {} ],
		[ 'options', {}, { 'm3api-botpassword/assertUser': true } ],
	].forEach( ( [ name, defaultOptions, options ] ) => {
		it( `removes assertuser from defaultParams with true in ${name}`, async () => {
			const session = new BaseTestSession( {}, defaultOptions );
			await logout( session, options );
			expect( session.defaultParams ).not.to.have.property( 'assertuser' );
		} );
	} );

} );
