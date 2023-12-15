/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { NonfungiblePositionManager } from '../../../../../../../src/app/modules/dex/stores/factory';
import { Uint256String } from '../../../../../../../src/app/modules/dex/stores/library/int';

export function setTime(this: NonfungiblePositionManager, _time: Uint256String) {
	if (this['mutableDependencyReady']) {
		this['mutableContext']!.timestamp = _time;
	}
}
