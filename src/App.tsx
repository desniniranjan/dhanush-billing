import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Minus, 
  UserPlus, 
  Trash2, 
  Share2, 
  FileText, 
  CreditCard, 
  Calendar, 
  Clock, 
  UserCircle,
  Package,
  Search,
  Edit2,
  X,
  MessageCircle,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BillingItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface InventoryItem {
  id: string;
  name: string;
  price: number;
}

interface Invoice {
  id: string;
  customerName: string;
  phoneNumber: string;
  items: BillingItem[];
  total: number;
  date: string;
}

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: '1', name: 'UPVC Pipe 110mm', price: 1450 },
  { id: '2', name: 'PVC Pipe 90mm', price: 980 },
  { id: '3', name: 'Drainage Pipe 75mm', price: 750 },
  { id: '4', name: 'Small Conduit 63mm', price: 550 },
];

type Tab = 'billing' | 'history' | 'inventory';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('billing');
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('ssa_inventory');
    return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
  });
  const [history, setHistory] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('ssa_history');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [items, setItems] = useState<BillingItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Inventory Form State
  const [newInvName, setNewInvName] = useState('');
  const [newInvPrice, setNewInvPrice] = useState('');
  const [editingInventoryItem, setEditingInventoryItem] = useState<InventoryItem | null>(null);
  const [inventorySearch, setInventorySearch] = useState('');
  
  // Preview State
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [isPreviewingFromHistory, setIsPreviewingFromHistory] = useState(false);

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(inventorySearch.toLowerCase())
  );

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('ssa_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('ssa_history', JSON.stringify(history));
  }, [history]);

  const updateQuantity = (id: string, delta: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const addItemToBill = (inventoryItem: InventoryItem) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === inventoryItem.id);
      if (existing) {
        return prev.map(i => i.id === inventoryItem.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...inventoryItem, quantity: 1 }];
    });
  };

  const prepareInvoice = (): Invoice | null => {
    if (items.length === 0) return null;
    
    return {
      id: `SSA-${Date.now().toString().slice(-6)}`,
      customerName: customerName || 'Walk-in Customer',
      phoneNumber: phoneNumber || 'N/A',
      items: [...items],
      total: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      date: currentTime.toLocaleString(),
    };
  };

  const saveInvoice = (invoice: Invoice) => {
    setHistory(prev => [invoice, ...prev]);
    setItems([]);
    setCustomerName('');
    setPhoneNumber('');
    setPreviewInvoice(null);
    setActiveTab('history');
  };

  const handleAddInventory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvName || !newInvPrice) return;

    if (editingInventoryItem) {
      setInventory(prev => prev.map(item => 
        item.id === editingInventoryItem.id 
          ? { ...item, name: newInvName, price: parseFloat(newInvPrice) }
          : item
      ));
      setEditingInventoryItem(null);
    } else {
      const newItem: InventoryItem = {
        id: Date.now().toString(),
        name: newInvName,
        price: parseFloat(newInvPrice),
      };
      setInventory(prev => [...prev, newItem]);
    }

    setNewInvName('');
    setNewInvPrice('');
  };

  const startEditingInventory = (item: InventoryItem) => {
    setEditingInventoryItem(item);
    setNewInvName(item.name);
    setNewInvPrice(item.price.toString());
  };

  const cancelEditingInventory = () => {
    setEditingInventoryItem(null);
    setNewInvName('');
    setNewInvPrice('');
  };

  const deleteInventoryItem = (id: string) => {
    setInventory(prev => prev.filter(item => item.id !== id));
    if (editingInventoryItem?.id === id) {
      cancelEditingInventory();
    }
  };

  const deleteInvoice = (id: string) => {
    setHistory(prev => prev.filter(inv => inv.id !== id));
  };

  const generateWhatsAppMessage = (invoice: Invoice) => {
    const header    = "Item               Qty   Price(₹)   Total(₹)";
    const separator = "--------------------------------------------";
    
    const tableRows = invoice.items.map(item => {
      const name = item.name.length > 18 ? item.name.slice(0, 15) + "..." : item.name.padEnd(18);
      const qty = item.quantity.toString().padStart(4);
      const price = item.price.toFixed(0).padStart(10);
      const total = (item.price * item.quantity).toFixed(0).padStart(10);
      return `${name} ${qty} ${price} ${total}`;
    }).join('\n');

    return `*SAI SRINIVAS AGENCIES - BILLING RECEIPT*\n\n` +
      `*Invoice ID:* ${invoice.id}\n` +
      `*Date:* ${invoice.date}\n` +
      `*Customer:* ${invoice.customerName}\n\n` +
      `*Items:*\n` +
      "```\n" +
      `${header}\n` +
      `${separator}\n` +
      `${tableRows}\n` +
      `${separator}\n` +
      "```\n\n" +
      `*Grand Total: ₹${invoice.total.toLocaleString()}.00*\n\n` +
      `Thank you for your business!`;
  };

  const sendWhatsAppBill = (invoice: Invoice) => {
    if (!invoice.phoneNumber || invoice.phoneNumber === 'N/A') {
      alert('No phone number provided for this customer.');
      return;
    }

    // Clean phone number: remove non-digits
    const cleanPhone = invoice.phoneNumber.replace(/\D/g, '');
    // Add 91 if it's a 10-digit number (assuming India)
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const message = generateWhatsAppMessage(invoice);
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneWithCountry}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {/* Top Navigation Bar */}
      <header className="bg-surface sticky top-0 z-50 px-8 py-4 flex justify-between items-center border-b border-outline-variant/10">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-extrabold tracking-tight text-primary font-headline cursor-pointer" onClick={() => setActiveTab('billing')}>
            Sai Srinivas Agencies
          </h1>
          <div className="hidden md:flex h-6 w-px bg-outline-variant/30"></div>
          <div className="hidden md:flex items-center gap-2 text-on-surface-variant text-sm font-medium">
            <Clock className="w-4 h-4" />
            <span>{formattedDate} • {formattedTime}</span>
          </div>
        </div>
        <nav className="flex items-center gap-6">
          <button 
            onClick={() => setActiveTab('billing')}
            className={`font-bold transition-all pb-1 ${activeTab === 'billing' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'}`}
          >
            Billing
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`font-bold transition-all pb-1 ${activeTab === 'history' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'}`}
          >
            History
          </button>
          <button 
            onClick={() => setActiveTab('inventory')}
            className={`font-bold transition-all pb-1 ${activeTab === 'inventory' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'}`}
          >
            Inventory
          </button>
          <div className="flex items-center gap-4 ml-4">
            <UserCircle className="w-6 h-6 text-primary cursor-pointer hover:scale-95 transition-transform" />
          </div>
        </nav>
      </header>

      <main className="max-w-[1400px] mx-auto p-8 flex flex-col gap-8 w-full">
        {activeTab === 'billing' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            {/* Left Column: Customer & Quick Add */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <section className="bg-surface-container-lowest p-6 rounded-xl shadow-[0_20px_40px_rgba(0,50,181,0.06)] flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-headline font-bold text-lg text-on-surface">Customer Details</h2>
                  <UserPlus className="w-5 h-5 text-secondary" />
                </div>
                <div className="space-y-6">
                  <div className="relative">
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1 block">Full Name</label>
                    <input 
                      className="w-full bg-transparent border-b-2 border-outline-variant focus:border-primary px-0 py-2 outline-none transition-colors placeholder:text-outline-variant/50" 
                      placeholder="e.g. Rajesh Kumar" 
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1 block">Phone Number</label>
                    <input 
                      className={`w-full bg-transparent border-b-2 px-0 py-2 outline-none transition-colors placeholder:text-outline-variant/50 ${
                        phoneNumber.length > 0 && phoneNumber.length < 10
                          ? 'border-destructive focus:border-destructive' 
                          : 'border-outline-variant focus:border-primary'
                      }`} 
                      placeholder="e.g. 9876543210" 
                      type="tel"
                      value={phoneNumber}
                      maxLength={10}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length <= 10) {
                          setPhoneNumber(val);
                        }
                      }}
                    />
                    {phoneNumber.length > 0 && phoneNumber.length < 10 && (
                      <span className="text-[10px] text-destructive font-bold mt-1 block">10 digits required for WhatsApp</span>
                    )}
                  </div>
                </div>
              </section>

              <section className="bg-surface-container-lowest p-6 rounded-xl shadow-[0_20px_40px_rgba(0,50,181,0.06)] flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-headline font-bold text-lg text-on-surface">Quick Add</h2>
                  <Package className="w-5 h-5 text-secondary" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {inventory.slice(0, 6).map((item) => (
                    <button 
                      key={item.id}
                      onClick={() => addItemToBill(item)}
                      className="flex flex-col items-start p-4 bg-surface-container-low rounded-xl hover:bg-surface-container transition-colors group text-left"
                    >
                      <span className="text-sm font-bold text-on-surface line-clamp-1">{item.name}</span>
                      <span className="text-xs font-bold text-primary mt-1">₹{item.price.toLocaleString()}</span>
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setActiveTab('inventory')}
                  className="w-full py-3 bg-surface-container-high text-primary font-bold rounded-xl hover:opacity-80 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Manage Inventory
                </button>
              </section>
            </div>

            {/* Right Column: Billing Table */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              <div className="bg-surface-container-lowest rounded-xl shadow-[0_20px_40px_rgba(0,50,181,0.06)] overflow-hidden">
                <div className="grid grid-cols-12 px-8 py-5 bg-surface-container-low border-b border-outline-variant/10">
                  <div className="col-span-5 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Product Name</div>
                  <div className="col-span-2 text-xs font-bold text-on-surface-variant uppercase tracking-widest text-center">Price</div>
                  <div className="col-span-3 text-xs font-bold text-on-surface-variant uppercase tracking-widest text-center">Quantity</div>
                  <div className="col-span-2 text-xs font-bold text-on-surface-variant uppercase tracking-widest text-right">Total</div>
                </div>

                <div className="flex flex-col min-h-[400px]">
                  <AnimatePresence initial={false}>
                    {items.length > 0 ? (
                      items.map((item, index) => (
                        <motion.div 
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className={`grid grid-cols-12 px-8 py-6 items-center hover:bg-surface-container-low/50 transition-colors group ${index % 2 !== 0 ? 'bg-surface-container-low/30' : ''}`}
                        >
                          <div className="col-span-5 flex flex-col">
                            <span className="font-headline font-bold text-on-surface">{item.name}</span>
                            <span className="text-xs text-primary font-bold">₹{item.price.toLocaleString()}</span>
                          </div>
                          <div className="col-span-2 text-center font-headline font-semibold text-on-surface">
                            ₹{item.price.toLocaleString()}
                          </div>
                          <div className="col-span-3 flex justify-center">
                            <div className="flex items-center bg-surface-container-low rounded-full px-2 py-1 gap-4">
                              <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white text-secondary transition-colors"><Minus className="w-4 h-4" /></button>
                              <span className="font-bold w-6 text-center">{item.quantity.toString().padStart(2, '0')}</span>
                              <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white text-primary transition-colors"><Plus className="w-4 h-4" /></button>
                            </div>
                          </div>
                          <div className="col-span-2 text-right font-headline font-bold text-primary">
                            ₹{(item.price * item.quantity).toLocaleString()}
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="flex-grow flex items-center justify-center py-12">
                        <div className="text-center opacity-20">
                          <Search className="w-12 h-12 mx-auto mb-2" />
                          <p className="text-sm font-medium">Add more items to start billing</p>
                        </div>
                      </div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="bg-primary text-white p-8 flex flex-col md:flex-row justify-between items-end md:items-center gap-6">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase tracking-widest opacity-70">Grand Total Amount</span>
                    <h3 className="font-headline text-4xl font-extrabold tracking-tight">₹{totalAmount.toLocaleString()}.00</h3>
                  </div>
                  <div className="flex gap-4 w-full md:w-auto">
                    <button onClick={() => setItems([])} className="flex-1 md:flex-none px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95">
                      <Trash2 className="w-5 h-5" /> Clear All
                    </button>
                    <button 
                      onClick={() => {
                        const inv = prepareInvoice();
                        if (inv) {
                          setPreviewInvoice(inv);
                          setIsPreviewingFromHistory(false);
                        }
                      }}
                      disabled={items.length === 0 || phoneNumber.length !== 10}
                      className="flex-1 md:flex-none px-8 py-3 bg-white text-primary hover:bg-surface-container-high rounded-xl font-bold flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Eye className="w-5 h-5" /> Preview Bill
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-extrabold font-headline text-on-surface">Billing History</h2>
              <div className="text-on-surface-variant text-sm font-medium">{history.length} Transactions Found</div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {history.length > 0 ? (
                history.map((invoice) => (
                  <div key={invoice.id} className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-on-surface">{invoice.customerName}</h3>
                        <p className="text-xs text-on-surface-variant">{invoice.id} • {invoice.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                      <div className="text-right">
                        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Total Amount</p>
                        <p className="font-headline font-bold text-primary text-lg">₹{invoice.total.toLocaleString()}.00</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            setPreviewInvoice(invoice);
                            setIsPreviewingFromHistory(true);
                          }}
                          className="p-2 hover:bg-surface-container-low rounded-full transition-colors text-primary"
                          title="Preview Bill"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => deleteInvoice(invoice.id)}
                          className="p-2 hover:bg-red-50 rounded-full transition-colors text-red-500"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-surface-container-lowest p-12 rounded-xl text-center border border-dashed border-outline-variant">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-outline-variant" />
                  <p className="text-on-surface-variant font-medium">No history found. Start billing to see records here.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'inventory' && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Add New Inventory Form */}
            <div className="lg:col-span-4">
              <section className="bg-surface-container-lowest p-6 rounded-xl shadow-[0_20px_40px_rgba(0,50,181,0.06)] flex flex-col gap-6 sticky top-24">
                <div className="flex items-center justify-between">
                  <h2 className="font-headline font-bold text-lg text-on-surface">
                    {editingInventoryItem ? 'Edit Pipe Details' : 'Add New Pipe'}
                  </h2>
                  {editingInventoryItem && (
                    <button onClick={cancelEditingInventory} className="text-on-surface-variant hover:text-primary">
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <form onSubmit={handleAddInventory} className="flex flex-col gap-6">
                  <div className="relative">
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1 block">Pipe Name</label>
                    <input 
                      className="w-full bg-transparent border-b-2 border-outline-variant focus:border-primary px-0 py-2 outline-none transition-colors" 
                      placeholder="e.g. CPVC Pipe 50mm" 
                      type="text"
                      value={newInvName}
                      onChange={(e) => setNewInvName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="relative">
                    <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1 block">Price (₹)</label>
                    <input 
                      className="w-full bg-transparent border-b-2 border-outline-variant focus:border-primary px-0 py-2 outline-none transition-colors" 
                      placeholder="0.00" 
                      type="number"
                      value={newInvPrice}
                      onChange={(e) => setNewInvPrice(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="w-full py-3 custom-gradient-btn text-white font-bold rounded-xl shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2">
                    {editingInventoryItem ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    {editingInventoryItem ? 'Update Item' : 'Add to Inventory'}
                  </button>
                </form>
              </section>
            </div>

            {/* Current Inventory List */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-extrabold font-headline text-on-surface">Current Inventory</h2>
                <div className="relative flex-grow max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                  <input 
                    type="text"
                    placeholder="Search pipes..."
                    className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant/30 rounded-xl outline-none focus:border-primary transition-colors"
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                  />
                </div>
                <div className="text-on-surface-variant text-sm font-medium whitespace-nowrap">
                  {filteredInventory.length} {filteredInventory.length === inventory.length ? '' : `of ${inventory.length}`} Items
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredInventory.length > 0 ? (
                  filteredInventory.map((item) => (
                    <div key={item.id} className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/10 flex justify-between items-center group">
                      <div>
                        <h3 className="font-bold text-on-surface">{item.name}</h3>
                        <p className="text-sm font-bold text-primary mt-1">₹{item.price.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => startEditingInventory(item)}
                          className={`p-2 rounded-lg transition-all ${editingInventoryItem?.id === item.id ? 'bg-primary text-white' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'}`}
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => deleteInventoryItem(item.id)}
                          className="p-2 text-on-surface-variant hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-12 bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant/30 flex flex-col items-center justify-center text-on-surface-variant">
                    <Search className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-sm font-medium">No items match your search "{inventorySearch}"</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Bill Preview Modal */}
        <AnimatePresence>
          {previewInvoice && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-surface-container-lowest w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold font-headline text-on-surface">Bill Preview</h2>
                      <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">Review before finalizing</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setPreviewInvoice(null)}
                    className="p-2 hover:bg-surface-container-high rounded-full transition-colors"
                  >
                    <X className="w-6 h-6 text-on-surface-variant" />
                  </button>
                </div>

                <div className="flex-grow overflow-y-auto p-8 space-y-8">
                  {/* Customer Info */}
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-2">Customer Name</p>
                      <p className="text-lg font-bold text-on-surface">{previewInvoice.customerName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-2">Phone Number</p>
                      <p className="text-lg font-bold text-on-surface">{previewInvoice.phoneNumber}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-2">Invoice ID</p>
                      <p className="text-sm font-bold text-primary">{previewInvoice.id}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] mb-2">Date & Time</p>
                      <p className="text-sm font-bold text-on-surface">{previewInvoice.date}</p>
                    </div>
                  </div>

                  {/* WhatsApp Preview Style */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em]">WhatsApp Message Preview</p>
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 rounded-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-[9px] font-bold text-green-600 uppercase tracking-wider">Live Preview</span>
                      </div>
                    </div>
                    <div className="bg-[#E9EDEF] dark:bg-[#111b21] text-[#111b21] dark:text-[#E9EDEF] p-5 rounded-2xl border border-outline-variant/20 font-mono text-[13px] leading-relaxed whitespace-pre-wrap shadow-inner relative overflow-hidden">
                      {/* Subtle WhatsApp-like background pattern could go here */}
                      <div className="relative z-10">
                        {generateWhatsAppMessage(previewInvoice).split('\n').map((line, i) => {
                          // Strip monospace backticks for the preview since the whole box is mono
                          const cleanLine = line.replace(/```/g, '');
                          
                          // Split by bold markers to avoid dangerouslySetInnerHTML if possible,
                          // or at least handle it more safely.
                          const parts = cleanLine.split(/(\*.*?\*)/g);
                          
                          return (
                            <div key={i} className="min-h-[1.2em]">
                              {parts.map((part, j) => {
                                if (part.startsWith('*') && part.endsWith('*')) {
                                  return <strong key={j}>{part.slice(1, -1)}</strong>;
                                }
                                return <span key={j}>{part}</span>;
                              })}
                              {line === '' && <br />}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mb-1">Grand Total Amount</p>
                      <p className="text-3xl font-extrabold text-primary">₹{previewInvoice.total.toLocaleString()}.00</p>
                    </div>
                    <CheckCircle2 className="w-12 h-12 text-primary opacity-20" />
                  </div>
                </div>

                <div className="p-6 bg-surface-container-low border-t border-outline-variant/10 flex gap-4">
                  <button 
                    onClick={() => setPreviewInvoice(null)}
                    className="flex-1 py-4 bg-surface-container-high text-on-surface font-bold rounded-2xl hover:bg-surface-container-highest transition-all"
                  >
                    Cancel
                  </button>
                  
                  {isPreviewingFromHistory ? (
                    <button 
                      onClick={() => sendWhatsAppBill(previewInvoice)}
                      className="flex-[2] py-4 bg-green-500 text-white font-bold rounded-2xl hover:bg-green-600 shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-5 h-5" /> Send via WhatsApp
                    </button>
                  ) : (
                    <div className="flex-[2] flex gap-3">
                      <button 
                        onClick={() => saveInvoice(previewInvoice)}
                        className="flex-1 py-4 bg-surface-container-highest text-primary font-bold rounded-2xl hover:opacity-80 transition-all flex items-center justify-center gap-2"
                      >
                        <Share2 className="w-5 h-5" /> Save Only
                      </button>
                      <button 
                        onClick={() => {
                          saveInvoice(previewInvoice);
                          sendWhatsAppBill(previewInvoice);
                        }}
                        className="flex-1 py-4 bg-primary text-white font-bold rounded-2xl hover:opacity-90 shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
                      >
                        <MessageCircle className="w-5 h-5" /> Save & Send
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-low px-8 py-6 mt-auto flex flex-col md:flex-row justify-between items-center w-full">
        <div className="flex flex-col gap-1">
          <span className="font-headline font-bold text-on-surface">Sai Srinivas Agencies</span>
          <p className="text-sm text-on-surface-variant">© 2024 Sai Srinivas Agencies. Professional Billing Solutions.</p>
        </div>
        <div className="flex gap-8 mt-4 md:mt-0">
          <a href="#" className="text-sm text-on-surface-variant hover:text-primary transition-colors">Support</a>
          <a href="#" className="text-sm text-on-surface-variant hover:text-primary transition-colors">Privacy Policy</a>
          <a href="#" className="text-sm text-on-surface-variant hover:text-primary transition-colors">Terms</a>
        </div>
      </footer>

      {/* Floating Action Button */}
      {activeTab === 'billing' && (
        <div className="fixed bottom-8 right-8 z-50">
          <button 
            onClick={() => {
              const inv = prepareInvoice();
              if (inv) {
                setPreviewInvoice(inv);
                setIsPreviewingFromHistory(false);
              }
            }}
            disabled={items.length === 0}
            className="custom-gradient-btn w-16 h-16 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-105 active:scale-90 transition-transform disabled:opacity-50 disabled:scale-100"
          >
            <Plus className="w-8 h-8" />
          </button>
        </div>
      )}
    </div>
  );
}
