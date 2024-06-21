/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */

export function serializer<T extends Record<any, any>>(data: T): T {
	if (data === undefined) return data;
	return JSON.parse(
		JSON.stringify(data, (_, value) => {
			if (Array.isArray(value)) {
				return value.map(item => replacer(item));
			}
			return replacer(value);
		}),
	);
}

function replacer(value: any) {
	if (typeof value === 'bigint') {
		return value.toString();
	}
	if (value.type === 'Buffer') {
		return Buffer.from(value).toString('hex');
	}
	return value;
}
