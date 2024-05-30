/* eslint-disable @typescript-eslint/no-empty-function */
import {
	Application,
	AuthMethod,
	DynamicRewardMethod,
	FeeMethod,
	MainchainInteroperabilityMethod,
	PoSMethod,
	RandomMethod,
	SidechainInteroperabilityMethod,
	TokenMethod,
	ValidatorsMethod,
} from 'klayr-sdk';
import { NFTModule } from './modules/nft/module';
import { DexModule } from './modules/dex/module';
import { TokenFactoryModule } from './modules/token_factory/module';

interface KlayrMethod {
	validator: ValidatorsMethod;
	auth: AuthMethod;
	token: TokenMethod;
	fee: FeeMethod;
	random: RandomMethod;
	reward: DynamicRewardMethod;
	pos: PoSMethod;
	interoperability: SidechainInteroperabilityMethod | MainchainInteroperabilityMethod;
}

export const registerModules = (app: Application, method: KlayrMethod): void => {
	const nftModule = new NFTModule();
	const tokenFactoryModule = new TokenFactoryModule();
	const dexModule = new DexModule();

	nftModule.addDependencies(method.interoperability, method.fee, method.token);
	dexModule.addDependencies(
		method.token,
		nftModule.method,
		method.fee,
		tokenFactoryModule.method,
		method.interoperability,
	);
	tokenFactoryModule.addDependencies(
		method.token,
		method.fee,
		nftModule.method,
		dexModule.method,
		method.interoperability,
	);

	// NOTE: registerModulePriority order matters here! Module with highest priority should be registered last
	app.registerModule(nftModule);
	app.registerModulePriority(tokenFactoryModule);
	app.registerModulePriority(dexModule);

	app.registerInteroperableModule(nftModule);
	app.registerInteroperableModule(tokenFactoryModule);
	app.registerInteroperableModule(dexModule);
};
