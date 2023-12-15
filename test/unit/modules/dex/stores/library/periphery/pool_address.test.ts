/* eslint-disable @typescript-eslint/require-await */
import * as poolAddress from '../../../../../../../src/app/modules/dex/stores/library/periphery/pool_address';

const addressZero = Buffer.alloc(8);

describe('PoolAddress', () => {
	describe('#computeAddress', () => {
		it('all arguments equal zero', async () => {
			await expect(
				(async () =>
					poolAddress.computeAddress({
						token0: addressZero,
						token1: addressZero,
						fee: '0',
					}))(),
			).rejects.toThrow();
		});

		it('matches example', async () => {
			expect(
				poolAddress
					.computeAddress({
						token0: Buffer.from('1000000000000000', 'hex'),
						token1: Buffer.from('2000000000000000', 'hex'),
						fee: '250',
					})
					.toString('hex'),
			).toMatchSnapshot();
		});

		it('token argument order cannot be in reverse', async () => {
			await expect(
				(async () =>
					poolAddress.computeAddress({
						token0: Buffer.from('2000000000000000', 'hex'),
						token1: Buffer.from('1000000000000000', 'hex'),
						fee: '3000',
					}))(),
			).rejects.toThrow();
		});
	});
});
