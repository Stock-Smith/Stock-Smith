import React from 'react';
import { ViewMode } from '../lib/news';
import { LayoutGrid, List, Filter, X } from 'lucide-react';

interface NewsHeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onFilterToggle: () => void;
  filterVisible: boolean;
}

const NewsHeader = ({ 
  viewMode, 
  onViewModeChange, 
  onFilterToggle,
  filterVisible
}: NewsHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
      <div className="bg-gray-900 rounded-xl p-2 flex items-center space-x-1 border border-gray-800 shadow-md">
        <div className={`p-2 rounded-md cursor-pointer transition-all duration-200 ${
          viewMode === 'grid' 
            ? 'text-blue-400 bg-blue-900/30 shadow-inner' 
            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
        }`} onClick={() => onViewModeChange('grid')}>
          <LayoutGrid className="h-5 w-5" />
        </div>
        <div className={`p-2 rounded-md cursor-pointer transition-all duration-200 ${
          viewMode === 'list' 
            ? 'text-blue-400 bg-blue-900/30 shadow-inner' 
            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
        }`} onClick={() => onViewModeChange('list')}>
          <List className="h-5 w-5" />
        </div>
      </div>
      
      <button 
        onClick={onFilterToggle}
        className={`bg-gray-900 rounded-xl py-2 px-4 flex items-center gap-2 border border-gray-800 transition-all duration-200 hover:shadow-md ${
          filterVisible 
            ? 'text-red-400 hover:bg-red-900/20 hover:border-red-900/50' 
            : 'text-blue-400 hover:bg-blue-900/20 hover:border-blue-900/50'
        }`}
      >
        {filterVisible ? (
          <>
            <X className="h-5 w-5" />
            <span className="font-medium">Close Filters</span>
          </>
        ) : (
          <>
            <Filter className="h-5 w-5" />
            <span className="font-medium">Filter News</span>
          </>
        )}
      </button>
    </div>
  );
};

export default NewsHeader;