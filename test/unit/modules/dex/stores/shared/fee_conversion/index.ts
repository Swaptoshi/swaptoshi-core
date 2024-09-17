/* eslint-disable import/no-cycle */
/* eslint-disable camelcase */
/* eslint-disable import/no-extraneous-dependencies */
import { FeeMethod, TokenMethod } from '../../../../../../../src/app/modules/dex/types';
import { BaseFeeConversionMethod, FeeConversionMethod } from '../../../../../../../src/app/modules/fee_conversion';
import { FeeConversionMethodRegistry } from '../../../../../../../src/app/modules/fee_conversion/registry';

export const mock_fee_conversion_init = jest.fn();
export const mock_fee_conversion_add_dependencies = jest.fn();
export const mock_fee_conversion_register = jest.fn();
export const mock_fee_conversion_unregister = jest.fn();

export class MockedFeeConversionMethod implements Omit<FeeConversionMethod, ''> {
	public init(handler: FeeConversionMethodRegistry): void {
		mock_fee_conversion_init(handler);
	}

	public addDependencies(tokenMethod: TokenMethod, feeMethod: FeeMethod): void {
		mock_fee_conversion_add_dependencies(tokenMethod, feeMethod);
	}

	public register(module: string, commands: string[], handler: BaseFeeConversionMethod): void {
		mock_fee_conversion_register(module, commands, handler);
	}

	public unregister(module: string, commands: string[], handler: BaseFeeConversionMethod): void {
		mock_fee_conversion_unregister(module, commands, handler);
	}
}
