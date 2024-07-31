import { GenesisConfig, MethodContext } from 'klayr-sdk';

export interface GovernableConfigStoreData {
	data: Buffer;
}

export interface GovernableConfigVerifyContext<T extends object> {
	context: MethodContext;
	config: T;
	genesisConfig: GenesisConfig;
}
