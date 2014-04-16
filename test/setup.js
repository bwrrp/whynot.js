// Require.js config
require.config({
	"baseUrl": "/test",

	"paths": {
		"regexParser": "util/regexParser"
	},

	"packages": [
		{
			"name": "whynot",
			"location": "../src"
		}
	],

	"shim": {
		"regexParser": {
			"exports": "regexParser"
		}
	}
});
