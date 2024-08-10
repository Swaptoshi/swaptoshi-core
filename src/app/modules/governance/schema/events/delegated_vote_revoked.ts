import { DelegatedVoteRevokedEventData, TypedSchema } from '../../types';

export const delegatedVoteRevokedEventSchema: TypedSchema<DelegatedVoteRevokedEventData> = {
	$id: '/governance/events/delegated_vote_revoked',
	type: 'object',
	required: ['delegateeAddress', 'delegatorAddress'],
	properties: {
		delegateeAddress: {
			dataType: 'bytes',
			format: 'klayr32',
			fieldNumber: 1,
		},
		delegatorAddress: {
			dataType: 'bytes',
			format: 'klayr32',
			fieldNumber: 2,
		},
	},
};
