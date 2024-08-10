import { JSONObject } from 'klayr-sdk';
import { TypedSchema, ProposalQueueStoreData, GetProposalQueueParams } from '../../types';

export const getProposalQueueEndpointResponseSchema: TypedSchema<JSONObject<ProposalQueueStoreData>> = {
	$id: '/governance/endpoint/response/getProposalQueue',
	type: 'object',
	required: ['start', 'quorum', 'ends', 'execute'],
	properties: {
		start: {
			type: 'array',
			fieldNumber: 1,
			items: {
				dataType: 'uint32',
			},
		},
		quorum: {
			type: 'array',
			fieldNumber: 2,
			items: {
				dataType: 'uint32',
			},
		},
		ends: {
			type: 'array',
			fieldNumber: 3,
			items: {
				dataType: 'uint32',
			},
		},
		execute: {
			type: 'array',
			fieldNumber: 4,
			items: {
				dataType: 'uint32',
			},
		},
	},
};

export const getProposalQueueEndpointRequestSchema: TypedSchema<GetProposalQueueParams> = {
	$id: '/governance/endpoint/request/getProposalQueue',
	type: 'object',
	required: ['height'],
	properties: {
		height: {
			dataType: 'uint32',
			fieldNumber: 1,
		},
	},
};
