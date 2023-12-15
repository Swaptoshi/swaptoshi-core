/* eslint-disable no-control-regex */
export function extractJSONFromURI(uri: string): {
	name: string;
	description: string;
	image: string;
} {
	const encodedJSON = uri.substring('data:application/json;base64,'.length);
	let decodedJSON = Buffer.from(encodedJSON, 'base64').toString('utf8');
	decodedJSON = decodedJSON
		.replace(/\\n/g, '\\n')
		.replace(/\\'/g, "\\'")
		.replace(/\\"/g, '\\"')
		.replace(/\\&/g, '\\&')
		.replace(/\\r/g, '\\r')
		.replace(/\\t/g, '\\t')
		.replace(/\\b/g, '\\b')
		.replace(/\\f/g, '\\f');
	// Remove non-printable and other non-valid JSON characters
	decodedJSON = decodedJSON.replace(/[\u0000-\u0019]+/g, '');
	return JSON.parse(decodedJSON);
}
