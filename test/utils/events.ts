/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { EventQueuer, codec } from 'lisk-sdk';

export const eventResultContain = (
	eventQueue: EventQueuer['eventQueue'],
	EventClass: any,
	moduleName: string,
	expectedResult: any,
) => {
	const eventName = new EventClass(moduleName).name;

	const eventDataList = eventQueue
		.getEvents()
		.filter(t => t.toObject().name === eventName)
		.map(t => {
			const eventData = codec.decode<Record<string, unknown>>(
				new EventClass(moduleName).schema,
				t.toObject().data,
			);
			return eventData;
		});

	expect(eventDataList).toContainEqual(expectedResult);

	return true;
};

export const eventResultHaveLength = (
	eventQueue: EventQueuer['eventQueue'],
	EventClass: any,
	moduleName: string,
	length: number,
) => {
	const eventName = new EventClass(moduleName).name;

	const eventLength = eventQueue.getEvents().filter(t => t.toObject().name === eventName).length;

	expect(eventLength).toBe(length);

	return true;
};

export const eventResultHaveMinimumLength = (
	eventQueue: EventQueuer['eventQueue'],
	EventClass: any,
	moduleName: string,
	length: number,
) => {
	const eventName = new EventClass(moduleName).name;

	const eventLength = eventQueue.getEvents().filter(t => t.toObject().name === eventName).length;

	expect(eventLength).toBeGreaterThanOrEqual(length);

	return true;
};
