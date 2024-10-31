import { useState } from 'react';
import { ChevronFirst, ChevronLast, ChevronLeft, ChevronRight } from 'lucide-react';

export default function TroveLifecycle({ events }) {
    const [currentPage, setCurrentPage] = useState(1);
    const eventsPerPage = 10;
    const totalPages = Math.ceil(events.length / eventsPerPage);
    
    // Get current page's events
    const indexOfLastEvent = currentPage * eventsPerPage;
    const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
    const currentEvents = events.slice(indexOfFirstEvent, indexOfLastEvent);

    const goToFirstPage = () => setCurrentPage(1);
    const goToLastPage = () => setCurrentPage(totalPages);
    const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
    const goToPrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

    const formatDate = (timestamp) => {
        const date = new Date(timestamp * 1000);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[date.getUTCMonth()];
        const day = date.getUTCDate().toString().padStart(2, '0');
        const year = date.getUTCFullYear();
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        const seconds = date.getUTCSeconds().toString().padStart(2, '0');

        return `${month}-${day}-${year} ${hours}:${minutes}:${seconds} UTC`;
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-6">
                <h2 className="text-2xl font-bold text-white">Trove Lifecycle</h2>
                
                {/* Only show pagination if we have events */}
                {events.length > eventsPerPage && (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={goToFirstPage}
                            disabled={currentPage === 1}
                            className="p-1.5 bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 text-white"
                            aria-label="First page"
                        >
                            <ChevronFirst size={16} />
                        </button>
                        <button
                            onClick={goToPrevPage}
                            disabled={currentPage === 1}
                            className="p-1.5 bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 text-white"
                            aria-label="Previous page"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="px-3 py-1 bg-gray-700/50 rounded min-w-[90px] text-center text-white text-sm">
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            onClick={goToNextPage}
                            disabled={currentPage === totalPages}
                            className="p-1.5 bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 text-white"
                            aria-label="Next page"
                        >
                            <ChevronRight size={16} />
                        </button>
                        <button
                            onClick={goToLastPage}
                            disabled={currentPage === totalPages}
                            className="p-1.5 bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 text-white"
                            aria-label="Last page"
                        >
                            <ChevronLast size={16} />
                        </button>
                    </div>
                )}
            </div>

            {events.length === 0 ? (
                <p className="text-gray-300">No trove events found</p>
            ) : (
                <>
                    {events.length > eventsPerPage && (
                        <div className="text-sm text-gray-400 mb-4">
                            Showing {indexOfFirstEvent + 1}-{Math.min(indexOfLastEvent, events.length)} of {events.length} events
                        </div>
                    )}
                    
                    <div className="space-y-4">
                        {currentEvents.map((event, index) => {
                            return (
                                <div key={index} className="border-l-4 border-blue-500 pl-4">
                                    <div className="font-semibold text-white">
                                        {event.operation === 0 ? 'Trove Opened' : 'Trove Adjusted'} ({formatDate(event.timestamp)})
                                    </div>
                                    <div className="text-sm text-gray-300">
                                        Tx: <a 
                                            href={`https://cronoscan.com/tx/${event.txHash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-400 hover:text-blue-300 hover:underline"
                                        >
                                            {event.txHash}
                                        </a>
                                    </div>
                                    <div className="text-gray-200">Collateral: {parseFloat(event.collateral).toFixed(4)} CDCETH</div>
                                    <div className="text-gray-200">Debt: {parseFloat(event.debt).toFixed(4)} USC</div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Bottom pagination for easier access after scrolling */}
                    {events.length > eventsPerPage && (
                        <div className="flex justify-center mt-6">
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={goToFirstPage}
                                    disabled={currentPage === 1}
                                    className="p-1.5 bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 text-white"
                                    aria-label="First page"
                                >
                                    <ChevronFirst size={16} />
                                </button>
                                <button
                                    onClick={goToPrevPage}
                                    disabled={currentPage === 1}
                                    className="p-1.5 bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 text-white"
                                    aria-label="Previous page"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <span className="px-3 py-1 bg-gray-700/50 rounded min-w-[90px] text-center text-white text-sm">
                                    {currentPage} / {totalPages}
                                </span>
                                <button
                                    onClick={goToNextPage}
                                    disabled={currentPage === totalPages}
                                    className="p-1.5 bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 text-white"
                                    aria-label="Next page"
                                >
                                    <ChevronRight size={16} />
                                </button>
                                <button
                                    onClick={goToLastPage}
                                    disabled={currentPage === totalPages}
                                    className="p-1.5 bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 text-white"
                                    aria-label="Last page"
                                >
                                    <ChevronLast size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}