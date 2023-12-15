/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-extraneous-class */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { SwaptoshiPool } from '../../../../../../../src/app/modules/dex/stores/factory';
import {
	Uint256String,
	Uint256,
} from '../../../../../../../src/app/modules/dex/stores/library/int';

export function setFeeGrowthGlobal0X128(this: SwaptoshiPool, _feeGrowthGlobal0X128: Uint256String) {
	this.feeGrowthGlobal0X128 = _feeGrowthGlobal0X128;
}

export function setFeeGrowthGlobal1X128(this: SwaptoshiPool, _feeGrowthGlobal1X128: Uint256String) {
	this.feeGrowthGlobal1X128 = _feeGrowthGlobal1X128;
}

export function advanceTime(this: SwaptoshiPool, by: Uint256String) {
	if (this['mutableDependencyReady']) {
		this['mutableContext']!.timestamp = Uint256.from(this['mutableContext']!.timestamp)
			.add(by)
			.toString();
	}
}
