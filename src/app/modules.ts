/* eslint-disable @typescript-eslint/no-empty-function */
import {
	Application,
	AuthMethod,
	DynamicRewardMethod,
	FeeMethod,
	MainchainInteroperabilityMethod,
	NFTModule,
	PoSMethod,
	RandomMethod,
	SidechainInteroperabilityMethod,
	TokenMethod,
	ValidatorsMethod,
} from 'lisk-sdk';
import { DexModule } from './modules/dex/module';
import { TokenFactoryModule } from './modules/token_factory/module';

interface LiskMethod {
	validator: ValidatorsMethod;
	auth: AuthMethod;
	token: TokenMethod;
	fee: FeeMethod;
	random: RandomMethod;
	reward: DynamicRewardMethod;
	pos: PoSMethod;
	interoperability: SidechainInteroperabilityMethod | MainchainInteroperabilityMethod;
}

export const registerModules = (app: Application, method: LiskMethod): void => {
	const dexModule = new DexModule();
	const nftModule = new NFTModule();
	const tokenFactoryModule = new TokenFactoryModule();

	nftModule.addDependencies(method.interoperability, method.fee, method.token);
	dexModule.addDependencies(method.token, nftModule.method, method.fee, method.interoperability);
	tokenFactoryModule.addDependencies(method.token, method.fee);

	app.registerModule(nftModule);
	app.registerModulePriority(dexModule);
	app.registerModule(tokenFactoryModule);

	app.registerInteroperableModule(nftModule);
	app.registerInteroperableModule(dexModule);
};
