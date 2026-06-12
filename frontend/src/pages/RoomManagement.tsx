import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, ShieldAlert, CheckCircle2, Sliders, ToggleLeft } from 'lucide-react';

interface Room {
  id: number;
  name: string;
  code: string;
  capacity: number;
  floor: number;
  building: string;
  description: string;
  status: string;
  amenities: string;
  amenitiesList: string[];
}

export const RoomManagement: React.FC = () => {
  const { user, apiCall, theme } = useAuth();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
  
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState<number>(1);
  const [capacity, setCapacity] = useState<number>(5);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('AVAILABLE');
  
  // Amenities checklist
  const availableAmenities = [
    'Projector',
    'Smart TV',
    'Whiteboard',
    'Video Conference',
    'Speaker System',
    'Air Conditioning'
  ];
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      const data = await apiCall('/api/rooms');
      setRooms(data);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setEditingRoomId(null);
    setName('');
    setCode('');
    setBuilding('');
    setFloor(1);
    setCapacity(5);
    setDescription('');
    setStatus('AVAILABLE');
    setSelectedAmenities([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (room: Room) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setEditingRoomId(room.id);
    setName(room.name);
    setCode(room.code);
    setBuilding(room.building);
    setFloor(room.floor);
    setCapacity(room.capacity);
    setDescription(room.description);
    setStatus(room.status);
    setSelectedAmenities(room.amenitiesList);
    setIsModalOpen(true);
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const payload = {
      name,
      code,
      building,
      floor,
      capacity,
      description,
      status,
      amenities: selectedAmenities.join(',')
    };

    try {
      if (editingRoomId) {
        // Edit room
        await apiCall(`/api/admin/rooms/${editingRoomId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        setSuccessMessage('Room updated successfully!');
      } else {
        // Create room
        await apiCall('/api/admin/rooms', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setSuccessMessage('Room created successfully!');
      }
      setIsModalOpen(false);
      fetchRooms();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleDeleteRoom = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this room? This will cancel bookings.')) return;
    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      await apiCall(`/api/admin/rooms/${id}`, { method: 'DELETE' });
      setSuccessMessage('Room deleted successfully!');
      fetchRooms();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const getStatusBadgeColor = (roomStatus: string) => {
    switch (roomStatus.toUpperCase()) {
      case 'AVAILABLE':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'MAINTENANCE':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'DISABLED':
        return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Messages */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 rounded-2xl text-xs flex items-center gap-2.5">
          <ShieldAlert className="h-4.5 w-4.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-2xl text-xs flex items-center gap-2.5">
          <CheckCircle2 className="h-4.5 w-4.5" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-5 rounded-2xl border dark:border-slate-800 shadow-sm">
        <div>
          <h3 className="font-bold text-lg font-outfit">Office Rooms Directory</h3>
          <p className="text-xs text-slate-400 mt-1">Configure and manage meeting assets in building locations.</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl text-xs font-semibold shadow-lg shadow-primary-500/25 flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" /> Add Room
        </button>
      </div>

      {/* Rooms List Table */}
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/40 border-b dark:border-slate-800 text-xs text-slate-400 font-semibold h-12">
                  <th className="p-4 pl-6">Room Name / Code</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Capacity</th>
                  <th className="p-4">Amenities</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-slate-800 text-sm">
                {rooms.map(room => (
                  <tr key={room.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                    {/* Name/Code */}
                    <td className="p-4 pl-6">
                      <p className="font-bold">{room.name}</p>
                      <span className="text-xs text-slate-400 font-mono mt-0.5 block">{room.code}</span>
                    </td>

                    {/* Location */}
                    <td className="p-4 text-xs text-slate-500 dark:text-slate-400">
                      {room.building} (Floor {room.floor})
                    </td>

                    {/* Capacity */}
                    <td className="p-4 font-semibold text-xs">
                      {room.capacity} seats
                    </td>

                    {/* Amenities */}
                    <td className="p-4 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {room.amenitiesList.map(am => (
                          <span
                            key={am}
                            className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 font-medium"
                          >
                            {am}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeColor(room.status)}`}>
                        {room.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4 pr-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(room)}
                          className="p-2 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRoom(room.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* CREATE/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-6 z-50 animate-fadeIn">
          <div className={`w-full max-w-lg rounded-3xl shadow-2xl p-8 border ${
            theme === 'dark' ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-200'
          }`}>
            <h4 className="text-xl font-bold font-outfit mb-6">
              {editingRoomId ? 'Edit Conference Room' : 'Add Conference Room'}
            </h4>

            <form onSubmit={handleSaveRoom} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">Room Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="E.g., Sky Lounge"
                    className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 border ${
                      theme === 'dark' ? 'bg-[#1e293b]/40 border-slate-700 text-white' : 'bg-white border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">Room Code</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="E.g., SL-4"
                    className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 border ${
                      theme === 'dark' ? 'bg-[#1e293b]/40 border-slate-700 text-white' : 'bg-white border-slate-200'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">Building</label>
                  <input
                    type="text"
                    required
                    value={building}
                    onChange={e => setBuilding(e.target.value)}
                    placeholder="E.g., HQ Block"
                    className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 border ${
                      theme === 'dark' ? 'bg-[#1e293b]/40 border-slate-700 text-white' : 'bg-white border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">Floor Number</label>
                  <input
                    type="number"
                    required
                    value={floor}
                    onChange={e => setFloor(Number(e.target.value))}
                    className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 border ${
                      theme === 'dark' ? 'bg-[#1e293b]/40 border-slate-700 text-white' : 'bg-white border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">Max Capacity</label>
                  <input
                    type="number"
                    required
                    value={capacity}
                    onChange={e => setCapacity(Number(e.target.value))}
                    className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 border ${
                      theme === 'dark' ? 'bg-[#1e293b]/40 border-slate-700 text-white' : 'bg-white border-slate-200'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">Room Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Details about capacity and purpose..."
                  rows={2}
                  className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 border ${
                    theme === 'dark' ? 'bg-[#1e293b]/40 border-slate-700 text-white' : 'bg-white border-slate-200'
                  }`}
                />
              </div>

              {/* Status & Amenities Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className={`w-full rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 border ${
                      theme === 'dark' ? 'bg-[#1e293b]/40 border-slate-700 text-white' : 'bg-white border-slate-200'
                    }`}
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="DISABLED">Disabled</option>
                    <option value="MAINTENANCE">Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2 font-outfit">Configure Amenities</label>
                  <div className={`max-h-24 overflow-y-auto border p-3 rounded-2xl space-y-1 ${
                    theme === 'dark' ? 'bg-[#1e293b]/40 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}>
                    {availableAmenities.map(am => (
                      <label key={am} className="flex items-center gap-2 cursor-pointer select-none text-xs">
                        <input
                          type="checkbox"
                          checked={selectedAmenities.includes(am)}
                          onChange={() => toggleAmenity(am)}
                          className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span>{am}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 border dark:border-slate-700 rounded-2xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl text-xs font-semibold shadow-lg shadow-primary-500/25"
                >
                  Save Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
