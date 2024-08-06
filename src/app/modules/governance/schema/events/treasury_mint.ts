import { TreasuryMintEventData, TypedSchema } from '../../types';

export const treasuryMintEventSchema: TypedSchema<TreasuryMintEventData> = {
	$id: '/governance/events/treasury_mint',
	type: 'object',
	required: ['amount'],
	properties: {
		amount: {
			dataType: 'uint64',
			fieldNumber: 1,
		},
	},
};
