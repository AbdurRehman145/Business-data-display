"use client";

import React, { useEffect, useState } from "react";

interface Business {
  _id: string;
  name: string;
  address?: string;
  phone?: string;
  phone_type?: string;
  website?: string;
  city?: string;
}

const formatPhone = (phone?: string, type?: string) => {
  if (!phone || !phone.startsWith('+92')) return phone;
  if (type === 'mobile') {
    return phone.replace(/(\+92)(\d{3})(\d+)/, '$1 $2 $3');
  } else if (type === 'landline') {
    // Match common 2-digit major city codes
    if (/^\+92(?:21|22|41|42|51|52|53|54|55|61|62|71|72|81)/.test(phone)) {
       return phone.replace(/(\+92)(\d{2})(\d+)/, '$1 $2 $3');
    }
    return phone.replace(/(\+92)(\d{3})(\d+)/, '$1 $2 $3');
  }
  return phone;
};

export default function Home() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters state
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("All");
  const [hasPhone, setHasPhone] = useState("any");
  const [hasWebsite, setHasWebsite] = useState("any");

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Debounce state for search
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  // Fetch unique cities for the dropdown
  useEffect(() => {
    fetch("/api/cities")
      .then((res) => res.json())
      .then((data) => {
        if (data.cities) setCities(data.cities);
      })
      .catch((err) => console.error("Error fetching cities", err));
  }, []);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on new search
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Reset page when other filters change
  useEffect(() => {
    setPage(1);
  }, [city, hasPhone, hasWebsite]);

  // Fetch businesses whenever filters or page changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams();
        if (debouncedSearch) query.append("search", debouncedSearch);
        if (city !== "All") query.append("city", city);
        if (hasPhone !== "any") query.append("hasPhone", hasPhone);
        if (hasWebsite !== "any") query.append("hasWebsite", hasWebsite);
        query.append("page", page.toString());

        const res = await fetch(`/api/businesses?${query.toString()}`);
        const data = await res.json();

        if (data.data) {
          setBusinesses(data.data);
          setTotalPages(data.pagination.totalPages);
          setTotalRecords(data.pagination.total);
        }
      } catch (error) {
        console.error("Failed to fetch businesses", error);
      }
      setLoading(false);
    };

    fetchData();
  }, [debouncedSearch, city, hasPhone, hasWebsite, page]);

  const getPageNumbers = () => {
    const delta = 2;
    const range: (number | string)[] = [];
    for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
      range.push(i);
    }
    if (page - delta > 2) range.unshift("...");
    if (page + delta < totalPages - 1) range.push("...");
    range.unshift(1);
    if (totalPages > 1) range.push(totalPages);
    return range;
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 sm:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Business Directory</h1>
        </header>

        {/* Filter Controls */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-end">
          
          <div className="flex-1 w-full relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Search name, address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="w-full md:w-48">
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            >
              <option value="All">All Cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-36">
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              value={hasPhone}
              onChange={(e) => setHasPhone(e.target.value)}
            >
              <option value="any">Any</option>
              <option value="mobile">Mobile</option>
              <option value="landline">Landline</option>
            </select>
          </div>

          <div className="w-full md:w-36">
            <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              value={hasWebsite}
              onChange={(e) => setHasWebsite(e.target.value)}
            >
              <option value="any">Any</option>
              <option value="yes">Listed</option>
              <option value="no">Not Listed</option>
            </select>
          </div>
          
        </div>

        {/* Data Grid / Table Setup */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Business Name</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">City</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Address</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Website</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading && businesses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      Loading data...
                    </td>
                  </tr>
                ) : businesses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No businesses found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  businesses.map((business) => (
                    <tr key={business._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{business.name || 'Unknown'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-700">{business.phone ? formatPhone(business.phone, business.phone_type) : <span className="text-gray-400 italic">Not available</span>}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-700">
                          {business.city || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 line-clamp-2" title={business.address}>{business.address || '-'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {business.website && business.website !== "N/A" ? (
                          <a href={business.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors">
                            Website
                          </a>
                        ) : (
                          <span className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-gray-400 bg-gray-100 cursor-not-allowed">
                            No Website
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Footer */}
          {!loading && totalPages > 0 && (
            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
              <span className="text-sm text-gray-700">
                Showing <span className="font-medium">{(page - 1) * 50 + 1}</span> to{' '}
                <span className="font-medium">{Math.min(page * 50, totalRecords)}</span> of{' '}
                <span className="font-medium">{totalRecords}</span> results
              </span>
              <div className="flex gap-2 items-center">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <div className="flex gap-1 hidden sm:flex">
                  {getPageNumbers().map((num, i) => (
                    <button
                      key={i}
                      onClick={() => typeof num === "number" && setPage(num)}
                      disabled={typeof num !== "number" || page === num}
                      className={`px-3 py-1 border rounded-md text-sm font-medium transition-colors ${
                        page === num
                          ? "bg-blue-50 border-blue-200 text-blue-700"
                          : typeof num === "number"
                          ? "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                          : "bg-white border-transparent text-gray-500 cursor-default"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
