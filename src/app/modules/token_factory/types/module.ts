import { Modules } from 'klayr-sdk';
import { DexMethod } from '../../dex/method';
import { FeeConversionMethod } from '../../fee_conversion';
import { GovernanceMethod } from '../../governance';

export type TokenMethod = Modules.Token.TokenMethod;
export type FeeMethod = Modules.Fee.FeeMethod;
export type NFTMethod = Modules.NFT.NFTMethod;
export type SidechainInteroperabilityMethod = Modules.Interoperability.SidechainInteroperabilityMethod;
export type MainchainInteroperabilityMethod = Modules.Interoperability.MainchainInteroperabilityMethod;

export interface TokenFactoryModuleDependencies {
	tokenMethod: TokenMethod;
	feeMethod: FeeMethod;
	nftMethod: NFTMethod;
	interoperabilityMethod: SidechainInteroperabilityMethod | MainchainInteroperabilityMethod;
	dexMethod?: DexMethod;
	feeConversionMethod?: FeeConversionMethod;
	governanceMethod?: GovernanceMethod;
}
