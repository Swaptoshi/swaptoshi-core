/* eslint-disable import/no-cycle */
/* eslint-disable camelcase */
/* eslint-disable import/no-extraneous-dependencies */
import { ModuleConfig } from 'klayr-framework/dist-node/modules/fee/types';
import { FeeMethod, MethodContext } from 'klayr-sdk';
import { tokenID } from '../module';

export const mock_fee_init = jest.fn();
export const mock_fee_getFeeTokenID = jest.fn();
export const mock_fee_payFee = jest.fn();

export class MockedFeeMethod implements Omit<FeeMethod, ''> {
	public init(_config: ModuleConfig): void {
		mock_fee_init(_config);
	}
	public getFeeTokenID(): Buffer {
		mock_fee_getFeeTokenID();
		return tokenID;
	}
	public payFee(_methodContext: MethodContext, _amount: bigint): void {
		mock_fee_payFee(_amount);
	}
}
