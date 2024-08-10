import { JSONObject } from 'klayr-sdk';
import { GetDelegatedVoteParams, TypedSchema, DelegatedVoteStoreData } from '../../types';

export const getDelegatedVoteEndpointResponseSchema: TypedSchema<JSONObject<DelegatedVoteStoreData>> = {
	$id: '/governance/endpoint/response/getDelegatedVote',
	type: 'object',
	required: ['outgoingDelegation', 'incomingDelegation'],
	properties: {
		outgoingDelegation: {
			dataType: 'string',
			fieldNumber: 1,
		},
		incomingDelegation: {
			type: 'array',
			fieldNumber: 2,
			items: {
				dataType: 'string',
			},
		},
	},
};

export const getDelegatedVoteEndpointRequestSchema: TypedSchema<GetDelegatedVoteParams> = {
	$id: '/governance/endpoint/request/getDelegatedVote',
	type: 'object',
	required: ['address'],
	properties: {
		address: {
			dataType: 'string',
			format: 'klayr32',
			fieldNumber: 1,
		},
	},
};
