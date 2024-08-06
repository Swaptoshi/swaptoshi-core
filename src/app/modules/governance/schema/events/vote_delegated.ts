import { VoteDelegatedEventData, TypedSchema } from '../../types';

export const voteDelegatedEventSchema: TypedSchema<VoteDelegatedEventData> = {
	$id: '/governance/events/vote_delegated',
	type: 'object',
	required: ['delegateeAddress', 'delegatorAddress'],
	properties: {
		delegateeAddress: {
			dataType: 'bytes',
			fieldNumber: 1,
		},
		delegatorAddress: {
			dataType: 'bytes',
			fieldNumber: 2,
		},
	},
};
