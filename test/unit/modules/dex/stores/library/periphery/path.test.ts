/* eslint-disable @typescript-eslint/require-await */
import * as path from '../../../../../../../src/app/modules/dex/stores/library/periphery/path';
import { decodePath, encodePath } from '../../shared/path';
import { FeeAmount } from '../../shared/utilities';

describe('Path', () => {
	const tokenAddresses = [
		Buffer.from('5fc8d32690cc91d4', 'hex'),
		Buffer.from('cf7ed3acca5a467e', 'hex'),
		Buffer.from('dc64a140aa3e9811', 'hex'),
	];
	const fees = [FeeAmount.MEDIUM, FeeAmount.MEDIUM];

	it('js encoding works as expected', async () => {
		let expectedPath = Buffer.from(
			tokenAddresses
				.slice(0, 2)
				.map(tokenAddress => tokenAddress.toString('hex').toLowerCase())
				.join('000bb8'),
			'hex',
		);
		expect(encodePath(tokenAddresses.slice(0, 2), fees.slice(0, 1)).toString('hex')).toStrictEqual(
			expectedPath.toString('hex'),
		);

		expectedPath = Buffer.from(
			tokenAddresses.map(tokenAddress => tokenAddress.toString('hex').toLowerCase()).join('000bb8'),
			'hex',
		);
		expect(encodePath(tokenAddresses, fees).toString('hex')).toStrictEqual(
			expectedPath.toString('hex'),
		);
	});

	it('js decoding works as expected', async () => {
		const encodedPath = encodePath(tokenAddresses, fees);
		const [decodedTokens, decodedFees] = decodePath(encodedPath);
		expect(decodedTokens).toStrictEqual(tokenAddresses);
		expect(decodedFees).toStrictEqual(fees);
	});

	describe('#hasMultiplePools / #decodeFirstPool / #skipToken / #getFirstPool', () => {
		const encodedPath = encodePath(tokenAddresses, fees);

		it('works on first pool', async () => {
			expect(path.hasMultiplePools(encodedPath)).toBeTruthy();

			const [tokenA, tokenB, fee] = path.decodeFirstPool(encodedPath);
			expect(tokenA).toStrictEqual(tokenAddresses[0]);
			expect(tokenB).toStrictEqual(tokenAddresses[1]);
			expect(fee).toBe(FeeAmount.MEDIUM);

			expect(path.decodeFirstPool(path.getFirstPool(encodedPath))).toStrictEqual([
				tokenA,
				tokenB,
				fee,
			]);
		});

		const offset = 8 + 3;

		it('skips 1 item', async () => {
			const skipped = path.skipToken(encodedPath);
			expect(skipped.toString('hex')).toStrictEqual(encodedPath.toString('hex').slice(offset * 2));

			expect(path.hasMultiplePools(skipped)).not.toBeTruthy();

			const [tokenA, tokenB, decodedFee] = path.decodeFirstPool(skipped);
			expect(tokenA).toStrictEqual(tokenAddresses[1]);
			expect(tokenB).toStrictEqual(tokenAddresses[2]);
			expect(decodedFee).toBe(FeeAmount.MEDIUM);
		});
	});
});
