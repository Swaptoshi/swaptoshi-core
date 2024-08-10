import { JSONObject } from 'klayr-sdk';
import { NextAvailableProposalIdStoreData, TypedSchema } from '../../types';

export const getNextAvailableProposalIdEndpointResponseSchema: TypedSchema<JSONObject<NextAvailableProposalIdStoreData>> = {
	$id: '/governance/endpoint/response/getNextAvailableProposalId',
	type: 'object',
	required: ['nextProposalId'],
	properties: {
		nextProposalId: {
			dataType: 'uint32',
			fieldNumber: 1,
		},
	},
};

export const getNextAvailableProposalIdEndpointRequestSchema = {
	$id: '/governance/endpoint/request/getNextAvailableProposalId',
	type: 'object',
	required: [],
	properties: {},
};
