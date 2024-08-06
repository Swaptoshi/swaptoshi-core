import { BoostedAccountStoreData, TypedSchema } from '../../types';

export const boostedAccountStoreSchema: TypedSchema<BoostedAccountStoreData> = {
	$id: '/governance/store/boosted_account',
	type: 'object',
	required: ['targetHeight'],
	properties: {
		targetHeight: {
			dataType: 'uint32',
			fieldNumber: 1,
		},
	},
};
