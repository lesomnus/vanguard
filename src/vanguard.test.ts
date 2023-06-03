import type { Peer } from './peer'
import { PageUrl } from './.test'

describe('Vanguard', () => {
	test('offer-answer', async () => {
		page.on('console', consoleObject => {
			console.log(consoleObject.text())
		})
		await page.goto(PageUrl, { waitUntil: 'load' })
		await page.evaluate(async () => {
			const vg = window.vanguard

			const [c1, c2] = vg.duplex()
			const pc1 = new RTCPeerConnection()
			const pc2 = new RTCPeerConnection()

			// Initial connection using intra signalling channel.
			const [peer1, peer2] = await Promise.all([
				vg.offer(pc1, c1),
				vg.answer(pc2, c2),
			])

			const pc3 = new RTCPeerConnection()
			const pc4 = new RTCPeerConnection()

			// Sub connection using Vanguard channel.
			const answer = new Promise<Peer>(resolve => {
				peer2.once('offer', c => {
					resolve(vg.answer(pc4, c))
				})
			})
			const offer = peer1.offer(pc3)

			await Promise.all([offer, answer])
		})
	})
})
