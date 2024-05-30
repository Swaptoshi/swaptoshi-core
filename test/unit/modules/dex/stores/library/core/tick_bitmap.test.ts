import { MethodContext } from 'klayr-sdk';
import * as tickBitmap from '../../../../../../../src/app/modules/dex/stores/library/core/tick_bitmap';
import { TickBitmapStore } from '../../../../../../../src/app/modules/dex/stores/tick_bitmap';
import { Int24String } from '../../../../../../../src/app/modules/dex/stores/library/int';
import { methodContextFixture } from '../../shared/module';

let tickBitmapStore: TickBitmapStore;
let methodContext: MethodContext;
const POOL_ADDRESS = Buffer.from('0000000000000000000000000000000000000000', 'hex');

async function isInitialized(tick: Int24String): Promise<boolean> {
	const [next, initialized] = await tickBitmap.nextInitializedTickWithinOneWord(
		tickBitmapStore,
		methodContext,
		POOL_ADDRESS,
		tick,
		'1',
		true,
	);
	return next === tick ? initialized : false;
}

async function initTicks(ticks: string[]): Promise<void> {
	for (const tick of ticks) {
		await tickBitmap.flipTick(tickBitmapStore, methodContext, POOL_ADDRESS, tick, '1');
	}
}

describe('TickBitmap', () => {
	let createMethodContext: () => MethodContext;

	beforeEach(async () => {
		({ tickBitmapStore, createMethodContext } = await methodContextFixture());
		methodContext = createMethodContext();
	});

	describe('#isInitialized', () => {
		it('is false at first', async () => {
			expect(await isInitialized('1')).toBe(false);
		});
		it('is flipped by #flipTick', async () => {
			await tickBitmap.flipTick(tickBitmapStore, methodContext, POOL_ADDRESS, '1', '1');
			expect(await isInitialized('1')).toBe(true);
		});
		it('is flipped back by #flipTick', async () => {
			await tickBitmap.flipTick(tickBitmapStore, methodContext, POOL_ADDRESS, '1', '1');
			await tickBitmap.flipTick(tickBitmapStore, methodContext, POOL_ADDRESS, '1', '1');
			expect(await isInitialized('1')).toBe(false);
		});
		it('is not changed by another flip to a different tick', async () => {
			await tickBitmap.flipTick(tickBitmapStore, methodContext, POOL_ADDRESS, '2', '1');
			expect(await isInitialized('1')).toBe(false);
		});
		it('is not changed by another flip to a different tick on another word', async () => {
			await tickBitmap.flipTick(
				tickBitmapStore,
				methodContext,
				POOL_ADDRESS,
				(1 + 256).toString(),
				'1',
			);
			expect(await isInitialized('257')).toBe(true);
			expect(await isInitialized('1')).toBe(false);
		});
	});

	describe('#flipTick', () => {
		it('flips only the specified tick', async () => {
			await tickBitmap.flipTick(tickBitmapStore, methodContext, POOL_ADDRESS, '-230', '1');
			expect(await isInitialized('-230')).toBe(true);
			expect(await isInitialized('-231')).toBe(false);
			expect(await isInitialized('-229')).toBe(false);
			expect(await isInitialized((-230 + 256).toString())).toBe(false);
			expect(await isInitialized((-230 - 256).toString())).toBe(false);
			await tickBitmap.flipTick(tickBitmapStore, methodContext, POOL_ADDRESS, '-230', '1');
			expect(await isInitialized('-230')).toBe(false);
			expect(await isInitialized('-231')).toBe(false);
			expect(await isInitialized('-229')).toBe(false);
			expect(await isInitialized((-230 + 256).toString())).toBe(false);
			expect(await isInitialized((-230 - 256).toString())).toBe(false);
		});

		it('reverts only itself', async () => {
			await tickBitmap.flipTick(tickBitmapStore, methodContext, POOL_ADDRESS, '-230', '1');
			await tickBitmap.flipTick(tickBitmapStore, methodContext, POOL_ADDRESS, '-259', '1');
			await tickBitmap.flipTick(tickBitmapStore, methodContext, POOL_ADDRESS, '-229', '1');
			await tickBitmap.flipTick(tickBitmapStore, methodContext, POOL_ADDRESS, '500', '1');
			await tickBitmap.flipTick(tickBitmapStore, methodContext, POOL_ADDRESS, '-259', '1');
			await tickBitmap.flipTick(tickBitmapStore, methodContext, POOL_ADDRESS, '-229', '1');
			await tickBitmap.flipTick(tickBitmapStore, methodContext, POOL_ADDRESS, '-259', '1');

			expect(await isInitialized('-259')).toBe(true);
			expect(await isInitialized('-229')).toBe(false);
		});
	});

	describe('#nextInitializedTickWithinOneWord', () => {
		beforeEach(async () => {
			// word boundaries are at multiples of 256
			await initTicks(['-200', '-55', '-4', '70', '78', '84', '139', '240', '535']);
		});

		describe('lte = false', () => {
			it('returns tick to right if at initialized tick', async () => {
				const [next, initialized] = await tickBitmap.nextInitializedTickWithinOneWord(
					tickBitmapStore,
					methodContext,
					POOL_ADDRESS,
					'78',
					'1',
					false,
				);
				expect(next).toBe('84');
				expect(initialized).toBe(true);
			});
			it('returns tick to right if at initialized tick - 2', async () => {
				const [next, initialized] = await tickBitmap.nextInitializedTickWithinOneWord(
					tickBitmapStore,
					methodContext,
					POOL_ADDRESS,
					'-55',
					'1',
					false,
				);
				expect(next).toBe('-4');
				expect(initialized).toBe(true);
			});

			it('returns the tick directly to the right', async () => {
				const [next, initialized] = await tickBitmap.nextInitializedTickWithinOneWord(
					tickBitmapStore,
					methodContext,
					POOL_ADDRESS,
					'77',
					'1',
					false,
				);
				expect(next).toBe('78');
				expect(initialized).toBe(true);
			});
			it('returns the tick directly to the right - 2', async () => {
				const [next, initialized] = await tickBitmap.nextInitializedTickWithinOneWord(
					tickBitmapStore,
					methodContext,
					POOL_ADDRESS,
					'-56',
					'1',
					false,
				);
				expect(next).toBe('-55');
				expect(initialized).toBe(true);
			});

			it('returns the next words initialized tick if on the right boundary', async () => {
				const [next, initialized] = await tickBitmap.nextInitializedTickWithinOneWord(
					tickBitmapStore,
					methodContext,
					POOL_ADDRESS,
					'255',
					'1',
					false,
				);
				expect(next).toBe('511');
				expect(initialized).toBe(false);
			});
			it('returns the next words initialized tick if on the right boundary - 2', async () => {
				const [next, initialized] = await tickBitmap.nextInitializedTickWithinOneWord(
					tickBitmapStore,
					methodContext,
					POOL_ADDRESS,
					'-257',
					'1',
					false,
				);
				expect(next).toBe('-200');
				expect(initialized).toBe(true);
			});

			it('returns the next initialized tick from the next word', async () => {
				await tickBitmap.flipTick(tickBitmapStore, methodContext, POOL_ADDRESS, '340', '1');
				const [next, initialized] = await tickBitmap.nextInitializedTickWithinOneWord(
					tickBitmapStore,
					methodContext,
					POOL_ADDRESS,
					'328',
					'1',
					false,
				);
				expect(next).toBe('340');
				expect(initialized).toBe(true);
			});
			it('does not exceed boundary', async () => {
				const [next, initialized] = await tickBitmap.nextInitializedTickWithinOneWord(
					tickBitmapStore,
					methodContext,
					POOL_ADDRESS,
					'508',
					'1',
					false,
				);
				expect(next).toBe('511');
				expect(initialized).toBe(false);
			});
			it('skips entire word', async () => {
				const [next, initialized] = await tickBitmap.nextInitializedTickWithinOneWord(
					tickBitmapStore,
					methodContext,
					POOL_ADDRESS,
					'255',
					'1',
					false,
				);
				expect(next).toBe('511');
				expect(initialized).toBe(false);
			});
			it('skips half word', async () => {
				const [next, initialized] = await tickBitmap.nextInitializedTickWithinOneWord(
					tickBitmapStore,
					methodContext,
					POOL_ADDRESS,
					'383',
					'1',
					false,
				);
				expect(next).toBe('511');
				expect(initialized).toBe(false);
			});
		});

		describe('lte = true', () => {
			it('returns same tick if initialized', async () => {
				const [next, initialized] = await tickBitmap.nextInitializedTickWithinOneWord(
					tickBitmapStore,
					methodContext,
					POOL_ADDRESS,
					'78',
					'1',
					true,
				);

				expect(next).toBe('78');
				expect(initialized).toBe(true);
			});
			it('returns tick directly to the left of input tick if not initialized', async () => {
				const [next, initialized] = await tickBitmap.nextInitializedTickWithinOneWord(
					tickBitmapStore,
					methodContext,
					POOL_ADDRESS,
					'79',
					'1',
					true,
				);

				expect(next).toBe('78');
				expect(initialized).toBe(true);
			});
			it('will not exceed the word boundary', async () => {
				const [next, initialized] = await tickBitmap.nextInitializedTickWithinOneWord(
					tickBitmapStore,
					methodContext,
					POOL_ADDRESS,
					'258',
					'1',
					true,
				);

				expect(next).toBe('256');
				expect(initialized).toBe(false);
			});
			it('at the word boundary', async () => {
				const [next, initialized] = await tickBitmap.nextInitializedTickWithinOneWord(
					tickBitmapStore,
					methodContext,
					POOL_ADDRESS,
					'256',
					'1',
					true,
				);

				expect(next).toBe('256');
				expect(initialized).toBe(false);
			});
			it('word boundary less 1 (next initialized tick in next word)', async () => {
				const [next, initialized] = await tickBitmap.nextInitializedTickWithinOneWord(
					tickBitmapStore,
					methodContext,
					POOL_ADDRESS,
					'72',
					'1',
					true,
				);

				expect(next).toBe('70');
				expect(initialized).toBe(true);
			});
			it('word boundary', async () => {
				const [next, initialized] = await tickBitmap.nextInitializedTickWithinOneWord(
					tickBitmapStore,
					methodContext,
					POOL_ADDRESS,
					'-257',
					'1',
					true,
				);

				expect(next).toBe('-512');
				expect(initialized).toBe(false);
			});
			it('entire empty word', async () => {
				const [next, initialized] = await tickBitmap.nextInitializedTickWithinOneWord(
					tickBitmapStore,
					methodContext,
					POOL_ADDRESS,
					'1023',
					'1',
					true,
				);

				expect(next).toBe('768');
				expect(initialized).toBe(false);
			});
			it('halfway through empty word', async () => {
				const [next, initialized] = await tickBitmap.nextInitializedTickWithinOneWord(
					tickBitmapStore,
					methodContext,
					POOL_ADDRESS,
					'900',
					'1',
					true,
				);

				expect(next).toBe('768');
				expect(initialized).toBe(false);
			});
			it('boundary is initialized', async () => {
				await tickBitmap.flipTick(tickBitmapStore, methodContext, POOL_ADDRESS, '329', '1');
				const [next, initialized] = await tickBitmap.nextInitializedTickWithinOneWord(
					tickBitmapStore,
					methodContext,
					POOL_ADDRESS,
					'456',
					'1',
					true,
				);

				expect(next).toBe('329');
				expect(initialized).toBe(true);
			});
		});
	});
});
