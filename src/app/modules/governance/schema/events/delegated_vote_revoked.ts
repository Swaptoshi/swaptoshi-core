import { DelegatedVoteRevokedEventData, TypedSchema } from '../../types';

export const delegatedVoteRevokedEventSchema: TypedSchema<DelegatedVoteRevokedEventData> = {
	$id: '/governance/events/delegated_vote_revoked',
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
