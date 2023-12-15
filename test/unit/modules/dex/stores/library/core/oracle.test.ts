/* eslint-disable jest/expect-expect */
/* eslint-disable no-return-assign */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { methodSwapContext } from '../../../../../../../src/app/modules/dex/stores/context';
import { Uint, Uint128 } from '../../../../../../../src/app/modules/dex/stores/library/int';
import { OracleTest, checkObservationEquals } from '../../shared/fixtures/OracleTest';
import { methodContextFixture } from '../../shared/module';
import { TEST_POOL_START_TIME } from '../../shared/pool';

const BATCH_SIZE = 300;
const STARTING_TIME = TEST_POOL_START_TIME.toString();

const POOL_ADDRESS = Buffer.from('0000000000000000000000000000000000000000', 'hex');
const SENDER_ADDRESS = Buffer.from('0000000000000000000000000000000000000001', 'hex');

const oracleFixture = async () => {
	const { module, createMethodContext } = await methodContextFixture();
	const context = methodSwapContext(
		createMethodContext(),
		SENDER_ADDRESS,
		parseInt(TEST_POOL_START_TIME, 10),
	);
	const oracleTest = new OracleTest(context, module, POOL_ADDRESS);
	return oracleTest;
};

const initializedOracleFixture = async () => {
	const oracle = await oracleFixture();
	await oracle.initialize({
		time: '0',
		tick: '0',
		liquidity: '0',
	});
	return oracle;
};

const maxedOutOracleFixture = async () => {
	const oracle = await oracleFixture();
	await oracle.initialize({
		liquidity: '0',
		tick: '0',
		time: STARTING_TIME,
	});
	let { cardinalityNext } = oracle;
	while (parseInt(cardinalityNext, 10) < 65535) {
		const growTo = Math.min(65535, parseInt(cardinalityNext, 10) + BATCH_SIZE);
		await oracle.grow(growTo.toString());
		cardinalityNext = growTo.toString();
	}

	for (let i = 0; i < 65535; i += BATCH_SIZE) {
		const batch = Array(BATCH_SIZE)
			.fill(null)
			.map((_, j) => ({
				advanceTimeBy: '13',
				tick: (-i - j).toString(),
				liquidity: (i + j).toString(),
			}));
		await oracle.batchUpdate(batch);
	}

	return oracle;
};

describe('Oracle', () => {
	describe('#initialize', () => {
		let oracle: OracleTest;
		beforeEach(async () => (oracle = await oracleFixture()));

		it('index is 0', async () => {
			await oracle.initialize({ liquidity: '1', tick: '1', time: '1' });
			expect(oracle.index).toBe('0');
		});
		it('cardinality is 1', async () => {
			await oracle.initialize({ liquidity: '1', tick: '1', time: '1' });
			expect(oracle.cardinality).toBe('1');
		});
		it('cardinality next is 1', async () => {
			await oracle.initialize({ liquidity: '1', tick: '1', time: '1' });
			expect(oracle.cardinalityNext).toBe('1');
		});
		it('sets first slot timestamp only', async () => {
			await oracle.initialize({ liquidity: '1', tick: '1', time: '1' });
			const oracleData = await oracle.observationStore.getOrDefault(
				oracle.context.context,
				oracle.observationStore.getKey(oracle.poolAddress, '0'),
			);
			checkObservationEquals(oracleData, {
				initialized: true,
				blockTimestamp: '1',
				tickCumulative: '0',
				secondsPerLiquidityCumulativeX128: '0',
			});
		});
	});

	describe('#grow', () => {
		let oracle: OracleTest;
		beforeEach(async () => (oracle = await initializedOracleFixture()));

		it('increases the cardinality next for the first call', async () => {
			await oracle.grow('5');
			expect(oracle.index).toBe('0');
			expect(oracle.cardinality).toBe('1');
			expect(oracle.cardinalityNext).toBe('5');
		});

		it('does not touch the first slot', async () => {
			await oracle.grow('5');
			const oracleData = await oracle.observationStore.getOrDefault(
				oracle.context.context,
				oracle.observationStore.getKey(oracle.poolAddress, '0'),
			);
			checkObservationEquals(oracleData, {
				secondsPerLiquidityCumulativeX128: '0',
				tickCumulative: '0',
				blockTimestamp: '0',
				initialized: true,
			});
		});

		it('is no op if oracle is already gte that size', async () => {
			await oracle.grow('5');
			await oracle.grow('3');
			expect(oracle.index).toBe('0');
			expect(oracle.cardinality).toBe('1');
			expect(oracle.cardinalityNext).toBe('5');
		});

		it('adds data to all the slots', async () => {
			await oracle.grow('5');
			for (let i = 1; i < 5; i += 1) {
				const oracleData = await oracle.observationStore.getOrDefault(
					oracle.context.context,
					oracle.observationStore.getKey(oracle.poolAddress, i.toString()),
				);
				checkObservationEquals(oracleData, {
					secondsPerLiquidityCumulativeX128: '0',
					tickCumulative: '0',
					blockTimestamp: '1',
					initialized: false,
				});
			}
		});

		it('grow after wrap', async () => {
			await oracle.grow('2');
			await oracle.update({ advanceTimeBy: '2', liquidity: '1', tick: '1' }); // index is now 1
			await oracle.update({ advanceTimeBy: '2', liquidity: '1', tick: '1' }); // index is now 0 again
			expect(oracle.index).toBe('0');
			await oracle.grow('3');
			expect(oracle.index).toBe('0');
			expect(oracle.cardinality).toBe('2');
			expect(oracle.cardinalityNext).toBe('3');
		});
	});

	describe('#write', () => {
		let oracle: OracleTest;
		beforeEach(async () => (oracle = await initializedOracleFixture()));

		it('single element array gets overwritten', async () => {
			await oracle.update({ advanceTimeBy: '1', tick: '2', liquidity: '5' });
			expect(oracle.index).toBe('0');
			let oracleData = await oracle.observationStore.getOrDefault(
				oracle.context.context,
				oracle.observationStore.getKey(oracle.poolAddress, '0'),
			);
			checkObservationEquals(oracleData, {
				initialized: true,
				secondsPerLiquidityCumulativeX128: '340282366920938463463374607431768211456',
				tickCumulative: '0',
				blockTimestamp: '1',
			});
			await oracle.update({ advanceTimeBy: '5', tick: '-1', liquidity: '8' });
			expect(oracle.index).toBe('0');
			oracleData = await oracle.observationStore.getOrDefault(
				oracle.context.context,
				oracle.observationStore.getKey(oracle.poolAddress, '0'),
			);
			checkObservationEquals(oracleData, {
				initialized: true,
				secondsPerLiquidityCumulativeX128: '680564733841876926926749214863536422912',
				tickCumulative: '10',
				blockTimestamp: '6',
			});
			await oracle.update({ advanceTimeBy: '3', tick: '2', liquidity: '3' });
			expect(oracle.index).toBe('0');
			oracleData = await oracle.observationStore.getOrDefault(
				oracle.context.context,
				oracle.observationStore.getKey(oracle.poolAddress, '0'),
			);
			checkObservationEquals(oracleData, {
				initialized: true,
				secondsPerLiquidityCumulativeX128: '808170621437228850725514692650449502208',
				tickCumulative: '7',
				blockTimestamp: '9',
			});
		});

		it('does nothing if time has not changed', async () => {
			await oracle.grow('2');
			await oracle.update({ advanceTimeBy: '1', tick: '3', liquidity: '2' });
			expect(oracle.index).toBe('1');
			await oracle.update({ advanceTimeBy: '0', tick: '-5', liquidity: '9' });
			expect(oracle.index).toBe('1');
		});

		it('writes an index if time has changed', async () => {
			await oracle.grow('3');
			await oracle.update({ advanceTimeBy: '6', tick: '3', liquidity: '2' });
			expect(oracle.index).toBe('1');
			await oracle.update({ advanceTimeBy: '4', tick: '-5', liquidity: '9' });

			expect(oracle.index).toBe('2');
			const oracleData = await oracle.observationStore.getOrDefault(
				oracle.context.context,
				oracle.observationStore.getKey(oracle.poolAddress, '1'),
			);
			checkObservationEquals(oracleData, {
				tickCumulative: '0',
				secondsPerLiquidityCumulativeX128: '2041694201525630780780247644590609268736',
				initialized: true,
				blockTimestamp: '6',
			});
		});

		it('grows cardinality when writing past', async () => {
			await oracle.grow('2');
			await oracle.grow('4');
			expect(oracle.cardinality).toBe('1');
			await oracle.update({ advanceTimeBy: '3', tick: '5', liquidity: '6' });
			expect(oracle.cardinality).toBe('4');
			await oracle.update({ advanceTimeBy: '4', tick: '6', liquidity: '4' });
			expect(oracle.cardinality).toBe('4');
			expect(oracle.index).toBe('2');
			const oracleData = await oracle.observationStore.getOrDefault(
				oracle.context.context,
				oracle.observationStore.getKey(oracle.poolAddress, '2'),
			);
			checkObservationEquals(oracleData, {
				secondsPerLiquidityCumulativeX128: '1247702012043441032699040227249816775338',
				tickCumulative: '20',
				initialized: true,
				blockTimestamp: '7',
			});
		});

		it('wraps around', async () => {
			await oracle.grow('3');
			await oracle.update({ advanceTimeBy: '3', tick: '1', liquidity: '2' });
			await oracle.update({ advanceTimeBy: '4', tick: '2', liquidity: '3' });
			await oracle.update({ advanceTimeBy: '5', tick: '3', liquidity: '4' });

			expect(oracle.index).toBe('0');

			const oracleData = await oracle.observationStore.getOrDefault(
				oracle.context.context,
				oracle.observationStore.getKey(oracle.poolAddress, '0'),
			);
			checkObservationEquals(oracleData, {
				secondsPerLiquidityCumulativeX128: '2268549112806256423089164049545121409706',
				tickCumulative: '14',
				initialized: true,
				blockTimestamp: '12',
			});
		});

		it('accumulates liquidity', async () => {
			await oracle.grow('4');

			await oracle.update({ advanceTimeBy: '3', tick: '3', liquidity: '2' });
			await oracle.update({ advanceTimeBy: '4', tick: '-7', liquidity: '6' });
			await oracle.update({ advanceTimeBy: '5', tick: '-2', liquidity: '4' });

			expect(oracle.index).toBe('3');

			let oracleData = await oracle.observationStore.getOrDefault(
				oracle.context.context,
				oracle.observationStore.getKey(oracle.poolAddress, '1'),
			);
			checkObservationEquals(oracleData, {
				initialized: true,
				tickCumulative: '0',
				secondsPerLiquidityCumulativeX128: '1020847100762815390390123822295304634368',
				blockTimestamp: '3',
			});
			oracleData = await oracle.observationStore.getOrDefault(
				oracle.context.context,
				oracle.observationStore.getKey(oracle.poolAddress, '2'),
			);
			checkObservationEquals(oracleData, {
				initialized: true,
				tickCumulative: '12',
				secondsPerLiquidityCumulativeX128: '1701411834604692317316873037158841057280',
				blockTimestamp: '7',
			});
			oracleData = await oracle.observationStore.getOrDefault(
				oracle.context.context,
				oracle.observationStore.getKey(oracle.poolAddress, '3'),
			);
			checkObservationEquals(oracleData, {
				initialized: true,
				tickCumulative: '-23',
				secondsPerLiquidityCumulativeX128: '1984980473705474370203018543351981233493',
				blockTimestamp: '12',
			});
			oracleData = await oracle.observationStore.getOrDefault(
				oracle.context.context,
				oracle.observationStore.getKey(oracle.poolAddress, '4'),
			);
			checkObservationEquals(oracleData, {
				initialized: false,
				tickCumulative: '0',
				secondsPerLiquidityCumulativeX128: '0',
				blockTimestamp: '0',
			});
		});
	});

	describe('#observe', () => {
		describe('before initialization', () => {
			let oracle: OracleTest;
			beforeEach(async () => (oracle = await oracleFixture()));

			const observeSingle = async (secondsAgo: number) => {
				const { tickCumulatives, secondsPerLiquidityCumulativeX128s } = await oracle.observe([
					secondsAgo.toString(),
				]);
				return {
					secondsPerLiquidityCumulativeX128: secondsPerLiquidityCumulativeX128s[0],
					tickCumulative: tickCumulatives[0],
				};
			};

			it('fails before initialize', async () => {
				const func = async () => {
					await observeSingle(0);
				};
				await expect(func()).rejects.toThrow('I');
			});

			it('fails if an older observation does not exist', async () => {
				await oracle.initialize({ liquidity: '4', tick: '2', time: '5' });
				const func = async () => {
					await observeSingle(1);
				};
				await expect(func()).rejects.toThrow('OLD');
			});

			it('does not fail across overflow boundary', async () => {
				await oracle.initialize({
					liquidity: '4',
					tick: '2',
					time: (2 ** 32 - 1).toString(),
				});
				oracle.advanceTime('2');
				const { tickCumulative, secondsPerLiquidityCumulativeX128 } = await observeSingle(1);
				expect(tickCumulative).toBe('2');
				expect(secondsPerLiquidityCumulativeX128).toBe('85070591730234615865843651857942052864');
			});

			it('interpolates correctly at max liquidity', async () => {
				await oracle.initialize({
					liquidity: Uint128.MAX,
					tick: '0',
					time: '0',
				});
				await oracle.grow('2');
				await oracle.update({ advanceTimeBy: '13', tick: '0', liquidity: '0' });
				let { secondsPerLiquidityCumulativeX128 } = await observeSingle(0);
				expect(secondsPerLiquidityCumulativeX128).toBe('13');
				({ secondsPerLiquidityCumulativeX128 } = await observeSingle(6));
				expect(secondsPerLiquidityCumulativeX128).toBe('7');
				({ secondsPerLiquidityCumulativeX128 } = await observeSingle(12));
				expect(secondsPerLiquidityCumulativeX128).toBe('1');
				({ secondsPerLiquidityCumulativeX128 } = await observeSingle(13));
				expect(secondsPerLiquidityCumulativeX128).toBe('0');
			});

			it('interpolates correctly at min liquidity', async () => {
				await oracle.initialize({ liquidity: '0', tick: '0', time: '0' });
				await oracle.grow('2');
				await oracle.update({
					advanceTimeBy: '13',
					tick: '0',
					liquidity: Uint128.MAX,
				});
				let { secondsPerLiquidityCumulativeX128 } = await observeSingle(0);
				expect(secondsPerLiquidityCumulativeX128).toBe(Uint.from(13).shl(128).toString());
				({ secondsPerLiquidityCumulativeX128 } = await observeSingle(6));
				expect(secondsPerLiquidityCumulativeX128).toBe(Uint.from(7).shl(128).toString());
				({ secondsPerLiquidityCumulativeX128 } = await observeSingle(12));
				expect(secondsPerLiquidityCumulativeX128).toBe(Uint.from(1).shl(128).toString());
				({ secondsPerLiquidityCumulativeX128 } = await observeSingle(13));
				expect(secondsPerLiquidityCumulativeX128).toBe('0');
			});

			it('interpolates the same as 0 liquidity for 1 liquidity', async () => {
				await oracle.initialize({ liquidity: '1', tick: '0', time: '0' });
				await oracle.grow('2');
				await oracle.update({
					advanceTimeBy: '13',
					tick: '0',
					liquidity: Uint128.MAX,
				});
				let { secondsPerLiquidityCumulativeX128 } = await observeSingle(0);
				expect(secondsPerLiquidityCumulativeX128).toBe(Uint.from(13).shl(128).toString());
				({ secondsPerLiquidityCumulativeX128 } = await observeSingle(6));
				expect(secondsPerLiquidityCumulativeX128).toBe(Uint.from(7).shl(128).toString());
				({ secondsPerLiquidityCumulativeX128 } = await observeSingle(12));
				expect(secondsPerLiquidityCumulativeX128).toBe(Uint.from(1).shl(128).toString());
				({ secondsPerLiquidityCumulativeX128 } = await observeSingle(13));
				expect(secondsPerLiquidityCumulativeX128).toBe('0');
			});

			it('interpolates correctly across uint32 seconds boundaries', async () => {
				// setup
				await oracle.initialize({ liquidity: '0', tick: '0', time: '0' });
				await oracle.grow('2');
				await oracle.update({
					advanceTimeBy: (2 ** 32 - 6).toString(),
					tick: '0',
					liquidity: '0',
				});
				let { secondsPerLiquidityCumulativeX128 } = await observeSingle(0);
				expect(secondsPerLiquidityCumulativeX128).toBe(
					Uint.from(2 ** 32 - 6)
						.shl(128)
						.toString(),
				);
				await oracle.update({ advanceTimeBy: '13', tick: '0', liquidity: '0' });
				({ secondsPerLiquidityCumulativeX128 } = await observeSingle(0));
				expect(secondsPerLiquidityCumulativeX128).toBe(Uint.from(7).shl(128).toString());

				// interpolation checks
				({ secondsPerLiquidityCumulativeX128 } = await observeSingle(3));
				expect(secondsPerLiquidityCumulativeX128).toBe(Uint.from(4).shl(128).toString());
				({ secondsPerLiquidityCumulativeX128 } = await observeSingle(8));
				expect(secondsPerLiquidityCumulativeX128).toBe(
					Uint.from(2 ** 32 - 1)
						.shl(128)
						.toString(),
				);
			});

			it('single observation at current time', async () => {
				await oracle.initialize({ liquidity: '4', tick: '2', time: '5' });
				const { tickCumulative, secondsPerLiquidityCumulativeX128 } = await observeSingle(0);
				expect(tickCumulative).toBe('0');
				expect(secondsPerLiquidityCumulativeX128).toBe('0');
			});

			it('single observation in past but not earlier than secondsAgo', async () => {
				await oracle.initialize({ liquidity: '4', tick: '2', time: '5' });
				oracle.advanceTime('3');

				const func = async () => {
					await observeSingle(4);
				};
				await expect(func()).rejects.toThrow('OLD');
			});

			it('single observation in past at exactly seconds ago', async () => {
				await oracle.initialize({ liquidity: '4', tick: '2', time: '5' });
				oracle.advanceTime('3');
				const { tickCumulative, secondsPerLiquidityCumulativeX128 } = await observeSingle(3);
				expect(tickCumulative).toBe('0');
				expect(secondsPerLiquidityCumulativeX128).toBe('0');
			});

			it('single observation in past counterfactual in past', async () => {
				await oracle.initialize({ liquidity: '4', tick: '2', time: '5' });
				oracle.advanceTime('3');
				const { tickCumulative, secondsPerLiquidityCumulativeX128 } = await observeSingle(1);
				expect(tickCumulative).toBe('4');
				expect(secondsPerLiquidityCumulativeX128).toBe('170141183460469231731687303715884105728');
			});

			it('single observation in past counterfactual now', async () => {
				await oracle.initialize({ liquidity: '4', tick: '2', time: '5' });
				oracle.advanceTime('3');
				const { tickCumulative, secondsPerLiquidityCumulativeX128 } = await observeSingle(0);
				expect(tickCumulative).toBe('6');
				expect(secondsPerLiquidityCumulativeX128).toBe('255211775190703847597530955573826158592');
			});

			it('two observations in chronological order 0 seconds ago exact', async () => {
				await oracle.initialize({ liquidity: '5', tick: '-5', time: '5' });
				await oracle.grow('2');
				await oracle.update({ advanceTimeBy: '4', tick: '1', liquidity: '2' });
				const { tickCumulative, secondsPerLiquidityCumulativeX128 } = await observeSingle(0);
				expect(tickCumulative).toBe('-20');
				expect(secondsPerLiquidityCumulativeX128).toBe('272225893536750770770699685945414569164');
			});

			it('two observations in chronological order 0 seconds ago counterfactual', async () => {
				await oracle.initialize({ liquidity: '5', tick: '-5', time: '5' });
				await oracle.grow('2');
				await oracle.update({ advanceTimeBy: '4', tick: '1', liquidity: '2' });
				oracle.advanceTime('7');
				const { tickCumulative, secondsPerLiquidityCumulativeX128 } = await observeSingle(0);
				expect(tickCumulative).toBe('-13');
				expect(secondsPerLiquidityCumulativeX128).toBe('1463214177760035392892510811956603309260');
			});

			it('two observations in chronological order seconds ago is exactly on first observation', async () => {
				await oracle.initialize({ liquidity: '5', tick: '-5', time: '5' });
				await oracle.grow('2');
				await oracle.update({ advanceTimeBy: '4', tick: '1', liquidity: '2' });
				oracle.advanceTime('7');
				const { tickCumulative, secondsPerLiquidityCumulativeX128 } = await observeSingle(11);
				expect(tickCumulative).toBe('0');
				expect(secondsPerLiquidityCumulativeX128).toBe('0');
			});

			it('two observations in chronological order seconds ago is between first and second', async () => {
				await oracle.initialize({ liquidity: '5', tick: '-5', time: '5' });
				await oracle.grow('2');
				await oracle.update({ advanceTimeBy: '4', tick: '1', liquidity: '2' });
				oracle.advanceTime('7');
				const { tickCumulative, secondsPerLiquidityCumulativeX128 } = await observeSingle(9);
				expect(tickCumulative).toBe('-10');
				expect(secondsPerLiquidityCumulativeX128).toBe('136112946768375385385349842972707284582');
			});

			it('two observations in reverse order 0 seconds ago exact', async () => {
				await oracle.initialize({ liquidity: '5', tick: '-5', time: '5' });
				await oracle.grow('2');
				await oracle.update({ advanceTimeBy: '4', tick: '1', liquidity: '2' });
				await oracle.update({ advanceTimeBy: '3', tick: '-5', liquidity: '4' });
				const { tickCumulative, secondsPerLiquidityCumulativeX128 } = await observeSingle(0);
				expect(tickCumulative).toBe('-17');
				expect(secondsPerLiquidityCumulativeX128).toBe('782649443918158465965761597093066886348');
			});

			it('two observations in reverse order 0 seconds ago counterfactual', async () => {
				await oracle.initialize({ liquidity: '5', tick: '-5', time: '5' });
				await oracle.grow('2');
				await oracle.update({ advanceTimeBy: '4', tick: '1', liquidity: '2' });
				await oracle.update({ advanceTimeBy: '3', tick: '-5', liquidity: '4' });
				oracle.advanceTime('7');
				const { tickCumulative, secondsPerLiquidityCumulativeX128 } = await observeSingle(0);
				expect(tickCumulative).toBe('-52');
				expect(secondsPerLiquidityCumulativeX128).toBe('1378143586029800777026667160098661256396');
			});

			it('two observations in reverse order seconds ago is exactly on first observation', async () => {
				await oracle.initialize({ liquidity: '5', tick: '-5', time: '5' });
				await oracle.grow('2');
				await oracle.update({ advanceTimeBy: '4', tick: '1', liquidity: '2' });
				await oracle.update({ advanceTimeBy: '3', tick: '-5', liquidity: '4' });
				oracle.advanceTime('7');
				const { tickCumulative, secondsPerLiquidityCumulativeX128 } = await observeSingle(10);
				expect(tickCumulative).toBe('-20');
				expect(secondsPerLiquidityCumulativeX128).toBe('272225893536750770770699685945414569164');
			});

			it('two observations in reverse order seconds ago is between first and second', async () => {
				await oracle.initialize({ liquidity: '5', tick: '-5', time: '5' });
				await oracle.grow('2');
				await oracle.update({ advanceTimeBy: '4', tick: '1', liquidity: '2' });
				await oracle.update({ advanceTimeBy: '3', tick: '-5', liquidity: '4' });
				oracle.advanceTime('7');
				const { tickCumulative, secondsPerLiquidityCumulativeX128 } = await observeSingle(9);
				expect(tickCumulative).toBe('-19');
				expect(secondsPerLiquidityCumulativeX128).toBe('442367076997220002502386989661298674892');
			});

			it('can fetch multiple observations', async () => {
				await oracle.initialize({
					time: '5',
					tick: '2',
					liquidity: Uint.from(2).pow(15).toString(),
				});
				await oracle.grow('4');
				await oracle.update({
					advanceTimeBy: '13',
					tick: '6',
					liquidity: Uint.from(2).pow(12).toString(),
				});
				oracle.advanceTime('5');

				const { tickCumulatives, secondsPerLiquidityCumulativeX128s } = await oracle.observe([
					'0',
					'3',
					'8',
					'13',
					'15',
					'18',
				]);
				expect(tickCumulatives).toHaveLength(6);
				expect(tickCumulatives[0]).toBe('56');
				expect(tickCumulatives[1]).toBe('38');
				expect(tickCumulatives[2]).toBe('20');
				expect(tickCumulatives[3]).toBe('10');
				expect(tickCumulatives[4]).toBe('6');
				expect(tickCumulatives[5]).toBe('0');
				expect(secondsPerLiquidityCumulativeX128s).toHaveLength(6);
				expect(secondsPerLiquidityCumulativeX128s[0]).toBe('550383467004691728624232610897330176');
				expect(secondsPerLiquidityCumulativeX128s[1]).toBe('301153217795020002454768787094765568');
				expect(secondsPerLiquidityCumulativeX128s[2]).toBe('103845937170696552570609926584401920');
				expect(secondsPerLiquidityCumulativeX128s[3]).toBe('51922968585348276285304963292200960');
				expect(secondsPerLiquidityCumulativeX128s[4]).toBe('31153781151208965771182977975320576');
				expect(secondsPerLiquidityCumulativeX128s[5]).toBe('0');
			});
		});

		for (const startingTime of ['5', (2 ** 32 - 5).toString()]) {
			describe(`initialized with 5 observations with starting time of ${startingTime}`, () => {
				const oracleFixture5Observations = async () => {
					const oracle = await oracleFixture();
					await oracle.initialize({
						liquidity: '5',
						tick: '-5',
						time: startingTime,
					});
					await oracle.grow('5');
					await oracle.update({
						advanceTimeBy: '3',
						tick: '1',
						liquidity: '2',
					});
					await oracle.update({
						advanceTimeBy: '2',
						tick: '-6',
						liquidity: '4',
					});
					await oracle.update({
						advanceTimeBy: '4',
						tick: '-2',
						liquidity: '4',
					});
					await oracle.update({
						advanceTimeBy: '1',
						tick: '-2',
						liquidity: '9',
					});
					await oracle.update({
						advanceTimeBy: '3',
						tick: '4',
						liquidity: '2',
					});
					await oracle.update({
						advanceTimeBy: '6',
						tick: '6',
						liquidity: '7',
					});
					return oracle;
				};

				let oracle: OracleTest;

				beforeEach(async () => (oracle = await oracleFixture5Observations()));

				const observeSingle = async (secondsAgo: number) => {
					const { tickCumulatives, secondsPerLiquidityCumulativeX128s } = await oracle.observe([
						secondsAgo.toString(),
					]);
					return {
						secondsPerLiquidityCumulativeX128: secondsPerLiquidityCumulativeX128s[0],
						tickCumulative: tickCumulatives[0],
					};
				};

				it('index, cardinality, cardinality next', () => {
					expect(oracle.index).toBe('1');
					expect(oracle.cardinality).toBe('5');
					expect(oracle.cardinalityNext).toBe('5');
				});
				it('latest observation same time as latest', async () => {
					const { tickCumulative, secondsPerLiquidityCumulativeX128 } = await observeSingle(0);
					expect(tickCumulative).toBe('-21');
					expect(secondsPerLiquidityCumulativeX128).toBe(
						'2104079302127802832415199655953100107502',
					);
				});
				it('latest observation 5 seconds after latest', async () => {
					oracle.advanceTime('5');
					const { tickCumulative, secondsPerLiquidityCumulativeX128 } = await observeSingle(5);
					expect(tickCumulative).toBe('-21');
					expect(secondsPerLiquidityCumulativeX128).toBe(
						'2104079302127802832415199655953100107502',
					);
				});
				it('current observation 5 seconds after latest', async () => {
					oracle.advanceTime('5');
					const { tickCumulative, secondsPerLiquidityCumulativeX128 } = await observeSingle(0);
					expect(tickCumulative).toBe('9');
					expect(secondsPerLiquidityCumulativeX128).toBe(
						'2347138135642758877746181518404363115684',
					);
				});
				it('between latest observation and just before latest observation at same time as latest', async () => {
					const { tickCumulative, secondsPerLiquidityCumulativeX128 } = await observeSingle(3);
					expect(tickCumulative).toBe('-33');
					expect(secondsPerLiquidityCumulativeX128).toBe(
						'1593655751746395137220137744805447790318',
					);
				});
				it('between latest observation and just before latest observation after the latest observation', async () => {
					oracle.advanceTime('5');
					const { tickCumulative, secondsPerLiquidityCumulativeX128 } = await observeSingle(8);
					expect(tickCumulative).toBe('-33');
					expect(secondsPerLiquidityCumulativeX128).toBe(
						'1593655751746395137220137744805447790318',
					);
				});
				it('older than oldest reverts', async () => {
					const func = async () => {
						await observeSingle(15);
					};
					await expect(func()).rejects.toThrow('OLD');

					oracle.advanceTime('5');

					const func2 = async () => {
						await observeSingle(20);
					};
					await expect(func2()).rejects.toThrow('OLD');
				});
				it('oldest observation', async () => {
					const { tickCumulative, secondsPerLiquidityCumulativeX128 } = await observeSingle(14);
					expect(tickCumulative).toBe('-13');
					expect(secondsPerLiquidityCumulativeX128).toBe('544451787073501541541399371890829138329');
				});
				it('oldest observation after some time', async () => {
					oracle.advanceTime('6');
					const { tickCumulative, secondsPerLiquidityCumulativeX128 } = await observeSingle(20);
					expect(tickCumulative).toBe('-13');
					expect(secondsPerLiquidityCumulativeX128).toBe('544451787073501541541399371890829138329');
				});
			});
		}
	});

	describe('full oracle', () => {
		let oracle: OracleTest;

		beforeAll(async () => {
			oracle = await maxedOutOracleFixture();
		});

		it('has max cardinality next', () => {
			expect(oracle.cardinalityNext).toBe('65535');
		});

		it('has max cardinality', () => {
			expect(oracle.cardinality).toBe('65535');
		});

		it('index wrapped around', () => {
			expect(oracle.index).toBe('165');
		});

		async function checkObserve(
			secondsAgo: number,
			expected?: {
				tickCumulative: string;
				secondsPerLiquidityCumulativeX128: string;
			},
		) {
			const { tickCumulatives, secondsPerLiquidityCumulativeX128s } = await oracle.observe([
				secondsAgo.toString(),
			]);
			const check = {
				tickCumulative: tickCumulatives[0].toString(),
				secondsPerLiquidityCumulativeX128: secondsPerLiquidityCumulativeX128s[0].toString(),
			};
			if (typeof expected === 'undefined') {
				expect(true).toBe(true);
			} else {
				expect(check).toStrictEqual({
					tickCumulative: expected.tickCumulative.toString(),
					secondsPerLiquidityCumulativeX128: expected.secondsPerLiquidityCumulativeX128.toString(),
				});
			}
		}

		it('can observe into the ordered portion with exact seconds ago', async () => {
			await checkObserve(100 * 13, {
				secondsPerLiquidityCumulativeX128: '60465049086512033878831623038233202591033',
				tickCumulative: '-27970560813',
			});
		});

		it('can observe into the ordered portion with unexact seconds ago', async () => {
			await checkObserve(100 * 13 + 5, {
				secondsPerLiquidityCumulativeX128: '60465023149565257990964350912969670793706',
				tickCumulative: '-27970232823',
			});
		});

		it('can observe at exactly the latest observation', async () => {
			await checkObserve(0, {
				secondsPerLiquidityCumulativeX128: '60471787506468701386237800669810720099776',
				tickCumulative: '-28055903863',
			});
		});

		it('can observe at exactly the latest observation after some time passes', async () => {
			oracle.advanceTime('5');
			await checkObserve(5, {
				secondsPerLiquidityCumulativeX128: '60471787506468701386237800669810720099776',
				tickCumulative: '-28055903863',
			});
			oracle.subTime('5');
		});

		it('can observe after the latest observation counterfactual', async () => {
			oracle.advanceTime('5');
			await checkObserve(3, {
				secondsPerLiquidityCumulativeX128: '60471797865298117996489508104462919730461',
				tickCumulative: '-28056035261',
			});
			oracle.subTime('5');
		});

		it('can observe into the unordered portion of array at exact seconds ago of observation', async () => {
			await checkObserve(200 * 13, {
				secondsPerLiquidityCumulativeX128: '60458300386499273141628780395875293027404',
				tickCumulative: '-27885347763',
			});
		});

		it('can observe into the unordered portion of array at seconds ago between observations', async () => {
			await checkObserve(200 * 13 + 5, {
				secondsPerLiquidityCumulativeX128: '60458274409952896081377821330361274907140',
				tickCumulative: '-27885020273',
			});
		});

		it('can observe the oldest observation 13*65534 seconds ago', async () => {
			await checkObserve(13 * 65534, {
				secondsPerLiquidityCumulativeX128: '33974356747348039873972993881117400879779',
				tickCumulative: '-175890',
			});
		});

		it('can observe the oldest observation 13*65534 + 5 seconds ago if time has elapsed', async () => {
			oracle.advanceTime('5');
			await checkObserve(13 * 65534 + 5, {
				secondsPerLiquidityCumulativeX128: '33974356747348039873972993881117400879779',
				tickCumulative: '-175890',
			});
			oracle.subTime('5');
		});
	});
});
