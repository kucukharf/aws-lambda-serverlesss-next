const fs = require('fs');
const next = require('next');
const path = require('path');
const app = next({ dev: false });

const buildRequest = (event) => ({
	headers: event.headers,
	method: event.requestContext.httpMethod,
});

const buildResponse = (req, resolve) => {
	const res = {
		headers: {},
		statusCode: 200,
	};

	res.end = (html) => {
		resolve({
			body: html,
			headers: res.headers,
			statusCode: res.statusCode,
		});
	};
	res.setHeader = (key, value) => {
		res.headers[key] = value;
	};
	res.getHeader = (key) => req.headers[key] || '';

	return res;
};

const getType = (filePath) => {
	switch (filePath.split('.').pop()) {
		case 'js':
			return 'text/javascript';
		case 'css':
			return 'text/css';
		default:
			return '';
	}
};

const handleStaticAssets = (event) => {
	try {
		const filePath = path.join(__dirname, event.path.replace('_next', '.next'));
		const body = fs.readFileSync(filePath).toString();
		const type = getType(filePath);

		return {
			body,
			headers: {
				'Content-Type': type,
			},
			statusCode: 200,
		};
	} catch (error) {
		console.log(error);
	}

	return { statusCode: 500 };
};

const handleRoute = (event) =>
	new Promise((resolve, reject) => {
		const req = buildRequest(event);
		const res = buildResponse(req, resolve);

		try {
			if (event.path === '/') {
				app.render(req, res, '/index');
			} else {
				app.render(req, res, event.path);
			}
		} catch (error) {
			reject(error);
		}
	});

exports.handler = async (event) =>
	event.path.indexOf('_next') > -1 ? handleStaticAssets(event) : await handleRoute(event);
