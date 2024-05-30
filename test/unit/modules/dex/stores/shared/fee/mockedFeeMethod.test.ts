/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { FeeMethod } from 'klayr-sdk';
import { MockedFeeMethod, mock_fee_getFeeTokenID, mock_fee_init, mock_fee_payFee } from '.';

describe('MockedFeeMethod', () => {
	let feeMethod: FeeMethod;

	beforeEach(() => {
		feeMethod = new MockedFeeMethod() as FeeMethod;
	});

	describe('init', () => {
		it('should call mock functions', () => {
			feeMethod.init('init' as any);
			expect(mock_fee_init).toHaveBeenCalledWith('init');
		});
	});

	describe('getFeeTokenID', () => {
		it('should call mock functions', () => {
			feeMethod.getFeeTokenID();
			expect(mock_fee_getFeeTokenID).toHaveBeenCalled();
		});
	});

	describe('payFee', () => {
		it('should call mock functions', () => {
			feeMethod.payFee({} as any, 'payFee' as any);
			expect(mock_fee_payFee).toHaveBeenCalledWith('payFee');
		});
	});
});
