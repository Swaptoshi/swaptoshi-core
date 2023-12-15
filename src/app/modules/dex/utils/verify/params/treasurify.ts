import { TreasurifyParams } from '../../../types';
import { verifyAddress, verifyToken } from '../base';

export function verifyTreasurifyParam(params: TreasurifyParams) {
	verifyAddress('address', params.address);
	verifyToken('token', params.token);
}
