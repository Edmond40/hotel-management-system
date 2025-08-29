import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Filter, Eye } from 'lucide-react';
import { useAuth } from '../../features/shared/auth/AuthProvider';
import http from '../../features/shared/services/http.js';

const RoomManagement = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { user } = useAuth();

  // Role-based access control
  const isAdmin = user?.role === 'ADMIN';
  const canManageRooms = isAdmin;

  const [newRoom, setNewRoom] = useState({
    number: '',
    type: 'Single',
    price: '',
    floor: '',
    amenities: [],
    description: '',
    status: 'Available'
  });

  const roomTypes = ['Single', 'Double', 'Suite', 'Deluxe', 'Presidential'];
  const roomStatuses = ['Available', 'Occupied', 'Maintenance', 'Cleaning'];
  const availableAmenities = ['WiFi', 'AC', 'TV', 'Mini Bar', 'Balcony', 'Ocean View', 'Kitchen', 'Jacuzzi'];

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const data = await http.get('/admin/rooms');
      setRooms(data);
    } catch (error) {
      console.error('Error fetching rooms:', error.message || error);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoom = async (e) => {
    e.preventDefault();
    try {
      await http.post('/admin/rooms', newRoom);
        setShowAddModal(false);
        setNewRoom({
          number: '',
          type: 'Single',
          price: '',
          floor: '',
          amenities: [],
          description: '',
          status: 'Available'
        });
        fetchRooms();
    } catch (error) {
      console.error('Error adding room:', error.message || error);
    }
  };

  const handleEditRoom = async (e) => {
    e.preventDefault();
    try {
      await http.put(`/admin/rooms/${selectedRoom.id}`, selectedRoom);
        setShowEditModal(false);
        setSelectedRoom(null);
        fetchRooms();
    } catch (error) {
      console.error('Error updating room:', error.message || error);
    }
  };

  const handleDeleteRoom = async () => {
    try {
      await http.delete(`/admin/rooms/${selectedRoom.id}`);
        setShowDeleteModal(false);
        setSelectedRoom(null);
        fetchRooms();
    } catch (error) {
      console.error('Error deleting room:', error.message || error);
    }
  };

  const toggleAmenity = (amenity) => {
    if (newRoom.amenities.includes(amenity)) {
      setNewRoom(prev => ({
        ...prev,
        amenities: prev.amenities.filter(a => a !== amenity)
      }));
    } else {
      setNewRoom(prev => ({
        ...prev,
        amenities: [...prev.amenities, amenity]
      }));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-800';
      case 'Occupied': return 'bg-blue-100 text-blue-800';
      case 'Maintenance': return 'bg-red-100 text-red-800';
      case 'Cleaning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || room.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div data-aos="fade-left">
          <h1 className="text-2xl font-bold text-gray-900">Room Management</h1>
          <p className="text-gray-600">Manage hotel rooms, availability, and pricing</p>
        </div>
        {canManageRooms && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            data-aos="fade-right">
            <Plus size={20} />
            Add Room
          </button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4" data-aos="zoom-in">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search rooms by number or type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          {roomStatuses.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRooms.map((room) => (
          <div key={room.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow" data-aos="fade-right">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Room {room.number}</h3>
                  <p className="text-gray-600">{room.type}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(room.status)}`}>
                  {room.status}
                </span>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-semibold text-gray-900">${room.price}/night</span>
                </div>
                {room.floor && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Floor:</span>
                    <span className="font-semibold text-gray-900">{room.floor}</span>
                  </div>
                )}
                {room.amenities && room.amenities.length > 0 && (
                  <div>
                    <span className="text-gray-600 text-sm">Amenities:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {room.amenities.slice(0, 3).map((amenity, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {amenity}
                        </span>
                      ))}
                      {room.amenities.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          +{room.amenities.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {canManageRooms && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedRoom(room);
                      setShowEditModal(true);
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm transition-colors"
                  >
                    <Edit size={16} className="inline mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setSelectedRoom(room);
                      setShowDeleteModal(true);
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm transition-colors"
                  >
                    <Trash2 size={16} className="inline mr-1" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {!canManageRooms && (
        <div className="text-center py-12">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-yellow-800 mb-2">Access Restricted</h3>
            <p className="text-yellow-700">
              You need admin privileges to manage rooms. Contact your administrator for access.
            </p>
          </div>
        </div>
      )}

      {canManageRooms && filteredRooms.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No rooms found matching your criteria</p>
        </div>
      )}

      {/* Add Room Modal */}
      {showAddModal && (
        <div className="fixed inset-0 backdrop-brightness-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto" data-aos="zoom-in">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Add New Room</h2>
              <form onSubmit={handleAddRoom} className="space-y-4" >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                  <input
                    type="text"
                    value={newRoom.number}
                    onChange={(e) => setNewRoom(prev => ({ ...prev, number: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                  <select
                    value={newRoom.type}
                    onChange={(e) => setNewRoom(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    {roomTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price per Night ($)</label>
                  <input
                    type="number"
                    value={newRoom.price}
                    onChange={(e) => setNewRoom(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
                  <select
                    value={newRoom.floor}
                    onChange={(e) => setNewRoom(prev => ({ ...prev, floor: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Select Floor</option>
                    <option value="1">1st Floor</option>
                    <option value="2">2nd Floor</option>
                    <option value="3">3rd Floor</option>
                    <option value="4">4th Floor</option>
                    <option value="5">5th Floor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={newRoom.status}
                    onChange={(e) => setNewRoom(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    {roomStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amenities</label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableAmenities.map(amenity => (
                      <label key={amenity} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newRoom.amenities.includes(amenity)}
                          onChange={() => toggleAmenity(amenity)}
                          className="mr-2"
                        />
                        <span className="text-sm">{amenity}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newRoom.description}
                    onChange={(e) => setNewRoom(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-md transition-colors"
                  >
                    Add Room
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Room Modal */}
      {showEditModal && selectedRoom && (
        <div className="fixed inset-0 backdrop-brightness-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto" data-aos="zoom-in">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Edit Room {selectedRoom.number}</h2>
              <form onSubmit={handleEditRoom} className="space-y-4" >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                  <input
                    type="text"
                    value={selectedRoom.number}
                    onChange={(e) => setSelectedRoom(prev => ({ ...prev, number: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                  <select
                    value={selectedRoom.type}
                    onChange={(e) => setSelectedRoom(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    {roomTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price per Night ($)</label>
                  <input
                    type="number"
                    value={selectedRoom.price}
                    onChange={(e) => setSelectedRoom(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
                  <select
                    value={selectedRoom.floor || ''}
                    onChange={(e) => setSelectedRoom(prev => ({ ...prev, floor: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Select Floor</option>
                    <option value="1">1st Floor</option>
                    <option value="2">2nd Floor</option>
                    <option value="3">3rd Floor</option>
                    <option value="4">4th Floor</option>
                    <option value="5">5th Floor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={selectedRoom.status}
                    onChange={(e) => setSelectedRoom(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    {roomStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={selectedRoom.description || ''}
                    onChange={(e) => setSelectedRoom(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
                  >
                    Update Room
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Delete Room</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete Room {selectedRoom.number}? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteRoom}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomManagement;