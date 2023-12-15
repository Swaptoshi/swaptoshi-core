import { ObserveParams } from '../../../types';
import { verifyAddress, verifyNumberString } from '../base';

export function verifyObserveParam(params: ObserveParams) {
	verifyAddress('poolAddress', Buffer.from(params.poolAddress, 'hex'));
	params.secondsAgos.forEach(secondsAgos => {
		verifyNumberString('secondsAgos', secondsAgos);
	});
}
