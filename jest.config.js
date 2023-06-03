const ts = require('ts-jest/presets/default/jest-preset')
const pp = require('jest-puppeteer/jest-preset')

/** @type {import('jest').Config} */
module.exports = Object.assign(ts, pp, {
	testPathIgnorePatterns: [
		'src/.test.ts'
	]
})
