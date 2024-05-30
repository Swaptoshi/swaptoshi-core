/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { EventQueuer, codec } from 'klayr-sdk';

export const getEvents = (
	eventQueue: EventQueuer['eventQueue'],
	EventClass: any,
	moduleName: string,
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

	return eventDataList;
};

export const eventResultContain = (
	eventQueue: EventQueuer['eventQueue'],
	EventClass: any,
	moduleName: string,
	expectedResult: any,
) => {
	expect(getEvents(eventQueue, EventClass, moduleName)).toContainEqual(expectedResult);

	return true;
};

export const eventResultHaveLength = (
	eventQueue: EventQueuer['eventQueue'],
	EventClass: any,
	moduleName: string,
	length: number,
) => {
	expect(getEvents(eventQueue, EventClass, moduleName)).toHaveLength(length);

	return true;
};

export const eventResultHaveMinimumLength = (
	eventQueue: EventQueuer['eventQueue'],
	EventClass: any,
	moduleName: string,
	length: number,
) => {
	expect(getEvents(eventQueue, EventClass, moduleName).length).toBeGreaterThanOrEqual(length);

	return true;
};
