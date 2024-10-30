export default function TroveLifecycle({ events }) {
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
            <h2 className="text-2xl font-bold mb-4 text-white">Trove Lifecycle</h2>
            <div className="space-y-4">
                {events.map((event, index) => {
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
        </div>
    );
}