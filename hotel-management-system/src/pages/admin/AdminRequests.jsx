import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Search, Filter, Trash2, RotateCcw } from 'lucide-react';
import { toast } from 'react-toastify';
import http from '../../features/shared/services/http.js';
import { formatDate, formatTime } from '../../utils/dateUtils.js';

function AdminRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastRequestCount, setLastRequestCount] = useState(0);
    const [hasNewRequests, setHasNewRequests] = useState(false);

    useEffect(() => {
        fetchRequests();
        
        // Set up auto-refresh every 10 seconds for more responsive updates
        const interval = setInterval(() => {
            fetchRequestsQuietly();
        }, 10000);

        return () => clearInterval(interval);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    async function fetchRequests() {
        try {
            setLoading(true);
            const data = await http.get('/admin/requests');
            
            // Check for new requests
            const currentRequestCount = data.length;
            if (currentRequestCount > lastRequestCount && lastRequestCount > 0) {
                setHasNewRequests(true);
                // Auto-clear the new request indicator after 5 seconds
                setTimeout(() => setHasNewRequests(false), 5000);
            }
            setLastRequestCount(currentRequestCount);
            
            setRequests(data);
            setError(null);
        } catch (error) {
            console.error('Failed to fetch requests:', error);
            setError('Failed to load requests');
        } finally {
            setLoading(false);
        }
    }

    async function fetchRequestsQuietly() {
        try {
            setIsRefreshing(true);
            const data = await http.get('/admin/requests');
            
            // Check for new requests
            const currentRequestCount = data.length;
            if (currentRequestCount > lastRequestCount && lastRequestCount > 0) {
                setHasNewRequests(true);
                // Auto-clear the new request indicator after 5 seconds
                setTimeout(() => setHasNewRequests(false), 5000);
            }
            setLastRequestCount(currentRequestCount);
            
            setRequests(data);
            setError(null);
        } catch (error) {
            console.error('Failed to refresh requests:', error);
        } finally {
            setIsRefreshing(false);
        }
    }

    async function refreshRequests() {
        await fetchRequests();
    }

    async function updateRequestStatus(requestId, newStatus) {
        try {
            await http.put(`/admin/requests/${requestId}`, { status: newStatus });
            // Update local state
            setRequests(prev => prev.map(req => 
                req.id === requestId ? { ...req, status: newStatus } : req
            ));
            toast.success(`Request status updated to ${newStatus}`);
        } catch (error) {
            console.error('Failed to update request status:', error);
            toast.error('Failed to update request status');
        }
    }

    async function deleteRequest(requestId) {
        if (!confirm('Are you sure you want to delete this request? This action cannot be undone.')) {
            return;
        }

        try {
            await http.delete(`/admin/requests/${requestId}`);
            // Remove from local state
            setRequests(prev => prev.filter(req => req.id !== requestId));
            toast.success('Request deleted successfully');
        } catch (error) {
            console.error('Failed to delete request:', error);
            toast.error('Failed to delete request');
        }
    }

    // Filter and search logic
    const filteredRequests = requests.filter(request => {
        const matchesSearch = request.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            request.menuItem?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            request.specialInstructions?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'All' || request.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedRequests = filteredRequests.slice(startIndex, startIndex + itemsPerPage);

    const getStatusBadge = (status) => {
        const statusStyles = {
            'Pending': 'bg-amber-100 text-amber-800',
            'Confirmed': 'bg-blue-100 text-blue-800',
            'Completed': 'bg-emerald-100 text-emerald-800',
            'Cancelled': 'bg-red-100 text-red-800'
        };
        
        return statusStyles[status] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return (
            <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Guest Requests Management</h1>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Guest Requests Management</h1>
                <div className="text-center py-12">
                    <div className="text-red-500 mb-4">{error}</div>
                    <button 
                        onClick={fetchRequests}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-900">Guest Requests Management</h1>
                    {hasNewRequests && (
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full animate-pulse">
                            New requests!
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={refreshRequests}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Refresh requests"
                    >
                        <RotateCcw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                    <span className="text-sm text-gray-600">
                        Total: {filteredRequests.length} requests
                    </span>
                </div>
            </div>

            {/* Search and Filter Controls */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search by guest name, menu item, or instructions..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter size={20} className="text-gray-400" />
                        <select
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="All">All Status</option>
                            <option value="Pending">Pending</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Requests Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {paginatedRequests.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-gray-500 mb-4">No requests found</div>
                        {searchTerm || statusFilter !== 'All' ? (
                            <button 
                                onClick={() => {
                                    setSearchTerm('');
                                    setStatusFilter('All');
                                }}
                                className="text-blue-500 hover:text-blue-600"
                            >
                                Clear filters
                            </button>
                        ) : null}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                            Guest
                                        </th>
                                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                            Request Details
                                        </th>
                                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                            Date & Time
                                        </th>
                                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                            Status
                                        </th>
                                        <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {paginatedRequests.map((request) => (
                                        <tr key={request.id} className="hover:bg-gray-50">
                                            <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div>
                                                        <div className="text-xs md:text-sm font-medium text-gray-900">
                                                            {request.user?.name || 'Unknown Guest'}
                                                        </div>
                                                        <div className="text-xs text-gray-500 hidden sm:block">
                                                            {request.user?.email || 'No email'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 md:px-6 py-4">
                                                <div className="text-xs md:text-sm text-gray-900">
                                                    <div className="font-medium">
                                                        {request.menuItem ? `${request.menuItem.name}` : 'Service Request'}
                                                    </div>
                                                    {request.quantity && request.quantity > 1 && (
                                                        <div className="text-gray-500 text-xs">Qty: {request.quantity}</div>
                                                    )}
                                                    {request.specialInstructions && (
                                                        <div className="text-gray-500 mt-1 text-xs truncate max-w-xs" title={request.specialInstructions}>
                                                            Note: {request.specialInstructions}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-3 md:px-6 py-4 whitespace-nowrap text-xs md:text-sm text-gray-500">
                                                <div>{formatDate(request.createdAt)}</div>
                                                <div className="hidden sm:block">{formatTime(request.createdAt)}</div>
                                            </td>
                                            <td className="px-3 md:px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(request.status)}`}>
                                                    {request.status}
                                                </span>
                                            </td>
                                            <td className="px-3 md:px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center gap-1 md:gap-2">
                                                    {request.status === 'Pending' && (
                                                        <>
                                                            <button
                                                                onClick={() => updateRequestStatus(request.id, 'Confirmed')}
                                                                className="text-blue-600 hover:text-blue-900 flex items-center gap-1 p-1"
                                                                title="Confirm Request"
                                                            >
                                                                <CheckCircle size={14} />
                                                                <span className="hidden md:inline text-xs">Confirm</span>
                                                            </button>
                                                            <button
                                                                onClick={() => updateRequestStatus(request.id, 'Cancelled')}
                                                                className="text-red-600 hover:text-red-900 flex items-center gap-1 p-1"
                                                                title="Cancel Request"
                                                            >
                                                                <XCircle size={14} />
                                                                <span className="hidden md:inline text-xs">Cancel</span>
                                                            </button>
                                                        </>
                                                    )}
                                                    {request.status === 'Confirmed' && (
                                                        <button
                                                            onClick={() => updateRequestStatus(request.id, 'Completed')}
                                                            className="text-emerald-600 hover:text-emerald-900 flex items-center gap-1 p-1"
                                                            title="Mark as Completed"
                                                        >
                                                            <CheckCircle size={14} />
                                                            <span className="hidden md:inline text-xs">Complete</span>
                                                        </button>
                                                    )}
                                                    {(request.status === 'Completed' || request.status === 'Cancelled') && (
                                                        <button
                                                            onClick={() => deleteRequest(request.id)}
                                                            className="text-red-600 hover:text-red-900 flex items-center gap-1 p-1"
                                                            title="Delete Request"
                                                        >
                                                            <Trash2 size={14} />
                                                            <span className="hidden md:inline text-xs">Delete</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                                <div className="flex-1 flex justify-between sm:hidden">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </div>
                                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                                            <span className="font-medium">
                                                {Math.min(startIndex + itemsPerPage, filteredRequests.length)}
                                            </span>{' '}
                                            of <span className="font-medium">{filteredRequests.length}</span> results
                                        </p>
                                    </div>
                                    <div>
                                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                                disabled={currentPage === 1}
                                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                            >
                                                Previous
                                            </button>
                                            {[...Array(totalPages)].map((_, index) => (
                                                <button
                                                    key={index + 1}
                                                    onClick={() => setCurrentPage(index + 1)}
                                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                        currentPage === index + 1
                                                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {index + 1}
                                                </button>
                                            ))}
                                            <button
                                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                                disabled={currentPage === totalPages}
                                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                            >
                                                Next
                                            </button>
                                        </nav>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default AdminRequests;
