import http, { IncomingMessage, ServerResponse } from 'http';
import { Server } from 'node-static';

const builtFileServer = new Server('./performance/lib');
const performanceFileServer = new Server('./performance');
const modulesFileServer = new Server('./node_modules');

http.createServer((request: IncomingMessage, response: ServerResponse) => {
	request
		.addListener('end', () => {
			//
			// Serve files!
			//
			switch (request.url) {
				case '/whynot-perf.js':
				case '/whynot-perf.js.map':
					console.log('Serving ./performance/lib' + request.url);
					builtFileServer.serve(request, response);
					break;
				case '/lodash/lodash.js':
				case '/platform/platform.js':
				case '/benchmark/benchmark.js':
					console.log('Serving ./node_modules/' + request.url);
					modulesFileServer.serve(request, response);
					break;
				default:
					console.log('Serving ./performance' + request.url);
					performanceFileServer.serve(request, response);
					break;
			}
		})
		.resume();
}).listen(8080);
console.log('Now listening on localhost:8080');
