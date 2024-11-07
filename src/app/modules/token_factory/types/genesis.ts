import { AirdropStoreData, FactoryStoreData, ICOStoreData, NextAvailableTokenIdStoreData, VestingUnlockStoreData } from './stores';

export interface TokenFactoryGenesisStore {
	airdropSubstore: AirdropGenesisSubstore[];
	factorySubstore: FactoryGenesisSubstore[];
	icoSubstore: ICOGenesisSubstore[];
	nextAvailableTokenIdSubstore: NextAvailableTokenIdStoreData;
	vestingUnlockSubstore: VestingUnlockGenesisSubstore[];
}

interface AirdropGenesisSubstore extends AirdropStoreData {
	tokenId: Buffer;
	providerAddress: Buffer;
}

interface FactoryGenesisSubstore extends FactoryStoreData {
	tokenId: Buffer;
}

interface ICOGenesisSubstore extends ICOStoreData {
	poolAddress: Buffer;
}

interface VestingUnlockGenesisSubstore extends VestingUnlockStoreData {
	height: number;
}
