import { JSONObject } from 'klayr-sdk';
import { GetBoostedAccountParams, TypedSchema, BoostedAccountStoreData } from '../../types';

export const getBoostedAccountEndpointResponseSchema: TypedSchema<JSONObject<BoostedAccountStoreData>> = {
	$id: '/governance/endpoint/response/getBoostedAccount',
	type: 'object',
	required: ['targetHeight'],
	properties: {
		targetHeight: {
			dataType: 'uint32',
			fieldNumber: 1,
		},
	},
};

export const getBoostedAccountEndpointRequestSchema: TypedSchema<GetBoostedAccountParams> = {
	$id: '/governance/endpoint/request/getBoostedAccount',
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
