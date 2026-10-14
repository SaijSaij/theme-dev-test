/**
 * Step 23: cron events and tasks (src/Cron/). The recurring events of the
 * theme in their schedules and at their local start times, the correction of
 * an event moved off its phase, a due event run by WP-Cron, and one-time tasks
 * of the CronScheduler with their values.
 *
 * WP-Cron runs due events with a request to wp-cron.php: WordPress spawns one
 * after a request, and the tests call it themselves. A run that holds the lock
 * makes a call return at once, so the tests poll until the event has run. The
 * change of the time zone and the clean-up when switching themes are tested in
 * the framework's PHPUnit tests.
 */
const { test, expect } = require( '../fixtures' );

const { restResponse } = require( '../helpers' );

const CRON = '/dev-test/v1/cron';
const HOOK = 'wp_app_framework/cron/theme-dev-test/';

/**
 * @param {Object} requestUtils
 * @param {string} path         Route below the cron controller.
 * @param {Object} [options]    Further options of restResponse().
 * @return {Promise<Object>} Response.
 */
function cronRoute( requestUtils, path, options = {} ) {
	return restResponse( requestUtils, { path: CRON + path, ...options } );
}

/**
 * The scheduled events of the theme, the interval in seconds and the counts.
 *
 * @param {Object} requestUtils
 * @return {Promise<Object>} State.
 */
async function state( requestUtils ) {
	const response = await cronRoute( requestUtils, '/state' );
	expect( response.status ).toBe( 200 );
	return response.body;
}

/**
 * Calls wp-cron.php like a system cron job and returns the state afterwards.
 *
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {Object}                                       requestUtils
 * @return {Promise<Object>} State.
 */
// Polls wait longer than WP_CRON_LOCK_TIMEOUT (60 s): while a WP-Cron run spawned by WordPress holds the lock,
// wp-cron.php returns without running anything.
async function runCron( request, requestUtils ) {
	await request.get( '/wp-cron.php' );
	return state( requestUtils );
}

// IDs of this run, so tasks of other runs do not interfere.
const taskId = Date.now() % 1_000_000_000;

test.describe( 'Cron events and tasks', () => {
	test.describe.configure( { mode: 'serial' } );

	test.afterAll( async ( { requestUtils } ) => {
		for ( const [ id, kind ] of [
			[ taskId, 'second' ],
			[ taskId + 1, 'first' ],
		] ) {
			await cronRoute( requestUtils, '/task', {
				method: 'DELETE',
				params: { id, kind },
			} );
		}
		await cronRoute( requestUtils, '/counts', { method: 'DELETE' } );
	} );

	test( 'schedules the events in their intervals and at their local start times', async ( {
		requestUtils,
	} ) => {
		const { events, interval } = await state( requestUtils );

		expect( events.heartbeat.schedule ).toBe( HOOK + 'every-3600' );
		expect( events.heartbeat.interval ).toBe( 3600 );
		expect( interval ).toEqual( {
			interval: 3600,
			display: 'Every 3600 seconds (theme-dev-test)',
		} );
		expect( events.nightly.schedule ).toBe( 'daily' );
		expect( events.nightly.local ).toMatch( / 03:00$/ );
		expect( events.weekly.schedule ).toBe( 'weekly' );
		expect( events.weekly.local ).toBe( '1 08:00' );
	} );

	test( 'moves an event off its phase back to its local start time', async ( {
		requestUtils,
	} ) => {
		const before = ( await state( requestUtils ) ).events.nightly;

		const shifted = await cronRoute( requestUtils, '/shift', {
			method: 'POST',
		} );
		expect( shifted.status ).toBe( 204 );

		// The framework compares on init, before the REST API answers.
		const after = ( await state( requestUtils ) ).events.nightly;
		expect( after.local ).toMatch( / 03:00$/ );
		expect( after.timestamp ).toBe( before.timestamp );
	} );

	test( 'runs a due event and schedules it an interval later', async ( {
		request,
		requestUtils,
	} ) => {
		const before = ( await state( requestUtils ) ).counts.heartbeat ?? 0;

		const due = await cronRoute( requestUtils, '/due', { method: 'POST' } );
		expect( due.status ).toBe( 204 );

		await expect
			.poll(
				async () =>
					( await runCron( request, requestUtils ) ).counts
						.heartbeat ?? 0,
				{ timeout: 75_000, intervals: [ 1_000, 2_000, 5_000 ] }
			)
			.toBeGreaterThan( before );
		const { now, events } = await state( requestUtils );
		expect( events.heartbeat.schedule ).toBe( HOOK + 'every-3600' );
		expect(
			Math.abs( events.heartbeat.timestamp - ( now + 3600 ) )
		).toBeLessThan( 120 );
	} );

	test( 'runs a task with its values', async ( {
		request,
		requestUtils,
	} ) => {
		const task = { id: taskId, kind: 'second' };
		// Due in a few seconds: a WP-Cron run spawned by one of the next requests must not run it before the checks.
		const data = { ...task, delay: 5 };

		const scheduled = await cronRoute( requestUtils, '/task', {
			method: 'POST',
			data,
		} );
		expect( scheduled.status ).toBe( 200 );
		expect( scheduled.body ).toBe( true );
		// The same task within ten minutes is a duplicate.
		const again = await cronRoute( requestUtils, '/task', {
			method: 'POST',
			data,
		} );
		expect( again.body ).toBe( false );
		expect(
			( await cronRoute( requestUtils, '/task', { params: task } ) ).body
		).toBe( true );

		await expect
			.poll(
				async () =>
					( await runCron( request, requestUtils ) ).counts.task ??
					null,
				{ timeout: 75_000, intervals: [ 1_000, 2_000, 5_000 ] }
			)
			.toEqual( task );
		expect(
			( await cronRoute( requestUtils, '/task', { params: task } ) ).body
		).toBe( false );
	} );

	test( 'unschedules a planned task', async ( { requestUtils } ) => {
		const task = { id: taskId + 1, kind: 'first' };

		const scheduled = await cronRoute( requestUtils, '/task', {
			method: 'POST',
			data: { ...task, delay: 3600 },
		} );
		expect( scheduled.body ).toBe( true );
		expect(
			( await cronRoute( requestUtils, '/task', { params: task } ) ).body
		).toBe( true );

		const removed = await cronRoute( requestUtils, '/task', {
			method: 'DELETE',
			params: task,
		} );
		expect( removed.status ).toBe( 200 );
		expect( removed.body ).toBe( 1 );
		expect(
			( await cronRoute( requestUtils, '/task', { params: task } ) ).body
		).toBe( false );
	} );
} );
