import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import api from '../api/axios';

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/movies/suggestions?q=${encodeURIComponent(query)}`);
        setSuggestions(res.data);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const handleSelect = (title) => {
    setQuery(title);
    setShowSuggestions(false);
    onSearch(title);
  };

  return (
    <div className="search-bar-wrap">
      <Search size={16} color="#bbb" />
      <input
        type="text"
        placeholder="Titles, people, genres"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onSearch(e.target.value);
        }}
        onFocus={() => suggestions.length && setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
      />
      {showSuggestions && suggestions.length > 0 && (
        <ul className="search-suggestions">
          {suggestions.map((s) => (
            <li key={s} onMouseDown={() => handleSelect(s)}>{s}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;
