/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { MockedFeeConversionMethod, mock_fee_conversion_add_dependencies, mock_fee_conversion_init, mock_fee_conversion_register } from '.';
import { FeeConversionMethod } from '../../../../../../../src/app/modules/fee_conversion';

describe('MockedFeeConversionMethod', () => {
	let feeConversionMethod: FeeConversionMethod;

	beforeEach(() => {
		feeConversionMethod = new MockedFeeConversionMethod() as FeeConversionMethod;
	});

	describe('init', () => {
		it('should call mock functions', () => {
			feeConversionMethod.init('init' as any);
			expect(mock_fee_conversion_init).toHaveBeenCalledWith('init');
		});
	});

	describe('addDependencies', () => {
		it('should call mock functions', () => {
			feeConversionMethod.addDependencies('1' as any, '2' as any);
			expect(mock_fee_conversion_add_dependencies).toHaveBeenCalledWith('1', '2');
		});
	});

	describe('register', () => {
		it('should call mock functions', () => {
			feeConversionMethod.register('module', ['command'], 'handler' as any);
			expect(mock_fee_conversion_register).toHaveBeenCalledWith('module', ['command'], 'handler');
		});
	});
});
