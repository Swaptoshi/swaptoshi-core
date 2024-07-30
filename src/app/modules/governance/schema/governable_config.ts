export const governableConfigSchema = {
	$id: '/governance/governable_config',
	type: 'object',
	required: ['data'],
	properties: {
		data: {
			dataType: 'bytes',
			fieldNumber: 1,
		},
	},
};
