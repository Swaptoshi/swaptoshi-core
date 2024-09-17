import { StateMachine, Types } from 'klayr-sdk';

export interface GovernableConfigStoreData {
	data: Buffer;
}

export interface GovernableConfigVerifyContext<T extends object> {
	context: StateMachine.ImmutableMethodContext;
	config: T;
	genesisConfig: Types.GenesisConfig;
}

export interface GovernableConfigSetContext<T> extends StateMachine.MethodContext {
	oldConfig: T;
	newConfig: T;
}
