import { GenesisConfig, ImmutableMethodContext, MethodContext } from 'klayr-sdk';

export interface GovernableConfigStoreData {
	data: Buffer;
}

export interface GovernableConfigVerifyContext<T extends object> {
	context: ImmutableMethodContext;
	config: T;
	genesisConfig: GenesisConfig;
}

export interface GovernableConfigSetContext<T> extends MethodContext {
	config: T;
}
