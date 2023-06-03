/** @type {import('jest-environment-puppeteer').JestPuppeteerConfig} */
module.exports = {
	launch: {
		dumpio: true,
		headless: "new",
		args: [
			'--disable-gpu',
			'--use-fake-ui-for-media-stream',
			'--use-fake-device-for-media-stream',
			'--allow-file-access-from-files',
		],
	},
};
