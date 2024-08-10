import { VoteBoostedEventData, TypedSchema } from '../../types';

export const voteBoostedEventSchema: TypedSchema<VoteBoostedEventData> = {
	$id: '/governance/events/vote_boosted',
	type: 'object',
	required: ['address', 'targetHeight'],
	properties: {
		address: {
			dataType: 'bytes',
			format: 'klayr32',
			fieldNumber: 1,
		},
		targetHeight: {
			dataType: 'uint32',
			fieldNumber: 2,
		},
	},
};
