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
import { GovernanceModule } from './modules/governance/module';
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
	const governanceModule = new GovernanceModule();

	nftModule.addDependencies(method.interoperability, method.fee, method.token);
	governanceModule.addDependencies(method.token);
	liquidPosModule.addDependencies({ tokenMethod: method.token, governanceMethod: governanceModule.method });
	feeConversionModule.addDependencies({ tokenMethod: method.token, feeMethod: method.fee, dexMethod: dexModule.method, governanceMethod: governanceModule.method });
	dexModule.addDependencies({
		tokenMethod: method.token,
		nftMethod: nftModule.method,
		feeMethod: method.fee,
		interoperabilityMethod: method.interoperability,
		feeConversionMethod: feeConversionModule.method,
		governanceMethod: governanceModule.method,
	});
	tokenFactoryModule.addDependencies({
		tokenMethod: method.token,
		feeMethod: method.fee,
		nftMethod: nftModule.method,
		interoperabilityMethod: method.interoperability,
		dexMethod: dexModule.method,
		feeConversionMethod: feeConversionModule.method,
		governanceMethod: governanceModule.method,
	});

	// governance module needs to executed before dynamicReward module for treasury blockRewardTax
	app.registerModulePriority(governanceModule);

	// feeConversion module needs to be executed before fee module for altering fee verification, and before all modules that implements fc_method
	app.registerModulePriority(feeConversionModule);

	app.registerModule(nftModule);
	app.registerModule(tokenFactoryModule);
	app.registerModule(dexModule);
	app.registerModule(liquidPosModule);

	// above registration order will result in following module array:
	// [feeConversion, governance, ...klayrModules, nftModule, tokenFactoryModule, dexModule, liquidPosModule]
	// the later the registerModulePriority, the higher the priority (unshift)

	app.registerInteroperableModule(nftModule);
	app.registerInteroperableModule(tokenFactoryModule);
	app.registerInteroperableModule(dexModule);
};
