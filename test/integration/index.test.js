/* eslint-env mocha */

import Session, { set } from 'm3api/node.js';
import {
	login,
	logout,
	LoginError,
} from '../../index.js';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import fs from 'fs';
import process from 'process';

chai.use( chaiAsPromised );

const userAgent = 'm3api-botpassword-integration-tests (https://github.com/lucaswerkmeister/m3api-botpassword/)';

describe( 'm3api-botpassword', function () {

	this.timeout( 60000 );

	let mediawikiUsername, mediawikiPassword;

	before( 'load credentials', async () => {
		// note: this code was copied from m3api
		mediawikiUsername = process.env.MEDIAWIKI_USERNAME;
		mediawikiPassword = process.env.MEDIAWIKI_PASSWORD;

		if ( !mediawikiUsername || !mediawikiPassword ) {
			let envFile;
			try {
				envFile = await fs.promises.readFile( '.env', { encoding: 'utf8' } );
			} catch ( e ) {
				if ( e.code === 'ENOENT' ) {
					return;
				} else {
					throw e;
				}
			}

			for ( let line of envFile.split( '\n' ) ) {
				line = line.trim();
				if ( line.startsWith( '#' ) || line === '' ) {
					continue;
				}

				const match = line.match( /^([^=]*)='([^']*)'$/ );
				if ( !match ) {
					console.warn( `.env: ignoring bad format: ${line}` );
					continue;
				}
				switch ( match[ 1 ] ) {
					case 'MEDIAWIKI_USERNAME':
						if ( !mediawikiUsername ) {
							mediawikiUsername = match[ 2 ];
						}
						break;
					case 'MEDIAWIKI_PASSWORD':
						if ( !mediawikiPassword ) {
							mediawikiPassword = match[ 2 ];
						}
						break;
					default:
						console.warn( `.env: ignoring unknown assignment: ${line}` );
						break;
				}
			}
		}
	} );

	it( 'login, userinfo, logout, userinfo', async function () {
		if ( !mediawikiUsername || !mediawikiPassword ) {
			return this.skip();
		}
		const session = new Session( 'en.wikipedia.beta.wmflabs.org', {
			formatversion: 2,
		}, {
			userAgent,
		} );
		const userinfoParams = {
			action: 'query',
			meta: set( 'userinfo' ),
			uiprop: set(),
		};

		const { name, id } = await login( session, mediawikiUsername, mediawikiPassword );
		expect( name ).to.equal( mediawikiUsername.replace( /@.*$/, '' ) );

		const [ loggedInResponse, _ ] = await Promise.all( [
			session.request( userinfoParams ),
			session.getToken( 'csrf' ), // prefetch for logout (combined)
		] );
		const loggedInUserInfo = loggedInResponse.query.userinfo;
		expect( { name, id } ).to.eql( loggedInUserInfo );

		await logout( session );

		const loggedOutUserInfo = ( await session.request( userinfoParams ) )
			.query.userinfo;
		expect( loggedOutUserInfo ).to.have.property( 'anon', true );
		expect( loggedOutUserInfo.id ).to.equal( 0 );
	} );

	it( 'login with invalid credentials (default errorformat)', async function () {
		if ( !mediawikiUsername ) {
			return this.skip();
		}
		const session = new Session( 'en.wikipedia.beta.wmflabs.org', {
			formatversion: 2,
		}, {
			userAgent,
		} );

		await expect( login( session, mediawikiUsername, '' ) )
			.to.be.rejectedWith( LoginError )
			.and.eventually.to.have.property( 'reason' )
			.that.is.a( 'string' );
	} );

	it( 'login with invalid credentials (errorformat=none)', async function () {
		if ( !mediawikiUsername ) {
			return this.skip();
		}
		const session = new Session( 'en.wikipedia.beta.wmflabs.org', {
			formatversion: 2,
			errorformat: 'none',
		}, {
			userAgent,
		} );

		await expect( login( session, mediawikiUsername, '' ) )
			.to.be.rejectedWith( LoginError )
			.and.eventually.to.have.property( 'reason' )
			.that.has.property( 'code' );
	} );

} );
