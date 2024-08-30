import { TypedSchema, VoteChangedEventData } from '../../types';

export const voteChangedEventSchema: TypedSchema<VoteChangedEventData> = {
	$id: '/governance/events/vote_changed',
	type: 'object',
	required: ['proposalId', 'voterAddress', 'oldDecision', 'newDecision'],
	properties: {
		proposalId: {
			dataType: 'uint32',
			fieldNumber: 1,
		},
		voterAddress: {
			dataType: 'bytes',
			format: 'klayr32',
			fieldNumber: 2,
		},
		oldDecision: {
			dataType: 'uint32',
			fieldNumber: 3,
		},
		newDecision: {
			dataType: 'uint32',
			fieldNumber: 4,
		},
	},
};
