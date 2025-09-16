import { useState, useEffect } from 'react';
import { Button } from '../components/ui/index.js';
import { format } from 'date-fns';
import { ExternalLink, Loader2, FolderOpen } from 'lucide-react';
import HealthPanel from '../components/HealthPanel.jsx';
import { getReports } from '../lib/api.js';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('all'); // 'all', 'daily', 'weekly'
  const itemsPerPage = 20;

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await getReports();
        if (data?.reports && Array.isArray(data.reports)) {
          // Sort by updated time (newest first)
          const sortedReports = [...data.reports].sort((a, b) => 
            new Date(b.updatedTime || b.createdTime) - new Date(a.updatedTime || a.createdTime)
          );
          setReports(sortedReports);
        } else {
          setReports([]);
          throw new Error('Invalid response format from server');
        }
      } catch (error) {
        console.error('Error fetching reports:', error);
        setError(error.message || 'Failed to load reports');
        setReports([]); // Clear reports on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, []);

  // Get current reports for pagination
  const indexOfLastReport = currentPage * itemsPerPage;
  const indexOfFirstReport = indexOfLastReport - itemsPerPage;
  const currentReports = reports.slice(indexOfFirstReport, indexOfLastReport);
  const totalPages = Math.ceil(reports.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600">Loading reports...</p>
      </div>
    );
  }

  // Filter reports based on current filter
  const filteredReports = reports.filter(report => {
    if (filter === 'daily') return /Daily Report/i.test(report.name);
    if (filter === 'weekly') return /Weekly Report/i.test(report.name);
    return true; // 'all' filter
  });

  const reportsFolderUrl = import.meta.env.VITE_REPORTS_FOLDER_ID 
    ? `https://drive.google.com/drive/folders/${import.meta.env.VITE_REPORTS_FOLDER_ID}`
    : '#';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Reports</h1>
          {import.meta.env.VITE_REPORTS_FOLDER_ID && (
            <a 
              href={reportsFolderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              <FolderOpen className="h-4 w-4 mr-1" />
              Open Reports Folder
            </a>
          )}
        </div>
        
        <HealthPanel />
        
        <div className="flex space-x-2 mb-6">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'daily' ? 'default' : 'outline'}
            onClick={() => setFilter('daily')}
          >
            Daily
          </Button>
          <Button
            variant={filter === 'weekly' ? 'default' : 'outline'}
            onClick={() => setFilter('weekly')}
          >
            Weekly
          </Button>
        </div>
        
        {error ? (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  {error.includes('not configured') 
                    ? 'Reports feature is not properly configured.'
                    : 'No reports available yet. Check back after the first cadence run.'
                  }
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white shadow overflow-hidden sm:rounded-md mb-6">
              <ul className="divide-y divide-gray-200">
                {filteredReports.length > 0 ? (
                  filteredReports
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((report) => (
                    <li key={report.id}>
                      <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-blue-600 truncate">
                            {report.name}
                          </div>
                          <div className="ml-2 flex-shrink-0 flex">
                            <Button
                              asChild
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <a 
                                href={report.webViewLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center"
                              >
                                <span>Open</span>
                                <ExternalLink className="ml-1 h-4 w-4" />
                              </a>
                            </Button>
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              {report.mimeType}
                            </p>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <p>
                              Updated {format(new Date(report.updatedTime), 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-4 text-center text-gray-500">
                    {reports.length === 0 ? 'No reports found.' : 'No reports match the current filter.'}
                  </li>
                )}
              </ul>
            </div>

            {/* Pagination */}
            {Math.ceil(filteredReports.length / itemsPerPage) > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => paginate(currentPage < totalPages ? currentPage + 1 : totalPages)}
                    disabled={currentPage === totalPages}
                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{indexOfFirstReport + 1}</span> to{' '}
                      <span className="font-medium">
                        {indexOfLastReport > reports.length ? reports.length : indexOfLastReport}
                      </span>{' '}
                      of <span className="font-medium">{filteredReports.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                      <button
                        onClick={() => paginate(currentPage > 1 ? currentPage - 1 : 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                        </svg>
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        // Show pages around current page
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => paginate(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                              currentPage === pageNum
                                ? 'z-10 bg-blue-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                                : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => paginate(currentPage < totalPages ? currentPage + 1 : totalPages)}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
