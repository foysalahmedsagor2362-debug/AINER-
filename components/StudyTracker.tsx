import React from 'react';
import { StudyTopic } from '../types';

interface StudyTrackerProps {
  topics: StudyTopic[];
}

const StudyTracker: React.FC<StudyTrackerProps> = ({ topics }) => {
  return (
    <div className="h-full glass-panel rounded-2xl flex flex-col overflow-hidden">
      <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
        <h2 className="text-sm font-semibold text-purple-400 uppercase tracking-wider">Study Tracker</h2>
        <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-gray-300">{topics.length} Topics</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {topics.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            <p>No topics tracked yet.</p>
            <p className="text-xs mt-2">The AI will automatically log topics as you discuss them.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {topics.map((topic) => (
              <div key={topic.id} className="group relative p-3 rounded-xl bg-white/5 border border-white/5 hover:border-purple-500/30 transition-all">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-medium text-purple-200">{topic.name}</h3>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {topic.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                {topic.summary && (
                  <p className="text-xs text-gray-400 line-clamp-2">{topic.summary}</p>
                )}
                <div className="absolute left-0 top-3 bottom-3 w-1 bg-purple-500 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyTracker;
