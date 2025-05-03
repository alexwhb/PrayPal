import { useCallback } from 'react'
import { useSearchParams } from 'react-router'

/**
 * Hook for generating board navigation URLs
 * Used for pagination, filtering, and sorting across different board views
 */
export function useBoardNavigation() {
  const [searchParams] = useSearchParams()

  // Helper to generate URLs with updated search params
  const generateUrl = useCallback(
    (newParams: Record<string, string | number>) => {
      const params = new URLSearchParams(searchParams)
      Object.entries(newParams).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
          params.delete(key)
        } else {
          params.set(key, String(value))
        }
      })
      return `?${params.toString()}`
    },
    [searchParams],
  )

  // Generate URLs for different actions
  const getSortUrl = useCallback(() => {
    // Toggle sort direction
    const currentSort = searchParams.get('sort') === 'asc' ? 'asc' : 'desc'
    const newSort = currentSort === 'asc' ? 'desc' : 'asc'
    return generateUrl({ sort: newSort, page: 1 })
  }, [generateUrl, searchParams])

  const getFilterUrl = useCallback(
    (newFilter: string) => {
      return generateUrl({ filter: newFilter, page: 1 })
    },
    [generateUrl],
  )

  const getNextPageUrl = useCallback(() => {
    const currentPage = parseInt(searchParams.get('page') || '1', 10)
    return generateUrl({ page: currentPage + 1 })
  }, [generateUrl, searchParams])

  return {
    getSortUrl,
    getFilterUrl,
    getNextPageUrl
  }
}