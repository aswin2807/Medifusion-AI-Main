import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { 
  Search, ShoppingCart, Trash2, FileText, CheckCircle2, 
  Package, Truck, Pill, AlertCircle, Sparkles, RefreshCw, X, CreditCard
} from "lucide-react";

export default function Pharmacy({ patientId }) {
  const [activeTab, setActiveTab] = useState("store"); // store | orders
  const [medicines, setMedicines] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(false);

  // Cart state
  const [cart, setCart] = useState([]);

  // Checkout Form State
  const [showCheckout, setShowCheckout] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [uploadingPrescription, setUploadingPrescription] = useState(false);
  const [uploadedFileUrl, setUploadedFileUrl] = useState("");

  // Orders State
  const [orders, setOrders] = useState([]);
  const [refreshingOrders, setRefreshingOrders] = useState(false);

  const categories = ["All", "Analgesics", "NSAIDs", "Antihistamines", "Supplements", "Antidiabetic", "Cardiovascular", "Antibiotics", "Antihypertensive"];

  // Fetch medicines
  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/pharmacy/medicines?q=${searchQuery}&category=${selectedCategory}`);
      setMedicines(r.data);
    } catch (err) {
      toast.error("Failed to load medicines store");
    } finally {
      setLoading(false);
    }
  };

  // Fetch orders
  const fetchOrders = async () => {
    setRefreshingOrders(true);
    try {
      const r = await api.get(`/pharmacy/orders?patient_id=${patientId}`);
      setOrders(r.data);
    } catch (err) {
      toast.error("Failed to load order history");
    } finally {
      setRefreshingOrders(false);
    }
  };

  // Fetch initial profile to populate name/phone
  const fetchProfile = async () => {
    try {
      const r = await api.get("/auth/me");
      setPatientName(r.data.full_name || "");
      setPhone(r.data.phone || "");
    } catch (e) {}
  };

  useEffect(() => {
    fetchMedicines();
  }, [selectedCategory]);

  useEffect(() => {
    if (patientId) {
      fetchOrders();
      fetchProfile();
    }
  }, [patientId]);

  // Cart Actions
  const addToCart = (med) => {
    if (med.stock <= 0) {
      toast.error("Medicine is currently out of stock");
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.medicine_id === med.id);
      if (existing) {
        if (existing.quantity >= med.stock) {
          toast.error(`Cannot add more. Only ${med.stock} units in stock.`);
          return prev;
        }
        toast.success(`Updated quantity of ${med.name} in cart`);
        return prev.map((item) => 
          item.medicine_id === med.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      toast.success(`${med.name} added to cart`);
      return [...prev, {
        medicine_id: med.id,
        medicine_name: med.name,
        quantity: 1,
        price: med.price,
        prescription_required: med.prescription_required,
        stock: med.stock
      }];
    });
  };

  const updateQuantity = (medId, val) => {
    setCart((prev) => {
      const item = prev.find((i) => i.medicine_id === medId);
      if (!item) return prev;
      const newQty = item.quantity + val;
      if (newQty <= 0) {
        return prev.filter((i) => i.medicine_id !== medId);
      }
      if (newQty > item.stock) {
        toast.error(`Only ${item.stock} units available in stock.`);
        return prev;
      }
      return prev.map((i) => 
        i.medicine_id === medId 
          ? { ...i, quantity: newQty } 
          : i
      );
    });
  };

  const removeFromCart = (medId) => {
    setCart((prev) => prev.filter((item) => item.medicine_id !== medId));
    toast.info("Item removed from cart");
  };

  // Cart Calculations
  const subtotal = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);
  const deliveryCharge = subtotal > 0 ? 50.0 : 0.0;
  const total = subtotal + deliveryCharge;
  const prescriptionNeeded = cart.some((i) => i.prescription_required);

  // File Upload Handler
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPrescription(true);
    const fd = new FormData();
    fd.append("file", file);

    try {
      const r = await api.post("/pharmacy/prescriptions/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setUploadedFileUrl(r.data.file_url);
      toast.success("Prescription uploaded and indexed successfully");
    } catch (err) {
      toast.error("Failed to upload prescription");
    } finally {
      setUploadingPrescription(false);
    }
  };

  // Place Order Submit
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!patientName || !phone || !address) {
      toast.error("Please fill in all delivery details");
      return;
    }
    if (prescriptionNeeded && !uploadedFileUrl) {
      toast.error("Please upload a valid prescription file to proceed");
      return;
    }

    try {
      await api.post("/pharmacy/orders", {
        patient_id: patientId,
        patient_name: patientName,
        phone,
        delivery_address: address,
        payment_method: paymentMethod,
        items: cart,
        prescription_file_url: uploadedFileUrl || null,
        subtotal,
        delivery_charge: deliveryCharge,
        total
      });

      toast.success("Order placed successfully!");
      setCart([]);
      setPrescriptionFile(null);
      setUploadedFileUrl("");
      setShowCheckout(false);
      fetchOrders();
      fetchMedicines(); // Refresh stock levels
      setActiveTab("orders");
    } catch (err) {
      const msg = err.response?.data?.detail || "Order checkout failed";
      toast.error(msg);
    }
  };

  // Advance Order Status Simulator
  const simulateStatus = async (orderId, currentStatus) => {
    const statuses = ["Pending", "Confirmed", "Packed", "Shipped", "Delivered"];
    const idx = statuses.indexOf(currentStatus);
    if (idx === -1 || idx === statuses.length - 1) return;
    const nextStatus = statuses[idx + 1];

    try {
      await api.put(`/pharmacy/orders/${orderId}/status?status=${nextStatus}`);
      toast.success(`Order simulated to: ${nextStatus}`);
      fetchOrders();
    } catch {
      toast.error("Failed to update status");
    }
  };

  // Order Status Tracker Renderer
  const renderStatusTracker = (status) => {
    const stages = [
      { key: "Pending", icon: AlertCircle, label: "Pending" },
      { key: "Confirmed", icon: CheckCircle2, label: "Confirmed" },
      { key: "Packed", icon: Package, label: "Packed" },
      { key: "Shipped", icon: Truck, label: "Shipped" },
      { key: "Delivered", icon: Pill, label: "Delivered" },
    ];
    const currentIdx = stages.findIndex((s) => s.key === status);

    return (
      <div className="flex items-center justify-between mt-4 bg-stone-50 p-3 rounded-lg border border-stone-200">
        {stages.map((stage, idx) => {
          const StageIcon = stage.icon;
          const isDone = idx <= currentIdx;
          const isCurrent = idx === currentIdx;
          return (
            <div key={stage.key} className="flex flex-col items-center flex-1 relative">
              {/* Connector line */}
              {idx > 0 && (
                <div className={`absolute top-3.5 left-[-50%] right-[50%] h-0.5 z-0 ${
                  idx <= currentIdx ? "bg-emerald-800" : "bg-stone-300"
                }`} />
              )}
              <div className={`h-7 w-7 rounded-full flex items-center justify-center z-10 border transition ${
                isCurrent ? "bg-emerald-800 border-emerald-800 text-white animate-pulse" :
                isDone ? "bg-emerald-100 border-emerald-200 text-emerald-800" :
                "bg-white border-stone-300 text-stone-400"
              }`}>
                <StageIcon className="h-4 w-4" />
              </div>
              <span className={`text-[10px] font-bold mt-1.5 ${
                isCurrent ? "text-emerald-800 font-extrabold" :
                isDone ? "text-stone-700" : "text-stone-400"
              }`}>{stage.label}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm" data-testid="pharmacy-module">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-stone-100">
        <div>
          <div className="overline text-emerald-800 flex items-center gap-1 font-bold">
            <Pill className="h-4 w-4" /> Module: Pharmacy & Medicine Store
          </div>
          <h2 className="text-xl font-bold font-heading text-stone-900 mt-1">Patient Pharmacy & Medicine Ordering Module</h2>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab("store")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
              activeTab === "store" ? "bg-emerald-950 text-white" : "bg-stone-100 hover:bg-stone-200 text-stone-700"
            }`}
          >
            Medicine Store
          </button>
          <button 
            onClick={() => { setActiveTab("orders"); fetchOrders(); }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
              activeTab === "orders" ? "bg-emerald-950 text-white" : "bg-stone-100 hover:bg-stone-200 text-stone-700"
            }`}
          >
            My Orders ({orders.length})
          </button>
        </div>
      </div>

      {activeTab === "store" ? (
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main store view */}
          <div className="lg:col-span-3 space-y-4">
            {/* Search and filters */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search medicine name, generic name, or therapeutic category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && fetchMedicines()}
                  className="w-full pl-9 pr-4 py-2 border rounded-lg text-xs bg-white focus:outline-none focus:border-emerald-900 font-medium"
                />
              </div>
              <button 
                onClick={fetchMedicines}
                className="px-4 py-2 bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Search
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition whitespace-nowrap ${
                    selectedCategory === cat 
                      ? "bg-stone-900 text-white border-stone-900" 
                      : "bg-white hover:bg-stone-550 border-stone-200 text-stone-600"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Medicine Grid */}
            {loading ? (
              <div className="text-center py-12 text-xs font-mono text-stone-500">Loading catalog medicines...</div>
            ) : medicines.length > 0 ? (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {medicines.map((med) => (
                  <div key={med.id} className="border border-stone-200 rounded-xl bg-white p-4 flex flex-col justify-between hover:shadow-md transition">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          med.prescription_required 
                            ? "bg-rose-100 text-rose-800 border border-rose-200" 
                            : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        }`}>
                          {med.prescription_required ? "Prescription Required" : "OTC"}
                        </span>
                        <span className={`text-[10px] font-mono ${med.stock > 0 ? "text-emerald-700 font-bold" : "text-rose-600 font-bold"}`}>
                          {med.stock > 0 ? `${med.stock} in stock` : "Out of Stock"}
                        </span>
                      </div>
                      
                      <div>
                        <h4 className="font-bold text-stone-900 text-sm">{med.name}</h4>
                        <p className="text-[10px] text-stone-500 italic mt-0.5">{med.generic_name}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono text-stone-600 bg-stone-50 p-2 rounded">
                        <div><span className="text-stone-400">Manufacturer:</span> {med.manufacturer}</div>
                        <div><span className="text-stone-400">Dosage Form:</span> {med.dosage_form}</div>
                      </div>

                      <p className="text-[11px] text-stone-600 leading-normal">{med.usage_info}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                      <div className="text-sm font-extrabold text-stone-900">₹{med.price.toFixed(2)}</div>
                      <button
                        onClick={() => addToCart(med)}
                        disabled={med.stock <= 0}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                          med.stock > 0 
                            ? "bg-emerald-900 hover:bg-emerald-800 text-white" 
                            : "bg-stone-200 text-stone-400 cursor-not-allowed"
                        }`}
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-xs font-mono text-stone-400">No medicines found matching the filters.</div>
            )}
          </div>

          {/* Cart Sidebar Panel */}
          <div className="lg:col-span-1 border border-stone-200 rounded-xl p-4 bg-stone-50/50 flex flex-col justify-between min-h-[450px]">
            <div>
              <h3 className="font-bold text-xs text-stone-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-stone-200 mb-3">
                <ShoppingCart className="h-4 w-4 text-emerald-800" /> Shopping Cart ({cart.length})
              </h3>

              {cart.length > 0 ? (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div key={item.medicine_id} className="p-2.5 bg-white border border-stone-200 rounded-lg space-y-2 relative">
                      <button 
                        onClick={() => removeFromCart(item.medicine_id)}
                        className="absolute top-2 right-2 text-stone-400 hover:text-rose-600 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      
                      <div className="pr-6">
                        <div className="font-bold text-[11px] text-stone-900 truncate">{item.medicine_name}</div>
                        {item.prescription_required && (
                          <span className="text-[8px] bg-rose-50 text-rose-700 px-1 py-0.5 rounded font-mono font-bold">Rx Required</span>
                        )}
                      </div>

                      <div className="flex justify-between items-center text-[11px]">
                        <div className="flex items-center gap-1.5 border rounded px-1.5 py-0.5 bg-stone-50">
                          <button onClick={() => updateQuantity(item.medicine_id, -1)} className="font-bold text-stone-600 px-0.5 hover:text-stone-900">-</button>
                          <span className="font-mono font-bold w-4 text-center">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.medicine_id, 1)} className="font-bold text-stone-600 px-0.5 hover:text-stone-900">+</button>
                        </div>
                        <div className="font-mono font-bold text-stone-800">₹{(item.price * item.quantity).toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-stone-400 text-xs font-mono">
                  Your cart is empty.
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-stone-200 pt-3 mt-4 space-y-3">
                <div className="space-y-1 text-xs font-mono">
                  <div className="flex justify-between text-stone-500">
                    <span>Subtotal:</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-stone-500">
                    <span>Delivery Charge:</span>
                    <span>₹{deliveryCharge.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-stone-900 font-extrabold border-t border-dashed border-stone-200 pt-1.5 mt-1">
                    <span>Total Amount:</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>

                {prescriptionNeeded && (
                  <div className="p-2 bg-rose-50 border border-rose-200 rounded text-[10px] text-rose-800 font-medium flex gap-1.5 items-start leading-snug">
                    <AlertCircle className="h-4 w-4 text-rose-700 shrink-0" />
                    <span>One or more medicines in your cart require a valid prescription upload at checkout.</span>
                  </div>
                )}

                <button
                  onClick={() => setShowCheckout(true)}
                  className="w-full py-2.5 rounded-lg bg-emerald-950 text-white font-bold text-xs hover:bg-emerald-900 transition flex items-center justify-center gap-1.5"
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Orders View */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs text-stone-700 uppercase tracking-wider">My Medicine Orders History</h3>
            <button 
              onClick={fetchOrders}
              disabled={refreshingOrders}
              className="px-2.5 py-1 text-xs bg-stone-100 hover:bg-stone-200 font-semibold rounded flex items-center gap-1 border"
            >
              <RefreshCw className={`h-3 w-3 ${refreshingOrders ? "animate-spin" : ""}`} /> Refresh List
            </button>
          </div>

          {orders.length > 0 ? (
            <div className="space-y-6">
              {orders.map((order) => (
                <div key={order.id} className="border border-stone-200 rounded-xl bg-white p-5 space-y-4 hover:shadow-sm transition">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-stone-100 pb-3">
                    <div className="space-y-0.5">
                      <div className="text-xs font-mono font-bold text-emerald-800">Order ID: #{order.id}</div>
                      <div className="text-[10px] text-stone-400 font-mono">Date: {order.created_at?.replace("T", " ")?.slice(0, 19)}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 bg-stone-100 rounded text-stone-700 font-bold border font-mono">
                        Payment: {order.payment_method}
                      </span>
                      {order.prescription_file_url && (
                        <a 
                          href={`${api.defaults.baseURL}${order.prescription_file_url}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 rounded font-bold text-[10px] flex items-center gap-1"
                        >
                          <FileText className="h-3 w-3" /> View Prescription
                        </a>
                      )}
                      <span className="font-extrabold text-stone-900 text-sm">₹{order.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Order status tracking graphics */}
                  <div>
                    <div className="text-xs font-bold text-stone-700 mb-1">Shipping Status:</div>
                    {renderStatusTracker(order.status)}
                  </div>

                  {/* Order items, address & simulator details */}
                  <div className="grid md:grid-cols-2 gap-4 text-xs font-mono pt-2">
                    <div className="space-y-1 text-stone-600 border-r border-stone-100 pr-2">
                      <div className="font-bold text-stone-800 mb-1">Delivery Details:</div>
                      <div>Recipient: {order.patient_name}</div>
                      <div>Contact: {order.phone}</div>
                      <div className="truncate">Address: {order.delivery_address}</div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="font-bold text-stone-800 mb-1">Items Breakdown:</div>
                      <div className="max-h-24 overflow-y-auto space-y-1">
                        {order.items?.map((item, index) => (
                          <div key={index} className="flex justify-between text-[11px] text-stone-600">
                            <span>{item.medicine_name} (x{item.quantity})</span>
                            <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Simulation panel */}
                  {order.status !== "Delivered" && (
                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                      <div className="text-stone-400 font-mono flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-bounce" /> Status Simulation:
                      </div>
                      <button
                        onClick={() => simulateStatus(order.id, order.status)}
                        className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded font-bold transition text-[11px]"
                      >
                        Simulate Next Status Stage
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border rounded-xl bg-stone-50 border-stone-200 text-stone-400 text-xs font-mono">
              You haven't placed any pharmacy orders yet.
            </div>
          )}
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowCheckout(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 transition"
            >
              <X className="h-5 w-5" />
            </button>

            <form onSubmit={handlePlaceOrder}>
              <div className="p-6 space-y-4">
                <div className="border-b pb-2">
                  <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-emerald-800" /> Secure Order Checkout
                  </h3>
                  <p className="text-xs text-stone-500 mt-1">Review your items and enter delivery parameters.</p>
                </div>

                {/* Patient Information */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-stone-600 mb-1">Recipient Name</label>
                    <input
                      type="text"
                      required
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-xs bg-stone-50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-600 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-xs bg-stone-50 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Delivery Address */}
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">Delivery Address</label>
                  <textarea
                    required
                    rows={2}
                    value={address}
                    placeholder="Enter complete shipping/home address..."
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-stone-50 focus:outline-none"
                  />
                </div>

                {/* Prescription Upload Panel if required */}
                {prescriptionNeeded && (
                  <div className="p-3.5 bg-rose-50/50 border border-rose-200 rounded-xl space-y-2">
                    <label className="block text-xs font-bold text-rose-950 flex items-center gap-1">
                      <FileText className="h-4 w-4 text-rose-800" /> Upload Valid Doctor Prescription
                    </label>
                    <p className="text-[10px] text-rose-800 leading-normal mb-2">
                      Because prescription-only drugs (e.g., Metformin, Lisinopril) are in the cart, please attach a scan of your prescription.
                    </p>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileUpload}
                      className="w-full text-xs text-stone-600"
                    />
                    {uploadingPrescription && (
                      <div className="text-[10px] font-mono text-stone-500">Uploading and validating prescription scan...</div>
                    )}
                    {uploadedFileUrl && (
                      <div className="text-[10px] text-emerald-800 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" /> Prescription verified & indexed.
                      </div>
                    )}
                  </div>
                )}

                {/* Payment Selection */}
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1.5">Select Payment Mode</label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`p-3 border rounded-xl flex items-center gap-2 cursor-pointer transition ${
                      paymentMethod === "Cash on Delivery" ? "border-emerald-800 bg-emerald-50 text-emerald-950 font-bold" : "border-stone-200 hover:bg-stone-50"
                    }`}>
                      <input 
                        type="radio" 
                        name="payment" 
                        value="Cash on Delivery" 
                        checked={paymentMethod === "Cash on Delivery"} 
                        onChange={() => setPaymentMethod("Cash on Delivery")}
                        className="accent-emerald-950" 
                      />
                      <span className="text-xs">Cash on Delivery</span>
                    </label>

                    <label className={`p-3 border rounded-xl flex items-center gap-2 cursor-pointer transition ${
                      paymentMethod === "Demo Payment" ? "border-emerald-800 bg-emerald-50 text-emerald-950 font-bold" : "border-stone-200 hover:bg-stone-50"
                    }`}>
                      <input 
                        type="radio" 
                        name="payment" 
                        value="Demo Payment" 
                        checked={paymentMethod === "Demo Payment"} 
                        onChange={() => setPaymentMethod("Demo Payment")}
                        className="accent-emerald-950" 
                      />
                      <span className="text-xs">Demo Payment (Card)</span>
                    </label>
                  </div>
                </div>

                {/* Order Summary details */}
                <div className="p-3 bg-stone-100 rounded-xl space-y-1.5 text-xs font-mono">
                  <div className="font-bold text-stone-800 mb-1 text-[11px] uppercase tracking-wider">Order Checkout Summary:</div>
                  {cart.map((i, idx) => (
                    <div key={idx} className="flex justify-between text-stone-600 text-[11px]">
                      <span>{i.medicine_name} (x{i.quantity})</span>
                      <span>₹{(i.price * i.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-stone-900 font-extrabold border-t border-dashed border-stone-200 pt-1.5 mt-1">
                    <span>Payable Total:</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Checkout Form Actions */}
              <div className="bg-stone-50 p-4 border-t flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCheckout(false)}
                  className="px-4 py-2 border border-stone-200 bg-white hover:bg-stone-100 text-xs font-bold rounded-lg text-stone-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingPrescription}
                  className="px-5 py-2 bg-emerald-950 hover:bg-emerald-900 text-white text-xs font-bold rounded-lg disabled:opacity-50"
                >
                  Confirm & Place Order (₹{total.toFixed(2)})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
