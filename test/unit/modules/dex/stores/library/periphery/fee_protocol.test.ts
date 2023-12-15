/* eslint-disable @typescript-eslint/require-await */
import * as feeProtocol from '../../../../../../../src/app/modules/dex/stores/library/periphery/fee_protocol';

describe('FeeProtocol', () => {
	describe('calculateFeeProtocol', () => {
		it('should return correct protocol fee value', () => {
			expect(feeProtocol.calculateFeeProtocol('4', '4')).toBe(68);
		});

		it('should return zero', () => {
			expect(feeProtocol.calculateFeeProtocol('0', '0')).toBe(0);
		});

		it('should throw an error if fee0 less than 4', async () => {
			await expect((async () => feeProtocol.calculateFeeProtocol('3', '4'))()).rejects.toThrow();
		});

		it('should throw an error if fee1 less than 4', async () => {
			await expect((async () => feeProtocol.calculateFeeProtocol('4', '3'))()).rejects.toThrow();
		});

		it('should throw an error if fee0 greater than 10', async () => {
			await expect((async () => feeProtocol.calculateFeeProtocol('11', '4'))()).rejects.toThrow();
		});

		it('should throw an error if fee1 greater than 10', async () => {
			await expect((async () => feeProtocol.calculateFeeProtocol('4', '11'))()).rejects.toThrow();
		});
	});
});
