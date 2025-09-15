import React from 'react';
import type { HistoryEntry } from '../types';

interface HistoryProps {
  history: HistoryEntry[];
  onLoad: (entry: HistoryEntry) => void;
  onDelete: (id: number) => void;
}

const History: React.FC<HistoryProps> = ({ history, onLoad, onDelete }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-white">Analysis History</h2>
      {history.length === 0 ? (
        <div className="text-center py-12 bg-gray-800/50 rounded-lg">
          <p className="text-gray-400">You have no saved analyses.</p>
          <p className="text-gray-500 text-sm mt-2">Complete an analysis and click "Save to History" on the Insights page to save it here.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {history.map((entry) => (
            <li
              key={entry.id}
              className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-cyan-500 transition-colors"
            >
              <div>
                <p className="font-semibold text-white">{entry.fileName}</p>
                <p className="text-sm text-gray-400">Saved on: {entry.date}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => onLoad(entry)}
                  className="px-4 py-2 text-sm font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 transition-colors"
                >
                  Load
                </button>
                <button
                  onClick={() => onDelete(entry.id)}
                  className="px-4 py-2 text-sm font-medium rounded-md text-red-200 bg-red-900/60 hover:bg-red-900/80 transition-colors"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default History;
