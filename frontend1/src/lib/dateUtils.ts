export const formatPublishedDate = (dateString: string): string => {
    // dateString format: 20250321T104755
    if (!dateString) return '';
  
    try {
      const year = dateString.substring(0, 4);
      const month = dateString.substring(4, 6);
      const day = dateString.substring(6, 8);
      const hour = dateString.substring(9, 11);
      const minute = dateString.substring(11, 13);
      
      const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:00`);
      
      // Format: "Mar 21, 2025 · 10:47 AM"
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
      }).format(date).replace(',', ' ·');
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };
  
  export const formatDateForQuery = (date: Date): string => {
    // Format: YYYYMMDD
    return date.toISOString().slice(0, 10).replace(/-/g, '');
  };