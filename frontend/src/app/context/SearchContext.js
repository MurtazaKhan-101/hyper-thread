'use client';

import { createContext, useContext, useState } from 'react';

const SearchContext = createContext();

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

export const SearchProvider = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('latest');

  const handleSearch = (query) => {
    if (query.trim()) {
      setSearchQuery(query);
      setActiveTab('search');
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab !== 'search') {
      setSearchQuery('');
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setActiveTab('latest');
  };

  return (
    <SearchContext.Provider
      value={{
        searchQuery,
        activeTab,
        handleSearch,
        handleTabChange,
        clearSearch,
        setSearchQuery,
        setActiveTab
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export default SearchContext;