// src/components/TabNav.js
export default function TabNav({ activeTab, onTabChange }) {
    return (
      <div className="mb-8">
        <div className="border-b border-gray-700">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {['Search', 'History'].map((tab) => (
              <button
                key={tab}
                onClick={() => onTabChange(tab.toLowerCase())}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.toLowerCase()
                    ? 'border-blue-500 text-blue-500'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'}
                `}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>
    );
  }