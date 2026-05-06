import { useState, useMemo } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Plus, Trash2, FileText, Upload, Receipt, MessageCircle, Mail, Smartphone, Search, ChevronDown } from 'lucide-react';
import { Separator } from '../components/ui/separator';

interface BillItem {
  id: number;
  medicineName: string;
  quantity: number;
  price: number;
  total: number;
}

interface Medicine {
  id: string;
  name: string;
  price: number;
}

const availableMedicines: Medicine[] = [
  { id: 'med1', name: 'Paracetamol 500mg', price: 207.50 },
  { id: 'med2', name: 'Amoxicillin 250mg', price: 415.00 },
  { id: 'med3', name: 'Ibuprofen 400mg', price: 290.50 },
  { id: 'med4', name: 'Vitamin D3 1000IU', price: 664.00 },
  { id: 'med5', name: 'Omeprazole 20mg', price: 373.50 },
  { id: 'med6', name: 'Aspirin 75mg', price: 124.50 },
  { id: 'med7', name: 'Metformin 500mg', price: 498.00 },
  { id: 'med8', name: 'Cetirizine 10mg', price: 166.00 },
];

export function Billing() {
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [patientName, setPatientName] = useState('');
  const [patientContact, setPatientContact] = useState('');
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [medicineSearch, setMedicineSearch] = useState('');
  const [showMedicineDropdown, setShowMedicineDropdown] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [prescriptionFile, setPrescriptionFile] = useState<string | null>(null);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Filter medicines based on search
  const filteredMedicines = useMemo(() => {
    if (!medicineSearch) return availableMedicines;
    return availableMedicines.filter(med => 
      med.name.toLowerCase().includes(medicineSearch.toLowerCase())
    );
  }, [medicineSearch]);

  // Handle medicine selection
  const handleMedicineSelect = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setMedicineSearch(medicine.name);
    setShowMedicineDropdown(false);
  };

  // Handle input change
  const handleMedicineInputChange = (value: string) => {
    setMedicineSearch(value);
    // Only clear selection if user is typing new search
    if (value !== selectedMedicine?.name) {
      setSelectedMedicine(null);
    }
    setShowMedicineDropdown(true);
  };

  // Handle input focus
  const handleMedicineInputFocus = () => {
    setShowMedicineDropdown(true);
  };

  // Handle input blur with longer delay to allow click
  const handleMedicineInputBlur = () => {
    setTimeout(() => setShowMedicineDropdown(false), 150);
  };

  // Prevent dropdown close on click
  const handleDropdownMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  // Handle click outside dropdown
  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleAddItem = () => {
    if (!selectedMedicine) return;
    
    const newItem: BillItem = {
      id: Date.now(),
      medicineName: selectedMedicine.name,
      quantity: quantity,
      price: selectedMedicine.price,
      total: selectedMedicine.price * quantity,
    };

    setBillItems([...billItems, newItem]);
    setSelectedMedicine(null);
    setMedicineSearch('');
    setQuantity(1);
  };

  const handleRemoveItem = (id: number) => {
    setBillItems(billItems.filter(item => item.id !== id));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPrescriptionFile(file.name);
    }
  };

  const subtotal = billItems.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = (subtotal * discount) / 100;
  const tax = (subtotal - discountAmount) * 0.1; // 10% tax
  const total = subtotal - discountAmount + tax;

  const handleGenerateInvoice = async () => {
    if (!patientName || billItems.length === 0) {
      alert('Please add patient name and at least one medicine');
      return;
    }
    
    const subtotal = billItems.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = (subtotal * discount) / 100;
    const tax = (subtotal - discountAmount) * 0.1; // 10% tax
    const total = subtotal - discountAmount + tax;
    
    // Generate bill number
    const billNumber = `INV-${Date.now().toString().slice(-6)}`;
    const billDate = new Date().toISOString().split('T')[0];
    
    // Create bill data object
    const billData = {
      billNumber,
      date: billDate,
      patientName,
      patientPhone: patientContact,
      items: billItems.map(item => ({
        medicineName: item.medicineName,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      })),
      subtotal,
      discount,
      tax,
      totalAmount: total,
      paymentMethod: 'Cash'
    };
    
    // Show success message
    alert(`Invoice generated successfully!\nTotal Amount: ₹${total.toFixed(2)}\n\nInvoice has been saved and ready for printing.`);
    
    // Reset form
    setBillItems([]);
    setPatientName('');
    setPatientContact('');
    setDiscount(0);
    setPrescriptionFile(null);
    setMedicineSearch('');
    setSelectedMedicine(null);
  };

  const sendBillViaWhatsApp = async () => {
    if (!patientName || !patientContact || billItems.length === 0) {
      alert('Please add patient name, phone number, and at least one medicine before sending via WhatsApp');
      return;
    }
    
    setIsSendingWhatsApp(true);
    
    try {
      const subtotal = billItems.reduce((sum, item) => sum + item.total, 0);
      const discountAmount = (subtotal * discount) / 100;
      const tax = (subtotal - discountAmount) * 0.1;
      const total = subtotal - discountAmount + tax;
      
      const billData = {
        billNumber: `INV-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString().split('T')[0],
        patientName,
        patientPhone: patientContact,
        items: billItems.map(item => ({
          medicineName: item.medicineName,
          quantity: item.quantity,
          price: item.price,
          total: item.total
        })),
        subtotal,
        discount,
        tax,
        totalAmount: total,
        paymentMethod: 'Cash'
      };
      
      const response = await fetch('http://localhost:3000/api/billing/send-whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          billData,
          patientPhone: patientContact
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(`Bill sent successfully via WhatsApp to ${patientContact}!\nMessage ID: ${result.data.messageId}`);
        
        // Reset form after successful send
        setBillItems([]);
        setPatientName('');
        setPatientContact('');
        setDiscount(0);
        setPrescriptionFile(null);
        setMedicineSearch('');
        setSelectedMedicine(null);
      } else {
        alert(`Failed to send bill via WhatsApp: ${result.error}`);
      }
    } catch (error) {
      console.error('WhatsApp send error:', error);
      alert('Failed to send bill via WhatsApp. Please try again.');
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  const sendBillViaEmail = async () => {
    if (!patientName || !patientContact || billItems.length === 0) {
      alert('Please add patient name, email, and at least one medicine before sending via email');
      return;
    }
    
    setIsSendingEmail(true);
    
    try {
      const subtotal = billItems.reduce((sum, item) => sum + item.total, 0);
      const discountAmount = (subtotal * discount) / 100;
      const tax = (subtotal - discountAmount) * 0.1;
      const total = subtotal - discountAmount + tax;
      
      const billData = {
        billNumber: `INV-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString().split('T')[0],
        patientName,
        patientPhone: patientContact,
        items: billItems.map(item => ({
          medicineName: item.medicineName,
          quantity: item.quantity,
          price: item.price,
          total: item.total
        })),
        subtotal,
        discount,
        tax,
        totalAmount: total,
        paymentMethod: 'Cash'
      };
      
      const response = await fetch('http://localhost:3000/api/billing/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          billData,
          patientEmail: patientContact
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(`Bill email content generated for ${patientContact}!\nBill Number: ${billData.billNumber}`);
      } else {
        alert(`Failed to generate email bill: ${result.error}`);
      }
    } catch (error) {
      console.error('Email bill error:', error);
      alert('Failed to generate email bill. Please try again.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Billing & Invoicing</h1>
        <p className="text-gray-600">Create new bills and generate invoices</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Bill Creation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Information */}
          <Card className="p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Patient Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patientName">Patient Name</Label>
                <Input 
                  id="patientName" 
                  placeholder="John Doe"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patientContact">Contact Number</Label>
                <Input 
                  id="patientContact" 
                  placeholder="+91 98765-43210"
                  value={patientContact}
                  onChange={(e) => setPatientContact(e.target.value)}
                />
              </div>
            </div>
          </Card>

          {/* Upload Prescription */}
          <Card className="p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Upload Prescription (Optional)</h3>
            <div className="flex items-center space-x-4">
              <label 
                htmlFor="prescription" 
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors"
              >
                <Upload className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-700">Choose File</span>
              </label>
              <input 
                id="prescription" 
                type="file" 
                className="hidden"
                onChange={handleFileUpload}
                accept="image/*,.pdf"
              />
              {prescriptionFile && (
                <div className="flex items-center space-x-2 text-sm">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="text-gray-700">{prescriptionFile}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Add Medicines */}
          <Card className="p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Add Medicines</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="medicine">Search Medicine</Label>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input 
                      id="medicine"
                      placeholder="Search medicine..."
                      value={selectedMedicine ? selectedMedicine.name : medicineSearch}
                      onChange={(e) => handleMedicineInputChange(e.target.value)}
                      onFocus={handleMedicineInputFocus}
                      onBlur={handleMedicineInputBlur}
                      className="pl-10 pr-10"
                    />
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  </div>
                  
                  {/* Dropdown for search results */}
                  {showMedicineDropdown && filteredMedicines.length > 0 && (
                    <div 
                      className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
                      onMouseDown={handleDropdownMouseDown}
                      onClick={handleDropdownClick}
                    >
                      {filteredMedicines.map((med) => (
                        <div
                          key={med.id}
                          className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                          onClick={() => {
                            handleMedicineSelect(med);
                            // Close dropdown immediately after selection
                            setShowMedicineDropdown(false);
                          }}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-800">{med.name}</span>
                            <span className="text-sm text-gray-600">₹{med.price.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* No results message */}
                  {showMedicineDropdown && medicineSearch && filteredMedicines.length === 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      <div className="px-3 py-2 text-sm text-gray-500">
                        No medicines found
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input 
                  id="quantity" 
                  type="number" 
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </div>
            </div>
            <Button 
              onClick={handleAddItem}
              disabled={!selectedMedicine}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add to Bill
            </Button>
          </Card>

          {/* Bill Items Table */}
          <Card className="p-5">
            <h3 className="font-semibold text-gray-800 mb-4">Bill Items</h3>
            {billItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Receipt className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No items added yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {billItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{item.medicineName}</p>
                      <p className="text-sm text-gray-600">
                        ₹{item.price.toFixed(2)} × {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-semibold text-gray-800">
                        ₹{item.total.toFixed(2)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column - Bill Summary */}
        <div className="space-y-6">
          <Card className="p-5 sticky top-6">
            <h3 className="font-semibold text-gray-800 mb-4">Bill Summary</h3>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-gray-800">₹{subtotal.toFixed(2)}</span>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="discount">Discount (%)</Label>
                <Input 
                  id="discount" 
                  type="number" 
                  min="0"
                  max="100"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                />
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount ({discount}%):</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax (10%):</span>
                <span className="text-gray-800">₹{tax.toFixed(2)}</span>
              </div>

              <Separator />

              <div className="flex justify-between">
                <span className="font-semibold text-gray-800">Total:</span>
                <span className="text-2xl font-semibold text-blue-600">
                  ₹{total.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-4">
                <Button 
                  onClick={handleGenerateInvoice} 
                  className="bg-blue-600 hover:bg-blue-700 flex-1 min-w-[140px]"
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  Generate Invoice
                </Button>
                <Button 
                  onClick={sendBillViaWhatsApp} 
                  disabled={isSendingWhatsApp}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 flex-1 min-w-[140px]"
                >
                  {isSendingWhatsApp ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-4 h-4 mr-2" />
                      Send via WhatsApp
                    </>
                  )}
                </Button>
                <Button 
                  onClick={sendBillViaEmail} 
                  disabled={isSendingEmail}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 flex-1 min-w-[140px]"
                >
                  {isSendingEmail ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending Email...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send via Email
                    </>
                  )}
                </Button>
              </div>

            <Button variant="outline" className="w-full">
              Save as Draft
            </Button>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> Invoice will be automatically saved and can be printed or shared via email.
              </p>
            </div>
          </Card>

          {/* Quick Stats */}
          <Card className="p-5">
            <h3 className="font-semibold text-gray-800 mb-3">Today's Stats</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Bills Generated</p>
                <p className="text-xl font-semibold text-gray-800">24</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-xl font-semibold text-green-600">₹4,48,460</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
