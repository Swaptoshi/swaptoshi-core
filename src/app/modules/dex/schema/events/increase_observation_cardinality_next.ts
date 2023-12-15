export const increaseObservationCardinalityNextEventSchema = {
	$id: '/dex/events/increase_observation_cardinality_next',
	type: 'object',
	required: ['observationCardinalityNextOld', 'observationCardinalityNextNew'],
	properties: {
		observationCardinalityNextOld: {
			dataType: 'string',
			fieldNumber: 1,
		},
		observationCardinalityNextNew: {
			dataType: 'string',
			fieldNumber: 2,
		},
	},
};
