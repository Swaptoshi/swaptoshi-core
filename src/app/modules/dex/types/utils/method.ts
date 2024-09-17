import { Modules } from 'klayr-sdk';

export type ValidatorsMethod = Modules.Validators.ValidatorsMethod;
export type AuthMethod = Modules.Auth.AuthMethod;
export type TokenMethod = Modules.Token.TokenMethod;
export type FeeMethod = Modules.Fee.FeeMethod;
export type RandomMethod = Modules.Random.RandomMethod;
export type DynamicRewardMethod = Modules.DynamicReward.DynamicRewardMethod;
export type PoSMethod = Modules.PoS.PoSMethod;
export type SidechainInteroperabilityMethod = Modules.Interoperability.SidechainInteroperabilityMethod;
export type MainchainInteroperabilityMethod = Modules.Interoperability.MainchainInteroperabilityMethod;
export type NFTMethod = Modules.NFT.NFTMethod;

export interface KlayrMethod {
	validator: Modules.Validators.ValidatorsMethod;
	auth: Modules.Auth.AuthMethod;
	token: Modules.Token.TokenMethod;
	fee: Modules.Fee.FeeMethod;
	random: Modules.Random.RandomMethod;
	reward: Modules.DynamicReward.DynamicRewardMethod;
	pos: Modules.PoS.PoSMethod;
	interoperability: Modules.Interoperability.SidechainInteroperabilityMethod | Modules.Interoperability.MainchainInteroperabilityMethod;
}
