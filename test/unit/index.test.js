/* eslint-env mocha */

import { Session } from 'm3api/core.js';
import {
	login,
	logout,
} from '../../index.js';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use( chaiAsPromised );

class BaseTestSession extends Session {

	constructor() {
		super( 'en.wikipedia.org', {}, {
			warn() {
				throw new Error( 'warn() should not be called in this test' );
			},
			userAgent: 'm3api-botpassword-unit-test',
		} );
	}

	async request() {
		return { login: {
			result: 'Success',
			lguserid: 0,
			lgusername: '',
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

	it( 'adds assert to defaultParams', async () => {
		const session = new BaseTestSession();
		await login( session, 'username', 'password' );
		expect( session.defaultParams ).to.have.property( 'assert', 'user' );
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

	it( 'adds assert to and removes assertuser from defaultParams', async () => {
		const session = new BaseTestSession();
		session.defaultParams.assertuser = 'username';
		await logout( session );
		expect( session.defaultParams ).to.have.property( 'assert', 'anon' );
		expect( session.defaultParams ).not.to.have.property( 'assertuser' );
	} );

} );
