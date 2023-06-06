/** @type {import('xo').Options} */
module.exports = {
	semicolon: false,
	rules: {
		'import/extensions': 'off',
		'no-await-in-loop': 'off',
		'n/file-extension-in-import': 'off',
		'unicorn/prefer-node-protocol': 'off',
		'@typescript-eslint/object-curly-spacing': [
			'warn',
			'always'
		],
		'@typescript-eslint/naming-convention': [
			'error',
			{
				selector: ['variable'],
				format: ['snake_case', 'PascalCase'],
				leadingUnderscore: 'forbid',
				trailingUnderscore: 'forbid'
			}
		]
	},
	ignores: [
		'/jest-puppeteer.config.cjs',
		'/jest.config.js',
	]
};
