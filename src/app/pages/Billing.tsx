import {
  useState,
  useMemo,
  useEffect,
  ChangeEvent,
  KeyboardEvent,
  MouseEvent as ReactMouseEvent,
} from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Plus,
  Trash2,
  FileText,
  Upload,
  Receipt,
  MessageCircle,
  Mail,
  Smartphone,
  Search,
  ChevronDown,
  Download,
  Building2,
  Calendar,
  User,
  Phone,
  CreditCard,
  Stethoscope,
  UserCheck,
  CheckCircle,
  Clock,
} from "lucide-react";
import { Separator } from "../components/ui/separator";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

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
  { id: "med1", name: "Paracetamol 500mg", price: 207.5 },
  { id: "med2", name: "Amoxicillin 250mg", price: 415.0 },
  { id: "med3", name: "Ibuprofen 400mg", price: 290.5 },
  { id: "med4", name: "Vitamin D3 1000IU", price: 664.0 },
  { id: "med5", name: "Omeprazole 20mg", price: 373.5 },
  { id: "med6", name: "Aspirin 75mg", price: 124.5 },
  { id: "med7", name: "Metformin 500mg", price: 498.0 },
  { id: "med8", name: "Cetirizine 10mg", price: 166.0 },
];

export function Billing() {
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [patientName, setPatientName] = useState("");
  const [patientContact, setPatientContact] = useState("");
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(
    null,
  );
  const [medicineSearch, setMedicineSearch] = useState("");
  const [showMedicineDropdown, setShowMedicineDropdown] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [prescriptionFile, setPrescriptionFile] = useState<string | null>(null);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Generate invoice data
  const generateInvoiceData = () => {
    const billNumber = `INV-${Date.now().toString().slice(-6)}`;
    const billDate = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    const subtotal = billItems.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = (subtotal * discount) / 100;
    const tax = (subtotal - discountAmount) * 0.1;
    const total = subtotal - discountAmount + tax;

    return {
      billNumber,
      billDate,
      invoiceId: `INV-${Date.now()}`,
      paymentMethod: "Cash",
      doctorName: "Dr. Smith",
      generatedBy: "Admin",
      status: "Paid",
      subtotal,
      discountAmount,
      tax,
      total,
    };
  };

  // Filter medicines based on search
  const filteredMedicines = useMemo(() => {
    if (!medicineSearch || medicineSearch.trim() === "") {
      return availableMedicines;
    }
    return availableMedicines.filter((med) =>
      med.name.toLowerCase().includes(medicineSearch.toLowerCase()),
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
    setTimeout(() => setShowMedicineDropdown(false), 200);
  };

  // Handle dropdown toggle
  const toggleDropdown = () => {
    setShowMedicineDropdown(!showMedicineDropdown);
  };

  const findMedicineBySearch = (search: string): Medicine | null => {
    if (!search || search.trim() === "") return null;
    const match = availableMedicines.find(
      (m) => m.name.toLowerCase() === search.trim().toLowerCase(),
    );
    return match || null;
  };

  const handleMedicineInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddItem();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".medicine-search-container")) {
        setShowMedicineDropdown(false);
      }
    };

    if (showMedicineDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMedicineDropdown]);

  // Prevent dropdown close on click
  const handleDropdownMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Handle click inside dropdown so input blur doesn't close it prematurely
  const handleDropdownClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  const handleAddItem = () => {
    let medicineToAdd = selectedMedicine;

    if (!medicineToAdd) {
      medicineToAdd = findMedicineBySearch(medicineSearch);
      if (!medicineToAdd) {
        if (filteredMedicines.length > 0) {
          medicineToAdd = filteredMedicines[0];
        } else {
          return; // nothing to add
        }
      }
    }

    const newItem: BillItem = {
      id: Date.now(),
      medicineName: medicineToAdd.name,
      quantity: quantity,
      price: medicineToAdd.price,
      total: medicineToAdd.price * quantity,
    };

    setBillItems((prev) => [...prev, newItem]);
    setSelectedMedicine(null);
    setMedicineSearch("");
    setQuantity(1);
    setShowMedicineDropdown(false);
  };

  const handleRemoveItem = (id: number) => {
    setBillItems(billItems.filter((item) => item.id !== id));
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPrescriptionFile(file.name);
    }
  };

  const subtotal = billItems.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = (subtotal * discount) / 100;
  const tax = (subtotal - discountAmount) * 0.1; // 10% tax
  const total = subtotal - discountAmount + tax;

  const generatePDFInvoice = async () => {
    if (!patientName || billItems.length === 0) {
      alert("Please add patient name and at least one medicine");
      return;
    }

    const subtotal = billItems.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = (subtotal * discount) / 100;
    const tax = (subtotal - discountAmount) * 0.1; // 10% tax
    const total = subtotal - discountAmount + tax;

    // Generate bill number
    const billNumber = `INV-${Date.now().toString().slice(-6)}`;
    const billDate = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    // Create PDF with safe settings
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Set up PDF dimensions and margins
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let yPosition = margin;

    // Header
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text("MEDICAL INVOICE", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 12;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text("Smart Medical Management System", pageWidth / 2, yPosition, {
      align: "center",
    });
    yPosition += 15;

    // Bill details
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text("Bill Number: " + billNumber, margin, yPosition);
    yPosition += 7;
    pdf.text("Date: " + billDate, margin, yPosition);
    yPosition += 12;

    // Patient details
    pdf.text("Patient Details:", margin, yPosition);
    yPosition += 7;
    pdf.setFont("helvetica", "normal");
    pdf.text("Name: " + patientName, margin, yPosition);
    yPosition += 6;
    pdf.text("Contact: " + patientContact, margin, yPosition);
    yPosition += 12;

    // Table headers
    pdf.setFont("helvetica", "bold");
    pdf.text("Medicine Details:", margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.text("S.No", margin, yPosition);
    pdf.text("Medicine Name", margin + 25, yPosition);
    pdf.text("Qty", margin + 120, yPosition);
    pdf.text("Price", margin + 160, yPosition);
    pdf.text("Total", margin + 190, yPosition);
    yPosition += 6;

    // Draw line under header
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 7;

    // Table data - Safe rendering
    pdf.setFont("helvetica", "normal");
    billItems.forEach((item, index) => {
      if (yPosition > 240) {
        pdf.addPage();
        yPosition = margin;
      }

      // Serial number
      pdf.text(String(index + 1), margin, yPosition);

      // Medicine name
      pdf.text(String(item.medicineName), margin + 25, yPosition);

      // Quantity (center aligned)
      const quantityStr = String(item.quantity);
      const quantityWidth = pdf.getTextWidth(quantityStr);
      pdf.text(quantityStr, margin + 120 - quantityWidth / 2, yPosition);

      // Price (right aligned) - Safe ASCII formatting
      const priceStr = "INR " + Number(item.price).toFixed(2);
      const priceWidth = pdf.getTextWidth(priceStr);
      pdf.text(priceStr, margin + 170 - priceWidth, yPosition);

      // Total (right aligned) - Safe ASCII formatting
      const totalStr = "INR " + Number(item.total).toFixed(2);
      const totalWidth = pdf.getTextWidth(totalStr);
      pdf.text(totalStr, margin + 200 - totalWidth, yPosition);

      yPosition += 6;
    });

    // Draw line after items
    yPosition += 5;
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Summary - Safe rendering
    pdf.setFont("helvetica", "bold");
    pdf.text("Summary:", margin, yPosition);
    yPosition += 8;

    pdf.setFont("helvetica", "normal");

    // Subtotal
    const subtotalStr = "Subtotal: INR " + Number(subtotal).toFixed(2);
    const subtotalWidth = pdf.getTextWidth(subtotalStr);
    pdf.text(subtotalStr, margin + 190 - subtotalWidth, yPosition);
    yPosition += 6;

    // Discount
    const discountStr =
      "Discount (" +
      Number(discount).toFixed(0) +
      "%): INR " +
      Number(discountAmount).toFixed(2);
    const discountWidth = pdf.getTextWidth(discountStr);
    pdf.text(discountStr, margin + 190 - discountWidth, yPosition);
    yPosition += 6;

    // Tax
    const taxStr = "Tax (10%): INR " + Number(tax).toFixed(2);
    const taxWidth = pdf.getTextWidth(taxStr);
    pdf.text(taxStr, margin + 190 - taxWidth, yPosition);
    yPosition += 6;

    // Total Amount
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    const totalStr = "Total Amount: INR " + Number(total).toFixed(2);
    const totalWidth = pdf.getTextWidth(totalStr);
    pdf.text(totalStr, margin + 190 - totalWidth, yPosition);
    yPosition += 12;

    // Footer
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text(
      "Thank you for choosing our medical services!",
      pageWidth / 2,
      yPosition,
      { align: "center" },
    );
    yPosition += 6;
    pdf.text(
      "This is a computer-generated invoice.",
      pageWidth / 2,
      yPosition,
      { align: "center" },
    );

    // Save PDF
    const fileName =
      "Invoice_" + billNumber + "_" + patientName.replace(/\s+/g, "_") + ".pdf";
    pdf.save(fileName);

    // Show success message
    alert(
      "Invoice generated successfully!\nBill Number: " +
        billNumber +
        "\nTotal Amount: INR " +
        Number(total).toFixed(2) +
        "\n\nPDF downloaded successfully!",
    );

    // Reset form
    setBillItems([]);
    setPatientName("");
    setPatientContact("");
    setDiscount(0);
    setPrescriptionFile(null);
    setMedicineSearch("");
    setSelectedMedicine(null);
  };

  const sendBillViaWhatsApp = async () => {
    if (!patientName || !patientContact || billItems.length === 0) {
      alert(
        "Please add patient name, phone number, and at least one medicine before sending via WhatsApp",
      );
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
        date: new Date().toISOString().split("T")[0],
        patientName,
        patientPhone: patientContact,
        items: billItems.map((item) => ({
          medicineName: item.medicineName,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        })),
        subtotal,
        discount,
        tax,
        totalAmount: total,
        paymentMethod: "Cash",
      };

      const response = await fetch(
        "http://localhost:3000/api/billing/send-whatsapp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: JSON.stringify({
            billData,
            patientPhone: patientContact,
          }),
        },
      );

      const result = await response.json();

      if (result.success) {
        alert(
          `Bill sent successfully via WhatsApp to ${patientContact}!\nMessage ID: ${result.data.messageId}`,
        );

        // Reset form after successful send
        setBillItems([]);
        setPatientName("");
        setPatientContact("");
        setDiscount(0);
        setPrescriptionFile(null);
        setMedicineSearch("");
        setSelectedMedicine(null);
      } else {
        alert(`Failed to send bill via WhatsApp: ${result.error}`);
      }
    } catch (error) {
      console.error("WhatsApp send error:", error);
      alert("Failed to send bill via WhatsApp. Please try again.");
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  const sendBillViaEmail = async () => {
    if (!patientName || !patientContact || billItems.length === 0) {
      alert(
        "Please add patient name, email, and at least one medicine before sending via email",
      );
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
        date: new Date().toISOString().split("T")[0],
        patientName,
        patientPhone: patientContact,
        items: billItems.map((item) => ({
          medicineName: item.medicineName,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        })),
        subtotal,
        discount,
        tax,
        totalAmount: total,
        paymentMethod: "Cash",
      };

      const response = await fetch(
        "http://localhost:3000/api/billing/send-email",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
          body: JSON.stringify({
            billData,
            patientEmail: patientContact,
          }),
        },
      );

      const result = await response.json();

      if (result.success) {
        alert(
          `Bill email content generated for ${patientContact}!\nBill Number: ${billData.billNumber}`,
        );
      } else {
        alert(`Failed to generate email bill: ${result.error}`);
      }
    } catch (error) {
      console.error("Email bill error:", error);
      alert("Failed to generate email bill. Please try again.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-4 sm:py-8"
      style={{ overflowX: "hidden" }}
    >
      <div
        className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8"
        style={{
          maxWidth: "1400px",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Billing & Invoicing
          </h1>
          <p className="text-sm sm:text-base text-gray-600 px-2">
            Create professional medical invoices
          </p>
        </div>

        <div
          className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"
          style={{ maxWidth: "100%", overflow: "hidden" }}
        >
          {/* Left Column - Bill Creation */}
          <div
            className="xl:col-span-2 space-y-4 sm:space-y-6"
            style={{ maxWidth: "100%", overflow: "visible" }}
          >
            {/* Patient Information */}
            <Card
              className="p-4 sm:p-6 shadow-lg border-0 bg-white"
              style={{
                maxWidth: "100%",
                overflow: "visible",
                boxSizing: "border-box",
              }}
            >
              <div className="flex items-center mb-4 sm:mb-6">
                <User className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                  Patient Information
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="patientName"
                    className="text-sm font-medium text-gray-700"
                  >
                    Patient Name
                  </Label>
                  <Input
                    id="patientName"
                    placeholder="John Doe"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="h-10 sm:h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="patientContact"
                    className="text-sm font-medium text-gray-700"
                  >
                    Contact Number
                  </Label>
                  <Input
                    id="patientContact"
                    placeholder="+91 98765-43210"
                    value={patientContact}
                    onChange={(e) => setPatientContact(e.target.value)}
                    className="h-10 sm:h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base"
                  />
                </div>
              </div>
            </Card>

            {/* Upload Prescription */}
            <Card
              className="p-4 sm:p-6 shadow-lg border-0 bg-white"
              style={{
                maxWidth: "100%",
                overflow: "hidden",
                boxSizing: "border-box",
              }}
            >
              <div className="flex items-center mb-4 sm:mb-6">
                <FileText className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                  Upload Prescription (Optional)
                </h3>
              </div>
              <div
                className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4"
                style={{ overflow: "hidden" }}
              >
                <label
                  htmlFor="prescription"
                  className="flex items-center space-x-2 px-4 py-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer transition-colors flex-shrink-0"
                >
                  <Upload className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">
                    Choose File
                  </span>
                </label>
                <input
                  id="prescription"
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept="image/*,.pdf"
                />
                {prescriptionFile && (
                  <div
                    className="flex items-center space-x-2 text-sm bg-green-50 px-3 py-2 rounded-lg flex-shrink-0"
                    style={{ overflow: "hidden" }}
                  >
                    <FileText className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span
                      className="text-green-700 truncate"
                      style={{
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                      }}
                    >
                      {prescriptionFile}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {/* Add Medicines */}
            <Card
              className="p-4 sm:p-6 shadow-lg border-0 bg-white"
              style={{
                maxWidth: "100%",
                overflow: "hidden",
                boxSizing: "border-box",
              }}
            >
              <div className="flex items-center mb-4 sm:mb-6">
                <Plus className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                  Add Medicines
                </h3>
              </div>
              <div
                className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6"
                style={{ maxWidth: "100%", overflow: "hidden" }}
              >
                <div className="space-y-2 lg:col-span-2">
                  <Label
                    htmlFor="medicine"
                    className="text-sm font-medium text-gray-700"
                  >
                    Search Medicine
                  </Label>
                  <div className="relative medicine-search-container">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                    <Input
                      id="medicine"
                      placeholder="Type medicine name..."
                      value={medicineSearch}
                      onChange={(e) =>
                        handleMedicineInputChange(e.target.value)
                      }
                      onFocus={handleMedicineInputFocus}
                      onBlur={handleMedicineInputBlur}
                      onKeyDown={handleMedicineInputKeyDown}
                      className="pl-10 pr-10 h-10 sm:h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base"
                    />
                    <ChevronDown
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 cursor-pointer"
                      onClick={() =>
                        setShowMedicineDropdown(!showMedicineDropdown)
                      }
                    />

                    {/* Medicine Dropdown */}
                    {showMedicineDropdown && (
                      <div
                        className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999] max-h-60 overflow-y-auto"
                        onMouseDown={handleDropdownMouseDown}
                        onClick={handleDropdownClick}
                      >
                        {filteredMedicines.length > 0 ? (
                          filteredMedicines.map((med) => (
                            <div
                              key={med.id}
                              className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                              onClick={() => handleMedicineSelect(med)}
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-800">
                                  {med.name}
                                </span>
                                <span className="text-sm font-bold text-blue-600">
                                  ₹{med.price.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-gray-500">
                            {medicineSearch
                              ? "No medicines found"
                              : "Type to search medicines"}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="quantity"
                    className="text-sm font-medium text-gray-700"
                  >
                    Quantity
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="h-10 sm:h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base"
                  />
                </div>
              </div>
              <Button
                onClick={handleAddItem}
                disabled={
                  !(
                    selectedMedicine ||
                    findMedicineBySearch(medicineSearch) ||
                    filteredMedicines.length > 0
                  )
                }
                className="w-full bg-blue-600 hover:bg-blue-700 h-10 sm:h-11 font-medium text-sm sm:text-base"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add to Bill
              </Button>
            </Card>

            {/* Bill Items Table */}
            {billItems.length > 0 && (
              <Card
                className="p-4 sm:p-6 shadow-lg border-0 bg-white"
                style={{
                  maxWidth: "100%",
                  overflow: "hidden",
                  boxSizing: "border-box",
                }}
              >
                <div className="flex items-center mb-4 sm:mb-6">
                  <Receipt className="w-5 h-5 text-blue-600 mr-2" />
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                    Bill Items
                  </h3>
                </div>
                <div
                  className="overflow-x-auto"
                  style={{ borderRadius: "8px" }}
                >
                  <table
                    className="w-full min-w-[500px]"
                    style={{
                      tableLayout: "fixed",
                      borderCollapse: "collapse",
                      fontSize: "13px",
                      lineHeight: "1.5",
                    }}
                  >
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th
                          className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700"
                          style={{ width: "8%" }}
                        >
                          S.No
                        </th>
                        <th
                          className="text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700"
                          style={{ width: "42%" }}
                        >
                          Medicine Name
                        </th>
                        <th
                          className="text-center py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700"
                          style={{ width: "15%" }}
                        >
                          Qty
                        </th>
                        <th
                          className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700"
                          style={{ width: "17.5%" }}
                        >
                          Unit Price
                        </th>
                        <th
                          className="text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-gray-700"
                          style={{ width: "17.5%" }}
                        >
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {billItems.map((item, index) => (
                        <tr
                          key={item.id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-gray-600">
                            {index + 1}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4">
                            <div
                              className="text-xs sm:text-sm font-medium text-gray-900"
                              style={{
                                wordBreak: "break-word",
                                overflowWrap: "break-word",
                                maxWidth: "100%",
                              }}
                            >
                              {item.medicineName}
                            </div>
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 text-center text-xs sm:text-sm text-gray-600">
                            {item.quantity}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 text-right text-xs sm:text-sm text-gray-600">
                            ₹{item.price.toFixed(2)}
                          </td>
                          <td className="py-2 sm:py-3 px-2 sm:px-4 text-right text-xs sm:text-sm font-medium text-gray-900">
                            ₹{item.total.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>

          {/* Right Column - Bill Summary */}
          <div
            className="space-y-4 sm:space-y-6"
            style={{ maxWidth: "100%", overflow: "hidden" }}
          >
            <Card
              className="p-4 sm:p-5 sticky top-6"
              style={{
                maxWidth: "100%",
                overflow: "hidden",
                boxSizing: "border-box",
              }}
            >
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">
                Bill Summary
              </h3>

              <div
                className="space-y-3 pt-4 border-t border-gray-200"
                style={{
                  maxWidth: "100%",
                  overflow: "hidden",
                  boxSizing: "border-box",
                }}
              >
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="discount"
                    className="text-sm font-medium text-gray-700"
                  >
                    Discount (%)
                  </Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="h-10 sm:h-11 text-sm sm:text-base"
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

                <div className="flex justify-between pt-3 border-t border-gray-200">
                  <span className="text-lg sm:text-xl font-bold text-gray-900">
                    Total:
                  </span>
                  <span className="text-xl sm:text-2xl font-bold text-blue-600">
                    ₹{total.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-wrap gap-2 sm:gap-3 pt-4">
                <Button
                  onClick={generatePDFInvoice}
                  className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 h-10 sm:h-11 font-medium text-sm sm:text-base min-w-[120px]"
                  disabled={!patientName || billItems.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Generate Invoice
                </Button>
                <Button
                  onClick={sendBillViaWhatsApp}
                  disabled={
                    isSendingWhatsApp || !patientName || billItems.length === 0
                  }
                  className="w-full sm:flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 h-10 sm:h-11 font-medium text-sm sm:text-base min-w-[120px]"
                >
                  {isSendingWhatsApp ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      WhatsApp
                    </>
                  )}
                </Button>
                <Button
                  onClick={sendBillViaEmail}
                  disabled={
                    isSendingEmail || !patientName || billItems.length === 0
                  }
                  className="w-full sm:flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 h-10 sm:h-11 font-medium text-sm sm:text-base min-w-[120px]"
                >
                  {isSendingEmail ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </>
                  )}
                </Button>
              </div>

              <Button
                variant="outline"
                className="w-full h-10 sm:h-11 text-sm sm:text-base"
              >
                Save as Draft
              </Button>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> Invoice will be automatically saved and
                  can be printed or shared via email.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
