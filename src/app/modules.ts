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
import { DexModule } from './modules/dex/module';
import { FeeConversionModule } from './modules/fee_conversion';
import { LiquidPosModule } from './modules/liquid_pos/module';
import { NFTModule } from './modules/nft/module';
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
	const feeConversionModule = new FeeConversionModule();
	const liquidPosModule = new LiquidPosModule();

	liquidPosModule.addDependencies(method.token);
	feeConversionModule.addDependencies(method.token, method.fee, dexModule.method);
	nftModule.addDependencies(method.interoperability, method.fee, method.token);
	dexModule.addDependencies(method.token, nftModule.method, method.fee, method.interoperability, feeConversionModule.method);
	tokenFactoryModule.addDependencies(method.token, method.fee, nftModule.method, dexModule.method, method.interoperability, feeConversionModule.method);

	app.registerModulePriority(feeConversionModule);

	app.registerModule(nftModule);
	app.registerModule(tokenFactoryModule);
	app.registerModule(dexModule);
	app.registerModule(liquidPosModule);

	app.registerInteroperableModule(nftModule);
	app.registerInteroperableModule(tokenFactoryModule);
	app.registerInteroperableModule(dexModule);
};
