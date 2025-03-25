// app/hooks/useSearch.ts
import { useState, useRef } from 'react';
import { CardDetails } from '@/app/lib/card-data';

export function useSearch() {
  // Search results state
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<CardDetails[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [sortBy, setSortBy] = useState('name_asc');
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [lastSearchParams, setLastSearchParams] = useState<string>('');

  // Reference to store the current search criteria
  const currentSearchCriteria = useRef<any>({});

  // Build the search parameters
  const buildSearchParams = (options: any = {}) => {
    // Start with current search criteria and add/override with new options
    const mergedOptions = {
      ...currentSearchCriteria.current,
      ...options
    };
    
    const {
      name, 
      setCode, 
      manaCost,
      rarities = [],
      formats = [],
      startDate,
      endDate,
      page = currentPage,
      pageSize = itemsPerPage,
      sort = sortBy
    } = mergedOptions;
    
    const params = new URLSearchParams();
    
    if (name) params.append('name', name);
    if (setCode) params.append('setCode', setCode);
    if (manaCost === 'no_mana_cost') { // TODO: Fix this with the regex shit in Compass
      params.append('manaCost', '');
    } else if (manaCost) {
      params.append('manaCost', manaCost);
    }
    
    rarities.forEach((rarity: string) => params.append('rarity', rarity));
    formats.forEach((format: string) => params.append('format', format));
    
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    params.append('sort', sort);
    
    return params;
  };

  // Main search function
  const performSearch = async (options: any = {}) => {
    setIsLoading(true);
    
    try {
      // update current search criteria with new options
      currentSearchCriteria.current = {
        ...currentSearchCriteria.current,
        ...options
      };
      
      const params = buildSearchParams(options);
      console.log("Search parameters:", params.toString());
      
      const response = await fetch(`/api/search?${params.toString()}`);
      
      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      
      setSearchResults(data.cards || []);
      setTotalResults(data.pagination.totalResults);
      setTotalPages(data.pagination.totalPages);
      
      // Update state based on response and options
      if (options.page !== undefined) {
        console.log(`Setting currentPage to ${options.page} from options`);
        setCurrentPage(data.pagination.currentPage);
        currentSearchCriteria.current.page = options.page;
      } else if (data.pagination.currentPage) {
        console.log(`Setting currentPage to ${data.pagination.currentPage} from API response`);
        setCurrentPage(data.pagination.currentPage);
        currentSearchCriteria.current.page = data.pagination.currentPage;
      }
      
      if (options.pageSize !== undefined) {
        console.log(`Setting itemsPerPage to ${options.pageSize} from options`);
        setItemsPerPage(options.pageSize);
        currentSearchCriteria.current.pageSize = options.pageSize;
      }
      
      if (options.sort !== undefined) {
        console.log(`Setting sortBy to ${options.sort} from options`);
        setSortBy(options.sort);
        currentSearchCriteria.current.sort = options.sort;
      }
      
      setSearchPerformed(true);
      
      return data;
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setTotalResults(0);
      setTotalPages(0);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Specific handlers that use performSearch
  const handlePageChange = (page: number) => {
    return performSearch({ page });
  };

  const handleItemsPerPageChange = (pageSize: number) => {
    return performSearch({ page: 1, pageSize });
  };

  const handleSortChange = (sort: string) => {
    return performSearch({ sort, page: 1 });
  };

  return {
    // State
    isLoading,
    searchResults,
    totalResults,
    currentPage,
    itemsPerPage,
    totalPages,
    sortBy,
    searchPerformed,
    lastSearchParams,
    
    // Functions
    performSearch,
    handlePageChange,
    handleItemsPerPageChange,
    handleSortChange
  };
}