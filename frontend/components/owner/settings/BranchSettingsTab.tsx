import React, { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Plus, Building, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export default function BranchSettingsTab() {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    phone: ''
  });
  const { toast } = useToast();

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/owner/branches');
      setBranches(res.data.data);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to fetch branches', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/owner/branches', formData);
      toast({ title: 'Success', description: 'Branch added successfully' });
      setIsModalOpen(false);
      setFormData({ name: '', address: '', city: '', phone: '' });
      fetchBranches();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to add branch', variant: 'destructive' });
    }
  };

  const handleDelete = (id: string) => {
    toast({
      title: "Delete Branch",
      description: "Are you sure you want to delete this branch?",
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            await apiClient.delete(`/owner/branches/${id}`);
            toast({ title: 'Success', description: 'Branch deleted successfully' });
            fetchBranches();
          } catch (err: any) {
            toast({ title: 'Error', description: err.response?.data?.message || 'Failed to delete branch', variant: 'destructive' });
          }
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Branch Locations</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage your business branches across different locations.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Branch
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : branches.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed">
            No branches found. Add your first branch location!
          </div>
        ) : (
          branches.map((branch) => (
            <div key={branch.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg">
                    <Building className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{branch.name}</h3>
                </div>
                <button 
                  onClick={() => handleDelete(branch.id)}
                  className="text-slate-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 flex-1 text-sm text-slate-600 dark:text-slate-400 space-y-2">
                <p><strong>Address:</strong> {branch.address}</p>
                <p><strong>City:</strong> {branch.city}</p>
                <p><strong>Phone:</strong> {branch.phone}</p>
                <p><strong>Status:</strong> <span className="text-emerald-600 dark:text-emerald-500 font-medium">{branch.status}</span></p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                Added {branch.createdAt?._seconds ? format(new Date(branch.createdAt._seconds * 1000), 'MMM d, yyyy') : 'Recently'}
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add New Branch</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Branch Name *</label>
                <input 
                  type="text" required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full rounded-lg bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="e.g. Colombo Main Branch"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">City *</label>
                <input 
                  type="text" required
                  value={formData.city}
                  onChange={e => setFormData({...formData, city: e.target.value})}
                  className="w-full rounded-lg bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="e.g. Colombo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Address *</label>
                <input 
                  type="text" required
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  className="w-full rounded-lg bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Full street address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contact Phone *</label>
                <input 
                  type="text" required
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full rounded-lg bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="e.g. 0112345678"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="outline" className="dark:bg-slate-900 dark:text-white dark:border-slate-700 dark:hover:bg-slate-800" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                  Add Branch
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
