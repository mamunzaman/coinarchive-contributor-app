import { describe, expect, it } from 'vitest'
import { ApiError } from './api'
import { formatAdminSubmissionsLoadError } from './adminApi'
import {
  AdminSubmissionsResponseError,
  normalizeAdminSubmissionListItem,
  normalizeAdminSubmissionsResponse,
} from './adminSubmissionsNormalize'
import { formatApiErrorMessage, isNetworkError } from './apiErrors'
import {
  filterAdminQueueSubmissions,
  sortAdminQueueSubmissions,
} from './adminQueueFilters'

describe('normalizeAdminSubmissionsResponse', () => {
  it('keeps multiple valid submissions from a 200-shaped payload', () => {
    const result = normalizeAdminSubmissionsResponse({
      success: true,
      total: 2,
      submissions: [
        {
          id: 10,
          title: 'Germany 2 Euro 2024',
          status: 'pending',
          date: '2024-01-01 10:00:00',
          contributor_name: 'Ada',
        },
        {
          id: 11,
          title: 'France 2 Euro 2023',
          status: 'publish',
          date: '2023-06-01 12:00:00',
        },
      ],
    })

    expect(result.response.success).toBe(true)
    expect(result.response.total).toBe(2)
    expect(result.response.submissions).toHaveLength(2)
    expect(result.skippedCount).toBe(0)
    expect(result.response.submissions[0]?.title).toBe('Germany 2 Euro 2024')
  })

  it('supports null and missing optional fields', () => {
    const item = normalizeAdminSubmissionListItem({
      id: 42,
      title: null,
      status: null,
      date: null,
      modified_date: undefined,
      contributor_name: null,
      contributor_email: null,
      country: null,
      year: null,
      denomination: null,
    })

    expect(item).not.toBeNull()
    expect(item?.id).toBe(42)
    expect(item?.title).toBe('')
    expect(item?.status).toBe('unknown')
    expect(item?.date).toBe('')
  })

  it('supports legacy nested contributor shapes', () => {
    const item = normalizeAdminSubmissionListItem({
      id: '77',
      title: 'Legacy coin',
      post_status: 'pending',
      date: '2022-01-01',
      contributor: {
        id: 9,
        display_name: 'Legacy User',
        email: 'legacy@example.com',
      },
    })

    expect(item?.id).toBe(77)
    expect(item?.status).toBe('pending')
    expect(item?.contributor_id).toBe(9)
    expect(item?.contributor_name).toBe('Legacy User')
    expect(item?.contributor_email).toBe('legacy@example.com')
  })

  it('skips one malformed record and keeps valid siblings', () => {
    const result = normalizeAdminSubmissionsResponse({
      success: true,
      total: 3,
      submissions: [
        { id: 1, title: 'Valid A', status: 'pending', date: '2024-01-01' },
        null,
        { title: 'Missing id', status: 'pending' },
        { id: 2, title: 'Valid B', status: 'pending', date: '2024-01-02' },
        'not-an-object',
      ],
    })

    expect(result.response.submissions.map((item) => item.id)).toEqual([1, 2])
    expect(result.skippedCount).toBe(3)
  })

  it('handles empty submissions list', () => {
    const result = normalizeAdminSubmissionsResponse({
      success: true,
      total: 0,
      submissions: [],
    })

    expect(result.response.submissions).toEqual([])
    expect(result.response.total).toBe(0)
    expect(result.skippedCount).toBe(0)
  })

  it('throws for invalid response envelopes', () => {
    expect(() => normalizeAdminSubmissionsResponse(null)).toThrow(AdminSubmissionsResponseError)
    expect(() =>
      normalizeAdminSubmissionsResponse({ success: true, submissions: { broken: true } }),
    ).toThrow(AdminSubmissionsResponseError)
  })
})

describe('admin queue filtering with sparse records', () => {
  it('filters and sorts normalized sparse submissions without throwing', () => {
    const { response } = normalizeAdminSubmissionsResponse({
      success: true,
      submissions: [
        { id: 1, title: null, status: 'pending', date: null, country: null },
        { id: 2, title: 'Belgium 2 Euro', status: 'pending', date: '2024-05-01', country: 'Belgium' },
      ],
    })

    const filtered = filterAdminQueueSubmissions(response.submissions, {
      statusFilter: 'pending',
      reviewFilter: 'all',
      languageFilter: 'all',
      duplicateFilter: 'all',
      countryFilter: '',
      query: 'belgium',
    })

    expect(filtered).toHaveLength(1)
    expect(filtered[0]?.id).toBe(2)

    expect(() => sortAdminQueueSubmissions(response.submissions, 'title-az')).not.toThrow()
    expect(() => sortAdminQueueSubmissions(response.submissions, 'contributor-az')).not.toThrow()
  })
})

describe('admin submissions error mapping', () => {
  it('maps real network failures to the connection message', () => {
    const networkError = new TypeError('Failed to fetch')
    expect(isNetworkError(networkError)).toBe(true)
    expect(formatApiErrorMessage(networkError)).toBe(
      'Cannot reach the server. Check your connection and try again.',
    )
    expect(formatAdminSubmissionsLoadError(networkError)).toBe(
      'Cannot reach the server. Check your connection and try again.',
    )
  })

  it('does not treat frontend TypeErrors as network failures', () => {
    const processingError = new TypeError("Cannot read properties of null (reading 'trim')")
    expect(isNetworkError(processingError)).toBe(false)
    expect(formatAdminSubmissionsLoadError(processingError)).toBe(
      'Admin submissions could not be processed. Refresh and try again.',
    )
    expect(formatAdminSubmissionsLoadError(processingError)).not.toContain('Cannot reach the server')
  })

  it('distinguishes auth, invalid response, and api failures', () => {
    expect(formatAdminSubmissionsLoadError(new ApiError('Forbidden', 403))).toContain(
      'session expired or you are not authorized',
    )
    expect(
      formatAdminSubmissionsLoadError(
        new AdminSubmissionsResponseError('Admin submissions returned an invalid response shape.'),
      ),
    ).toBe('Admin submissions returned an invalid response shape.')
  })
})
