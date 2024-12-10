/* eslint-disable @typescript-eslint/no-empty-function */
import { Application, Modules } from 'klayr-sdk';
import { Modules as SwaptoshiModules } from 'swaptoshi-sdk';

interface KlayrMethod {
	validator: Modules.Validators.ValidatorsMethod;
	auth: Modules.Auth.AuthMethod;
	token: Modules.Token.TokenMethod;
	fee: Modules.Fee.FeeMethod;
	random: Modules.Random.RandomMethod;
	reward: Modules.DynamicReward.DynamicRewardMethod;
	pos: Modules.PoS.PoSMethod;
	interoperability: Modules.Interoperability.SidechainInteroperabilityMethod | Modules.Interoperability.MainchainInteroperabilityMethod;
}

export const registerModules = (app: Application, method: KlayrMethod): void => {
	const nftModule = new Modules.NFT.NFTModule();
	const tokenFactoryModule = new SwaptoshiModules.TokenFactory.TokenFactoryModule();
	const dexModule = new SwaptoshiModules.DEX.DexModule();
	const feeConversionModule = new SwaptoshiModules.FeeConversion.FeeConversionModule();
	const liquidPosModule = new SwaptoshiModules.LiquidPoS.LiquidPosModule();
	const governanceModule = new SwaptoshiModules.Governance.GovernanceModule();

	nftModule.addDependencies(method.interoperability, method.fee, method.token);
	governanceModule.addDependencies({ tokenMethod: method.token, feeMethod: method.fee });
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
