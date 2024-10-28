import { DEXPoolData, Observation, PositionInfo, PositionManager, SupportedTokenManager, TickBitmap, TickInfo, TokenSymbol } from './stores';

export interface DexGenesisStore {
	observationSubstore: ObservationGenesisSubstore[];
	poolSubstore: DEXPoolData[];
	positionInfoSubstore: PositionInfoSubstore[];
	positionManagerSubstore: PositionManager[];
	supportedTokenSubstore: SupportedTokenManager;
	tickBitmapSubstore: TickBitmapSubstore[];
	tickInfoSubstore: TickInfoSubstore[];
	tokenSymbolSubstore: TokenSymbolSubstore[];
}

interface ObservationGenesisSubstore extends Observation {
	poolAddress: Buffer;
	index: string;
}

interface PositionInfoSubstore extends PositionInfo {
	poolAddress: Buffer;
	key: Buffer;
}

interface TickBitmapSubstore extends TickBitmap {
	poolAddress: Buffer;
	index: string;
}

interface TickInfoSubstore extends TickInfo {
	poolAddress: Buffer;
	tick: string;
}

interface TokenSymbolSubstore extends TokenSymbol {
	tokenID: Buffer;
}
