import * as vanguard from '../index'

declare global {
	// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
	interface Window {
		vanguard: typeof vanguard;
	}
}

window.vanguard = vanguard
