import React from 'react';
import { LayoutGrid, LayoutList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ViewMode } from '../lib/news';

interface NewsHeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onFilterToggle: () => void;
  filterVisible: boolean;
}

const NewsHeader: React.FC<NewsHeaderProps> = ({ 
  viewMode, 
  onViewModeChange,
  onFilterToggle,
  filterVisible
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financial News</h1>
        <p className="text-muted-foreground mt-1">Stay updated with the latest market trends</p>
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          variant={filterVisible ? "default" : "outline"} 
          onClick={onFilterToggle}
          className="transition-all duration-300"
        >
          {filterVisible ? "Hide Filters" : "Show Filters"}
        </Button>
        
        <div className="bg-secondary rounded-md p-1 flex">
          <Button
            variant={viewMode === 'grid' ? "secondary" : "ghost"}
            size="icon"
            onClick={() => onViewModeChange('grid')}
            className="rounded-sm"
          >
            <LayoutGrid size={18} />
          </Button>
          <Button
            variant={viewMode === 'list' ? "secondary" : "ghost"}
            size="icon"
            onClick={() => onViewModeChange('list')}
            className="rounded-sm"
          >
            <LayoutList size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NewsHeader;