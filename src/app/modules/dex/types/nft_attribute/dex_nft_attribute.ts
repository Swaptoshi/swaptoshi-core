import { Int24String } from '../../stores/library/int';
import { PositionInfo } from '../stores/position_info';

export interface DexNFTAttribute extends PositionInfo {
	token0: Buffer;
	token1: Buffer;
	fee: string;
	tickLower: Int24String;
	tickUpper: Int24String;
}
