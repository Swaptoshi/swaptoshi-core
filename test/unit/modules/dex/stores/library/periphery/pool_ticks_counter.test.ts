import { StateMachine } from 'klayr-sdk';
import { methodSwapContext } from '../../../../../../../src/app/modules/dex/stores/context';
import { DEXPool } from '../../../../../../../src/app/modules/dex/stores/factory';
import * as PoolTicksCounter from '../../../../../../../src/app/modules/dex/stores/library/periphery/pool_ticks_counter';
import { TickBitmapStore } from '../../../../../../../src/app/modules/dex/stores/tick_bitmap';
import { methodContextFixture } from '../../shared/module';
import { TEST_POOL_START_TIME, completeFixture } from '../../shared/pool';
import { Uint256 } from '../../../../../../../src/app/modules/dex/stores/library/int';

const sender = Buffer.from('0000000000000000000000000000000000000005', 'hex');

describe('PoolTicksCounter', () => {
	let tickBitmapStore: TickBitmapStore;
	let context: StateMachine.MethodContext;

	const TICK_SPACINGS = ['200', '60', '10'];

	TICK_SPACINGS.forEach(TICK_SPACING => {
		let pool: DEXPool;

		// Bit index to tick
		const bitIdxToTick = (idx: number, page = 0) => {
			return (idx * parseInt(TICK_SPACING, 10) + page * 256 * parseInt(TICK_SPACING, 10)).toString();
		};

		async function setTickBitmap(index: string, bitmap: string) {
			await tickBitmapStore.set(context, tickBitmapStore.getKey(pool.address, index), {
				bitmap,
			});
		}

		beforeEach(async () => {
			const { module, createMethodContext, tickBitmapStore: _tickBitmapStore } = await methodContextFixture();
			tickBitmapStore = _tickBitmapStore;
			context = createMethodContext();
			const _context = methodSwapContext(context, sender, parseInt(TEST_POOL_START_TIME, 10));
			const fixture = await completeFixture(_context, module);
			pool = await fixture.createPool('0', TICK_SPACING, fixture.token0, fixture.token1);
		});

		describe(`[Tick Spacing: ${TICK_SPACING}]: tick after is bigger`, () => {
			it('same tick initialized', async () => {
				await setTickBitmap('0', (0b1100).toString());
				const result = await PoolTicksCounter.countInitializedTicksCrossed(tickBitmapStore, context, pool, bitIdxToTick(2), bitIdxToTick(2));
				expect(result).toBe('1');
			});

			it('same tick not-initialized', async () => {
				await setTickBitmap('0', (0b1100).toString());
				const result = await PoolTicksCounter.countInitializedTicksCrossed(tickBitmapStore, context, pool, bitIdxToTick(1), bitIdxToTick(1));
				expect(result).toBe('0');
			});

			it('same page', async () => {
				await setTickBitmap('0', (0b1100).toString());
				const result = await PoolTicksCounter.countInitializedTicksCrossed(tickBitmapStore, context, pool, bitIdxToTick(0), bitIdxToTick(255));
				expect(result).toBe('2');
			});

			it('multiple pages', async () => {
				await setTickBitmap('0', (0b1100).toString());
				await setTickBitmap('1', (0b1101).toString());
				const result = await PoolTicksCounter.countInitializedTicksCrossed(tickBitmapStore, context, pool, bitIdxToTick(0), bitIdxToTick(255, 1));
				expect(result).toBe('5');
			});

			it('counts all ticks in a page except ending tick', async () => {
				await setTickBitmap('0', Uint256.MAX);
				await setTickBitmap('1', (0x0).toString());
				const result = await PoolTicksCounter.countInitializedTicksCrossed(tickBitmapStore, context, pool, bitIdxToTick(0), bitIdxToTick(255, 1));
				expect(result).toBe('255');
			});

			it('counts ticks to left of start and right of end on same page', async () => {
				await setTickBitmap('0', (0b1111000100001111).toString());
				const result = await PoolTicksCounter.countInitializedTicksCrossed(tickBitmapStore, context, pool, bitIdxToTick(8), bitIdxToTick(255));
				expect(result).toBe('4');
			});

			it('counts ticks to left of start and right of end across on multiple pages', async () => {
				await setTickBitmap('0', (0b1111000100001111).toString());
				await setTickBitmap('1', (0b1111000100001111).toString());
				const result = await PoolTicksCounter.countInitializedTicksCrossed(tickBitmapStore, context, pool, bitIdxToTick(8), bitIdxToTick(8, 1));
				expect(result).toBe('9');
			});

			it('counts ticks when before and after are initialized on same page', async () => {
				await setTickBitmap('0', (0b11111100).toString());
				const startingTickInit = await PoolTicksCounter.countInitializedTicksCrossed(tickBitmapStore, context, pool, bitIdxToTick(2), bitIdxToTick(255));
				expect(startingTickInit).toBe('5');
				const endingTickInit = await PoolTicksCounter.countInitializedTicksCrossed(tickBitmapStore, context, pool, bitIdxToTick(0), bitIdxToTick(3));
				expect(endingTickInit).toBe('2');
				const bothInit = await PoolTicksCounter.countInitializedTicksCrossed(tickBitmapStore, context, pool, bitIdxToTick(2), bitIdxToTick(5));
				expect(bothInit).toBe('3');
			});

			it('counts ticks when before and after are initialized on multiple page', async () => {
				await setTickBitmap('0', (0b11111100).toString());
				await setTickBitmap('1', (0b11111100).toString());
				const startingTickInit = await PoolTicksCounter.countInitializedTicksCrossed(tickBitmapStore, context, pool, bitIdxToTick(2), bitIdxToTick(255));
				expect(startingTickInit).toBe('5');
				const endingTickInit = await PoolTicksCounter.countInitializedTicksCrossed(tickBitmapStore, context, pool, bitIdxToTick(0), bitIdxToTick(3, 1));
				expect(endingTickInit).toBe('8');
				const bothInit = await PoolTicksCounter.countInitializedTicksCrossed(tickBitmapStore, context, pool, bitIdxToTick(2), bitIdxToTick(5, 1));
				expect(bothInit).toBe('9');
			});

			it('counts ticks with lots of pages', async () => {
				await setTickBitmap('0', (0b11111100).toString());
				await setTickBitmap('1', (0b11111111).toString());
				await setTickBitmap('2', (0x0).toString());
				await setTickBitmap('3', (0x0).toString());
				await setTickBitmap('4', (0b11111100).toString());

				const bothInit = await PoolTicksCounter.countInitializedTicksCrossed(tickBitmapStore, context, pool, bitIdxToTick(4), bitIdxToTick(5, 4));
				expect(bothInit).toBe('15');
			});
		});

		describe(`[Tick Spacing: ${TICK_SPACING}]: tick after is smaller`, () => {
			it('same page', async () => {
				await setTickBitmap('0', (0b1100).toString());
				const result = await PoolTicksCounter.countInitializedTicksCrossed(tickBitmapStore, context, pool, bitIdxToTick(255), bitIdxToTick(0));
				expect(result).toBe('2');
			});

			it('multiple pages', async () => {
				await setTickBitmap('0', (0b1100).toString());
				await setTickBitmap('-1', (0b1100).toString());
				const result = await PoolTicksCounter.countInitializedTicksCrossed(tickBitmapStore, context, pool, bitIdxToTick(255), bitIdxToTick(0, -1));
				expect(result).toBe('4');
			});

			it('counts all ticks in a page', async () => {
				await setTickBitmap('0', Uint256.MAX);
				await setTickBitmap('-1', (0x0).toString());
				const result = await PoolTicksCounter.countInitializedTicksCrossed(tickBitmapStore, context, pool, bitIdxToTick(255), bitIdxToTick(0, -1));
				expect(result).toBe('256');
			});

			it('counts ticks to right of start and left of end on same page', async () => {
				await setTickBitmap('0', (0b1111000100001111).toString());
				const result = await PoolTicksCounter.countInitializedTicksCrossed(tickBitmapStore, context, pool, bitIdxToTick(15), bitIdxToTick(2));
				expect(result).toBe('6');
			});

			it('counts ticks to right of start and left of end on multiple pages', async () => {
				await setTickBitmap('0', (0b1111000100001111).toString());
				await setTickBitmap('-1', (0b1111000100001111).toString());
				const result = await PoolTicksCounter.countInitializedTicksCrossed(tickBitmapStore, context, pool, bitIdxToTick(8), bitIdxToTick(8, -1));
				expect(result).toBe('9');
			});

			it('counts ticks when before and after are initialized on same page', async () => {
				await setTickBitmap('0', (0b11111100).toString());
				const startingTickInit = await PoolTicksCounter.countInitializedTicksCrossed(tickBitmapStore, context, pool, bitIdxToTick(3), bitIdxToTick(0));
				expect(startingTickInit).toBe('2');
				const endingTickInit = await PoolTicksCounter.countInitializedTicksCrossed(tickBitmapStore, context, pool, bitIdxToTick(255), bitIdxToTick(2));
				expect(endingTickInit).toBe('5');
				const bothInit = await PoolTicksCounter.countInitializedTicksCrossed(tickBitmapStore, context, pool, bitIdxToTick(5), bitIdxToTick(2));
				expect(bothInit).toBe('3');
			});

			it('counts ticks when before and after are initialized on multiple page', async () => {
				await setTickBitmap('0', (0b11111100).toString());
				await setTickBitmap('-1', (0b11111100).toString());
				const startingTickInit = await PoolTicksCounter.countInitializedTicksCrossed(tickBitmapStore, context, pool, bitIdxToTick(2), bitIdxToTick(3, -1));
				expect(startingTickInit).toBe('5');
				const endingTickInit = await PoolTicksCounter.countInitializedTicksCrossed(tickBitmapStore, context, pool, bitIdxToTick(5), bitIdxToTick(255, -1));
				expect(endingTickInit).toBe('4');
				const bothInit = await PoolTicksCounter.countInitializedTicksCrossed(tickBitmapStore, context, pool, bitIdxToTick(2), bitIdxToTick(5, -1));
				expect(bothInit).toBe('3');
			});

			it('counts ticks with lots of pages', async () => {
				await setTickBitmap('0', (0b11111100).toString());
				await setTickBitmap('-1', (0xff).toString());
				await setTickBitmap('-2', (0x0).toString());
				await setTickBitmap('-3', (0x0).toString());
				await setTickBitmap('-4', (0b11111100).toString());

				const bothInit = await PoolTicksCounter.countInitializedTicksCrossed(tickBitmapStore, context, pool, bitIdxToTick(3), bitIdxToTick(6, -4));
				expect(bothInit).toBe('11');
			});
		});
	});
});
