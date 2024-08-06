import { NextAvailableProposalIdStoreData, TypedSchema } from '../../types';

export const nextAvailableProposalIdStoreSchema: TypedSchema<NextAvailableProposalIdStoreData> = {
	$id: '/governance/store/next_available_proposal_id',
	type: 'object',
	required: ['nextProposalId'],
	properties: {
		nextProposalId: {
			dataType: 'uint32',
			fieldNumber: 1,
		},
	},
};
