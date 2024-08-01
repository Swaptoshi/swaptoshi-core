import { TokenMethod, FeeMethod, SidechainInteroperabilityMethod, MainchainInteroperabilityMethod } from 'klayr-sdk';
import { DexMethod } from '../../../dex/method';
import { FeeConversionMethod } from '../../../fee_conversion';
import { NFTMethod } from '../../../nft';
import { GovernanceMethod } from '../../../governance';

export interface TokenFactoryModuleDependencies {
	tokenMethod: TokenMethod;
	feeMethod: FeeMethod;
	nftMethod: NFTMethod;
	interoperabilityMethod: SidechainInteroperabilityMethod | MainchainInteroperabilityMethod;
	dexMethod?: DexMethod;
	feeConversionMethod?: FeeConversionMethod;
	governanceMethod?: GovernanceMethod;
}
