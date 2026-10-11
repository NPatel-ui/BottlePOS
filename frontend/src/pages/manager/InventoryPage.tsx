import { useState } from 'react';
import { PackageSearch, Plus, Download, ArrowLeft, Search, Barcode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
}

export default function InventoryPage() {
  const [view, setView] = useState<'overview' | 'add_product'>('overview');
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Add Product Form State
  const [newName, setNewName] = useState('');
  const [newSku, setNewSku] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCost, setNewCost] = useState('');
  const [newStock, setNewStock] = useState('');

  const handleExport = () => {
    // Generate CSV
    const headers = ['ID', 'Name', 'SKU', 'Category', 'Price', 'Cost', 'Stock'];
    const rows = products.map(p => [
      p.id, 
      `"${p.name}"`, 
      p.sku, 
      p.category, 
      p.price.toFixed(2), 
      p.cost.toFixed(2), 
      p.stock
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(',') + '\n' 
      + rows.map(r => r.join(',')).join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bottlepos_inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newProduct: Product = {
      id: `PRD-${Math.floor(Math.random() * 10000)}`,
      name: newName,
      sku: newSku || `SKU${Math.floor(Math.random() * 1000000)}`,
      category: newCategory || 'Uncategorized',
      price: parseFloat(newPrice) || 0,
      cost: parseFloat(newCost) || 0,
      stock: parseInt(newStock) || 0,
    };

    setProducts([...products, newProduct]);
    
    // Reset form
    setNewName('');
    setNewSku('');
    setNewCategory('');
    setNewPrice('');
    setNewCost('');
    setNewStock('');
    setView('overview');
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full font-sans relative">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            {view !== 'overview' && (
              <button 
                onClick={() => setView('overview')}
                className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-label-secondary hover:text-primary transition-colors border border-separator"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <h1 className="text-3xl font-black text-label-primary tracking-tight">
              {view === 'overview' ? 'Inventory Management' : 'Add New Product'}
            </h1>
          </div>
          <p className="text-sm font-bold text-label-tertiary mt-1 ml-11">
            {view === 'overview' ? 'Real-time stock, pricing, and product catalog' : 'Create a new SKU in your catalog'}
          </p>
        </div>
        
        {view === 'overview' && (
          <div className="flex items-center gap-3">
            <button onClick={handleExport} className="btn-gray flex items-center gap-2 bg-white">
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button onClick={() => setView('add_product')} className="btn-filled flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Product
            </button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {view === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 flex flex-col"
          >
            {/* Search Bar */}
            {products.length > 0 && (
              <div className="relative mb-6 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-label-tertiary" />
                <input
                  type="text"
                  placeholder="Search by product name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-separator rounded-full px-4 py-3 pl-11 text-sm text-label-primary font-bold placeholder:text-label-tertiary focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                />
              </div>
            )}

            <div className="surface bg-white overflow-hidden rounded-[2rem] flex-1 flex flex-col shadow-sm border border-separator/50">
              {products.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary shadow-sm border border-primary/20">
                    <PackageSearch className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black text-label-primary mb-2">Empty Catalog</h3>
                  <p className="text-sm font-bold text-label-tertiary max-w-md mb-8">
                    Your inventory is currently empty. Start by adding your first product manually or use the import tool.
                  </p>
                  <button onClick={() => setView('add_product')} className="btn-filled flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add Your First Product
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-sm">
                    <thead className="bg-surfaceHover border-b border-separator sticky top-0">
                      <tr className="text-[11px] text-label-tertiary font-extrabold uppercase tracking-widest">
                        <th className="text-left px-6 py-4">Product Name</th>
                        <th className="text-left px-6 py-4">SKU / Barcode</th>
                        <th className="text-left px-6 py-4">Category</th>
                        <th className="text-right px-6 py-4">Cost Price</th>
                        <th className="text-right px-6 py-4">Retail Price</th>
                        <th className="text-right px-6 py-4">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map(product => (
                        <tr key={product.id} className="border-b border-separator/50 hover:bg-surfaceHover transition-colors group">
                          <td className="px-6 py-4 font-bold text-label-primary">{product.name}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-background rounded text-xs font-mono font-semibold text-label-secondary border border-separator">
                              <Barcode className="w-3 h-3 text-label-tertiary" /> {product.sku}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-semibold text-label-secondary">{product.category}</td>
                          <td className="px-6 py-4 text-right font-semibold text-label-tertiary tabular-nums">${product.cost.toFixed(2)}</td>
                          <td className="px-6 py-4 text-right font-black text-label-primary tabular-nums">${product.price.toFixed(2)}</td>
                          <td className="px-6 py-4 text-right">
                            <span className={`inline-flex items-center justify-center min-w-[3rem] px-2 py-1 rounded-lg text-xs font-black tabular-nums border ${
                              product.stock <= 5 ? 'bg-danger/10 text-danger border-danger/20' : 'bg-success/10 text-success border-success/20'
                            }`}>
                              {product.stock}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {filteredProducts.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-label-tertiary font-bold">
                            No products found matching your search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {view === 'add_product' && (
          <motion.div
            key="add_product"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="max-w-2xl mx-auto w-full"
          >
            <form onSubmit={handleAddProduct} className="surface bg-white p-8 rounded-[2rem] space-y-6 shadow-sm border border-separator/50">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-extrabold text-label-secondary uppercase tracking-widest mb-1.5 pl-2">Product Name</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-background border border-separator rounded-2xl px-5 py-3 text-sm font-bold text-label-primary focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all shadow-sm"
                    placeholder="e.g. Tito's Handmade Vodka 750ml"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-label-secondary uppercase tracking-widest mb-1.5 pl-2">SKU / Barcode</label>
                  <input
                    type="text"
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    className="w-full bg-background border border-separator rounded-2xl px-5 py-3 text-sm font-mono font-semibold text-label-primary focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all shadow-sm"
                    placeholder="Leave blank to auto-generate"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-label-secondary uppercase tracking-widest mb-1.5 pl-2">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-background border border-separator rounded-2xl px-5 py-3 text-sm font-bold text-label-primary focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all shadow-sm appearance-none"
                  >
                    <option value="">Select Category...</option>
                    <option value="Liquor">Liquor</option>
                    <option value="Beer">Beer</option>
                    <option value="Wine">Wine</option>
                    <option value="Mixers">Mixers</option>
                    <option value="Tobacco">Tobacco</option>
                    <option value="Snacks">Snacks</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-label-secondary uppercase tracking-widest mb-1.5 pl-2">Cost Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newCost}
                    onChange={(e) => setNewCost(e.target.value)}
                    className="w-full bg-background border border-separator rounded-2xl px-5 py-3 text-sm font-bold tabular-nums text-label-primary focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all shadow-sm"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-label-secondary uppercase tracking-widest mb-1.5 pl-2">Retail Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full bg-background border border-separator rounded-2xl px-5 py-3 text-sm font-black tabular-nums text-label-primary focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all shadow-sm"
                    placeholder="0.00"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-extrabold text-label-secondary uppercase tracking-widest mb-1.5 pl-2">Initial Stock Quantity</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    className="w-full bg-background border border-separator rounded-2xl px-5 py-3 text-sm font-bold tabular-nums text-label-primary focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all shadow-sm"
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div className="pt-4 border-t border-separator">
                <button type="submit" className="w-full btn-filled h-14 text-base shadow-lg shadow-primary/25">
                  Save Product to Catalog
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
