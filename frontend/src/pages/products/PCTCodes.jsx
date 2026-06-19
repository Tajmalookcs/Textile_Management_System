import { useState, useEffect, useCallback } from 'react'
import Layout from '../../components/Layout/Layout'
import api from '../../api/axios'

function Spinner() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-10 h-10 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
    </div>
  )
}

export default function PCTCodes() {
  const [codes, setCodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [nextPage, setNextPage] = useState(null)
  const [prevPage, setPrevPage] = useState(null)

  const fetchCodes = useCallback(async (searchVal, pageVal) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchVal.trim()) params.set('search', searchVal.trim())
      params.set('page', pageVal)
      const res = await api.get(`/pct-codes/?${params.toString()}`)
      const data = res.data
      if (data.results !== undefined) {
        setCodes(data.results)
        setTotalCount(data.count ?? data.results.length)
        setNextPage(data.next)
        setPrevPage(data.previous)
        if (data.page_size) setPageSize(data.page_size)
      } else {
        setCodes(Array.isArray(data) ? data : [])
        setTotalCount(Array.isArray(data) ? data.length : 0)
        setNextPage(null)
        setPrevPage(null)
      }
    } catch {
      setCodes([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      fetchCodes(search, 1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search, fetchCodes])

  useEffect(() => {
    fetchCodes(search, page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const totalPages = Math.ceil(totalCount / pageSize) || 1

  const handlePrev = () => {
    if (page > 1) setPage(p => p - 1)
  }

  const handleNext = () => {
    if (nextPage) setPage(p => p + 1)
  }

  return (
    <Layout>
      <div className="p-6 lg:p-8 animate-fadeIn">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">PCT Codes</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Pakistan Customs Tariff codes —{' '}
            <span className="font-semibold text-violet-600">{totalCount.toLocaleString()}</span> codes available
          </p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5">
          <div className="relative max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by PCT code or description…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 bg-gray-50 hover:bg-white transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {search && !loading && (
            <p className="text-xs text-gray-400 mt-2 pl-1">
              {codes.length === 0 ? 'No results for' : `Showing results for`}{' '}
              <span className="text-gray-600 font-medium">"{search}"</span>
            </p>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? <Spinner /> : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-xs font-bold text-gray-500 uppercase tracking-wider px-4 py-3 text-left w-40">PCT Code</th>
                      <th className="text-xs font-bold text-gray-500 uppercase tracking-wider px-4 py-3 text-left">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {codes.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="text-center py-16 text-gray-400">
                          <svg className="w-10 h-10 mx-auto mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          No PCT codes found
                        </td>
                      </tr>
                    ) : codes.map((c, i) => (
                      <tr key={c.id ?? c.pct_code ?? i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-mono text-violet-700 bg-violet-50 px-2 py-0.5 rounded text-xs border border-violet-100 whitespace-nowrap">
                            {c.pct_code}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{c.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
                <p className="text-xs text-gray-400">
                  Page <span className="font-semibold text-gray-600">{page}</span> of{' '}
                  <span className="font-semibold text-gray-600">{totalPages}</span>
                  {totalCount > 0 && (
                    <span className="ml-2 text-gray-300">·</span>
                  )}
                  {totalCount > 0 && (
                    <span className="ml-2">{totalCount.toLocaleString()} total codes</span>
                  )}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrev}
                    disabled={!prevPage && page <= 1}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-white hover:border-violet-300 hover:text-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Prev
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={!nextPage}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 border border-gray-200 hover:bg-white hover:border-violet-300 hover:text-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  )
}
