import React, { useState, useEffect } from 'react';
import { 
  getInventory, 
  InventoryItem, 
  updateStock, 
  restockItem 
} from '../../services/inventoryService';
import { 
  Package, 
  AlertTriangle, 
  Plus, 
  Minus, 
  Search, 
  BarChart3, 
  Archive,
  History,
  Calendar,
  Layers
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

export function InventoryManager() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    const data = await getInventory();
    setItems(data);
    setLoading(false);
  };

  const filteredItems = items.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) || 
    i.category.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockItems = items.filter(i => i.stockLevel <= i.minThreshold);

  return (
    <div className="p-8 space-y-8 font-segoe max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-[#242424] tracking-tight flex items-center gap-3">
            <Package className="h-8 w-8 text-[#0078D4]" />
            Supply Chain & Inventory
          </h1>
          <p className="text-sm font-medium text-[#616161] mt-1">Managed stock levels and automated replenishment triggers</p>
        </div>
        <div className="flex gap-4">
           <div className="bg-amber-50 px-5 py-3 rounded-2xl border border-amber-100 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                 <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <div>
                 <p className="text-[10px] font-black uppercase text-amber-700 tracking-widest">Low Stock Alerts</p>
                 <p className="text-xl font-black text-[#242424]">{lowStockItems.length} SKUs Critical</p>
              </div>
           </div>
           <Button className="bg-[#242424] hover:bg-black text-white px-6 h-12 rounded-xl flex gap-2 font-black">
              <Plus className="h-5 w-5" />
              Add Inventory
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         <div className="bg-white p-6 rounded-3xl border border-[#EDEBE9] shadow-sm">
            <p className="text-[10px] font-black uppercase text-[#A19F9D] mb-4">Total Value</p>
            <p className="text-3xl font-black text-[#242424] tracking-tight">$42,850.00</p>
            <div className="mt-4 flex items-center gap-2 text-emerald-600 font-bold text-xs">
               <Plus className="h-3 w-3" />
               12% vs last month
            </div>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-[#EDEBE9] shadow-sm">
            <p className="text-[10px] font-black uppercase text-[#A19F9D] mb-4">Stock Turnover</p>
            <p className="text-3xl font-black text-[#242424] tracking-tight">4.2x</p>
            <div className="mt-4 flex items-center gap-2 text-[#616161] font-bold text-xs uppercase tracking-widest">
               Healthy Performance
            </div>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-[#EDEBE9] shadow-sm">
            <p className="text-[10px] font-black uppercase text-[#A19F9D] mb-4">Medication SKUs</p>
            <p className="text-3xl font-black text-[#242424] tracking-tight">128</p>
            <div className="mt-4 flex items-center gap-2 text-[#0078D4] font-bold text-xs uppercase tracking-widest">
               Controlled Substances Included
            </div>
         </div>
         <div className="bg-white p-6 rounded-3xl border border-[#EDEBE9] shadow-sm">
            <p className="text-[10px] font-black uppercase text-[#A19F9D] mb-4">Expired/Near-Expiry</p>
            <p className="text-3xl font-black text-rose-500 tracking-tight">12</p>
            <div className="mt-4 flex items-center gap-2 text-rose-500 font-bold text-xs">
               <AlertTriangle className="h-3 w-3" />
               Action Required
            </div>
         </div>
      </div>

      <div className="bg-white rounded-3xl border border-[#EDEBE9] shadow-xl overflow-hidden">
        <div className="p-6 border-b border-[#F3F2F1] flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#A19F9D]" />
              <input 
                 type="text" 
                 placeholder="Search by SKU, Category, or Location..."
                 className="w-full pl-12 pr-6 py-3 bg-[#FAFAFA] border border-[#F3F2F1] rounded-xl focus:ring-2 focus:ring-[#0078D4]/20 outline-none text-sm font-medium"
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
              />
           </div>
           <div className="flex gap-2">
              <Button variant="outline" className="rounded-xl font-bold h-11 px-6 gap-2">
                 <Layers className="h-4 w-4" />
                 Category Filter
              </Button>
              <Button variant="outline" className="rounded-xl font-bold h-11 px-6 gap-2">
                 <History className="h-4 w-4" />
                 Restock History
              </Button>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#FAFAFA] border-b border-[#EDEBE9]">
                <th className="px-8 py-5 text-left text-[11px] font-black uppercase tracking-widest text-[#616161]">Item Description</th>
                <th className="px-8 py-5 text-left text-[11px] font-black uppercase tracking-widest text-[#616161]">Category</th>
                <th className="px-8 py-5 text-left text-[11px] font-black uppercase tracking-widest text-[#616161]">Stock Level</th>
                <th className="px-8 py-5 text-left text-[11px] font-black uppercase tracking-widest text-[#616161]">Location</th>
                <th className="px-8 py-5 text-right text-[11px] font-black uppercase tracking-widest text-[#616161]">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F2F1]">
               {filteredItems.map(item => (
                 <tr key={item.id} className="hover:bg-[#FCFCFC] transition-colors">
                   <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                         <div className="h-12 w-12 rounded-2xl bg-[#FAFAFA] flex items-center justify-center border border-[#EDEBE9] text-[#616161]">
                            <Archive className="h-6 w-6" />
                         </div>
                         <div>
                            <p className="text-[13px] font-black text-[#242424]">{item.name}</p>
                            <p className="text-[10px] font-bold text-[#A19F9D] flex items-center gap-1 uppercase tracking-wider">
                               UID: {item.id.slice(0, 8)}
                            </p>
                         </div>
                      </div>
                   </td>
                   <td className="px-8 py-6">
                      <Badge variant="ghost" className="bg-[#F3F2F1] text-[#616161] font-black text-[10px] uppercase">
                         {item.category}
                      </Badge>
                   </td>
                   <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                         <div className="flex-1 w-32 h-2 bg-[#F3F2F1] rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${item.stockLevel <= item.minThreshold ? 'bg-rose-500' : 'bg-[#0078D4]'}`}
                              style={{ width: `${Math.min((item.stockLevel / (item.minThreshold * 4)) * 100, 100)}%` }}
                            />
                         </div>
                         <div className="min-w-[80px]">
                            <span className={`text-[12px] font-black ${item.stockLevel <= item.minThreshold ? 'text-rose-500' : 'text-[#242424]'}`}>
                               {item.stockLevel} {item.unit}
                            </span>
                         </div>
                      </div>
                   </td>
                   <td className="px-8 py-6">
                      <p className="text-xs font-bold text-[#616161] flex items-center gap-2">
                         <Calendar className="h-3.5 w-3.5" />
                         {item.location}
                      </p>
                   </td>
                   <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                         <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => updateStock(item.id, -1)}>
                            <Minus className="h-4 w-4" />
                         </Button>
                         <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => updateStock(item.id, 1)}>
                            <Plus className="h-4 w-4" />
                         </Button>
                         <Button className="h-8 text-[10px] font-black uppercase tracking-wider px-4 bg-[#0078D4] hover:bg-[#005A9E] text-white">
                            Order
                         </Button>
                      </div>
                   </td>
                 </tr>
               ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
