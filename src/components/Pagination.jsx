import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  itemsPerPage,
  totalItems,
  onItemsPerPageChange 
}) {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      // Show all pages if total pages is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages with ellipsis
      if (currentPage <= 3) {
        // Near the start
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
        pages.push(1);
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const startItem = totalItems && itemsPerPage ? ((currentPage - 1) * itemsPerPage + 1) : 0;
  const endItem = totalItems && itemsPerPage ? Math.min(currentPage * itemsPerPage, totalItems) : 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
      <div className="flex flex-col gap-3 sm:gap-4">
        {/* Info - hanya tampil jika totalItems dan itemsPerPage ada */}
        {totalItems && itemsPerPage && (
          <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
            Menampilkan <span className="font-medium">{startItem}</span> sampai{' '}
            <span className="font-medium">{endItem}</span> dari{' '}
            <span className="font-medium">{totalItems}</span> data
          </div>
        )}

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-2">
          {/* Items per page selector */}
          {onItemsPerPageChange && (
            <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start">
              <label className="text-xs sm:text-sm text-gray-700 whitespace-nowrap">Per halaman:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-2 py-1.5 text-xs sm:text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-base"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto justify-center sm:justify-end">

            {/* Previous button */}
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-1.5 sm:p-2 rounded-md border transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                  : 'bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 border-gray-300'
              }`}
            >
              <ChevronLeftIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Page numbers */}
            <div className="flex gap-1 flex-wrap justify-center">
              {getPageNumbers().map((page, index) => {
                if (page === 'ellipsis') {
                  return (
                    <span key={`ellipsis-${index}`} className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-500">
                      ...
                    </span>
                  );
                }
                return (
                  <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium min-h-[36px] min-w-[36px] transition-colors ${
                      currentPage === page
                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                        : 'bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 border border-gray-300'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            {/* Next button */}
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-1.5 sm:p-2 rounded-md border transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center ${
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                  : 'bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 border-gray-300'
              }`}
            >
              <ChevronRightIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

