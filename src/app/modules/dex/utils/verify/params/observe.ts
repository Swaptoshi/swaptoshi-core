/* eslint-disable import/no-cycle */
import { ObserveParams } from '../../../types';
import { verifyKlayer32Address, verifyNumberString } from '../base';

export function verifyObserveParam(params: ObserveParams) {
	verifyKlayer32Address('poolAddress', params.poolAddress);
	params.secondsAgos.forEach(secondsAgos => {
		verifyNumberString('secondsAgos', secondsAgos);
	});
}
