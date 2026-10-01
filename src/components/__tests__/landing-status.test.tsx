import { renderToStaticMarkup } from 'react-dom/server'
import { LandingContent } from '../landing-content'

function renderLanding() {
  return renderToStaticMarkup(<LandingContent />)
}

function statusNotice(html: string) {
  return html.match(/<aside\b[^>]*aria-labelledby="site-status-heading"[^>]*>[\s\S]*?<\/aside>/)?.[0] ?? ''
}

describe('landing page unofficial status', () => {
  it('server-renders a prominent notice before navigation and promotional content', () => {
    const html = renderLanding()
    const notice = statusNotice(html)
    expect(notice).not.toBe('')
    expect(notice).toContain('role="note"')
    expect(notice).toContain('Unofficial prototype — under construction')
    expect(html.indexOf(notice)).toBeLessThan(html.indexOf('<nav'))
    expect(html.indexOf(notice)).toBeLessThan(html.indexOf('<h1'))
  })

  it('states lack of mosque approval and ongoing corrections without promising approval', () => {
    const notice = statusNotice(renderLanding())
    expect(notice).toContain('not yet an official website of Masjid Ar-Raudhah')
    expect(notice).toContain('has not been approved or endorsed by the mosque')
    expect(notice).toContain('correcting and verifying its content before seeking official approval')
    expect(notice).toContain('Information, benefits and payment details shown here are provisional')
    expect(notice).toContain('contact Masjid Ar-Raudhah directly')
  })

  it('does not hide the notice behind interaction, dismissal or entrance animations', () => {
    const notice = statusNotice(renderLanding())
    expect(notice).not.toBe('')
    expect(notice).not.toMatch(/<button|\bhidden\b|opacity-0|\breveal\b|aria-hidden="true"/)
  })

  it('does not contradict the notice with official ownership claims', () => {
    const html = renderLanding()
    expect(html).not.toContain('official membership programme')
    expect(html).not.toContain('Masjid Ar-Raudhah. All rights reserved.')
  })
})
