import { JSONObject } from 'klayr-sdk';
import { GetCastedVoteParams, TypedSchema, CastedVoteStoreData } from '../../types';

export const getCastedVoteEndpointResponseSchema: TypedSchema<JSONObject<CastedVoteStoreData>> = {
	$id: '/governance/endpoint/response/getCastedVote',
	type: 'object',
	required: ['activeVote'],
	properties: {
		activeVote: {
			type: 'array',
			fieldNumber: 1,
			items: {
				type: 'object',
				required: ['proposalId', 'decision'],
				properties: {
					proposalId: {
						dataType: 'uint32',
						fieldNumber: 1,
					},
					decision: {
						dataType: 'uint32',
						fieldNumber: 2,
					},
				},
			},
		},
	},
};

export const getCastedVoteEndpointRequestSchema: TypedSchema<GetCastedVoteParams> = {
	$id: '/governance/endpoint/request/getCastedVote',
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
