import React, { useState } from 'react';
import '../styles/SearchBar.css';

function SearchBar() {
  const [searchData, setSearchData] = useState({
    location: '',
    date: '',
    passengers: 1
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate search functionality
    setTimeout(() => {
      console.log('Searching with:', searchData);
      setIsLoading(false);
    }, 2000);
  };

  return (
    <div className={`search-bar ${isLoading ? 'loading' : ''}`}>
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          name="location"
          placeholder="Where do you want to go?"
          value={searchData.location}
          onChange={handleInputChange}
          required
        />
        <input 
          type="date" 
          name="date"
          value={searchData.date}
          onChange={handleInputChange}
          min={new Date().toISOString().split('T')[0]}
          required
        />
        <input 
          type="number" 
          name="passengers"
          placeholder="Passengers" 
          min="1" 
          max="20"
          value={searchData.passengers}
          onChange={handleInputChange}
          required
        />
        <button 
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Searching...' : 'Search'}
        </button>
      </form>
    </div>
  );
}

export default SearchBar;