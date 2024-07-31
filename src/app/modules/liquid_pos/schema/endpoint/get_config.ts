import { configSchema } from '../config';

export const getConfigEndpointResponseSchema = configSchema;

export const getConfigEndpointRequestSchema = {
	$id: '/liquid_pos/endpoint/request/get_config',
	type: 'object',
	required: [],
	properties: {},
};
