/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { SwapRouter } from '../../../../../../../src/app/modules/dex/stores/factory';
import { Uint256String } from '../../../../../../../src/app/modules/dex/stores/library/int';

export function setTime(this: SwapRouter, _time: Uint256String) {
	if (this['mutableDependencyReady']) {
		this['mutableContext']!.timestamp = _time;
	}
}
