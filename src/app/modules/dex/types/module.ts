/* eslint-disable import/no-cycle */
import { FeeConversionMethod } from '../../fee_conversion';
import { GovernanceMethod } from '../../governance';
import { SidechainInteroperabilityMethod, MainchainInteroperabilityMethod, FeeMethod, TokenMethod, NFTMethod } from './utils';

export interface DexModuleDependencies {
	tokenMethod: TokenMethod;
	nftMethod: NFTMethod;
	feeMethod: FeeMethod;
	interoperabilityMethod: SidechainInteroperabilityMethod | MainchainInteroperabilityMethod;
	feeConversionMethod?: FeeConversionMethod;
	governanceMethod?: GovernanceMethod;
}
