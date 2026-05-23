import {
  useState,
  useMemo,
  useEffect,
  ChangeEvent,
  KeyboardEvent,
  MouseEvent as ReactMouseEvent,
} from "react";
import { useLocation } from "react-router";
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

interface PendingBillMedicine {
  transferId?: string;
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

const elevatedCardClass =
  "rounded-2xl border border-white/70 bg-gradient-to-br from-white via-white to-blue-50/70 shadow-[0_18px_45px_rgba(15,23,42,0.10)] backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_rgba(37,99,235,0.16)]";
const summaryCardClass =
  "rounded-2xl border border-white/70 bg-gradient-to-br from-white via-blue-50/80 to-indigo-50/80 shadow-[0_22px_55px_rgba(15,23,42,0.14)] backdrop-blur transition-all duration-300";
const softPanelClass =
  "rounded-2xl border border-blue-100/80 bg-gradient-to-br from-blue-50 via-white to-cyan-50 shadow-inner";

export function Billing() {
  const location = useLocation();
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

  const normalizeMedicineName = (name: string) =>
    name.toLowerCase().replace(/\s+/g, " ").trim();

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

  const findMedicineBySearch = (search: string): Medicine | null => {
    if (!search || search.trim() === "") return null;
    const normalizedSearch = normalizeMedicineName(search);
    const match = availableMedicines.find(
      (m) =>
        normalizeMedicineName(m.name) === normalizedSearch ||
        normalizeMedicineName(m.name).includes(normalizedSearch) ||
        normalizedSearch.includes(normalizeMedicineName(m.name)),
    );
    return match || null;
  };

  const addMedicineToBill = (medicine: Medicine, itemQuantity = quantity) => {
    const safeQuantity = Math.max(1, Number(itemQuantity) || 1);
    const newItem: BillItem = {
      id: Date.now(),
      medicineName: medicine.name,
      quantity: safeQuantity,
      price: medicine.price,
      total: medicine.price * safeQuantity,
    };

    setBillItems((prev) => [...prev, newItem]);
    setSelectedMedicine(null);
    setMedicineSearch("");
    setQuantity(1);
    setShowMedicineDropdown(false);
  };

  useEffect(() => {
    const stateMedicine = (
      location.state as { medicine?: PendingBillMedicine } | null
    )?.medicine;
    const storedMedicine = localStorage.getItem("pendingBillMedicine");
    let storedPendingMedicine: PendingBillMedicine | null = null;

    if (storedMedicine) {
      try {
        storedPendingMedicine = JSON.parse(storedMedicine) as PendingBillMedicine;
      } catch {
        localStorage.removeItem("pendingBillMedicine");
      }
    }

    const pendingMedicine = stateMedicine || storedPendingMedicine;

    if (!pendingMedicine?.name) return;

    const transferId =
      pendingMedicine.transferId ||
      `${pendingMedicine.name}-${pendingMedicine.price}`;
    const processedTransferId = sessionStorage.getItem(
      "processedBillMedicineTransfer",
    );

    if (processedTransferId === transferId) {
      localStorage.removeItem("pendingBillMedicine");
      return;
    }

    const matchedMedicine = findMedicineBySearch(pendingMedicine.name);
    addMedicineToBill(
      matchedMedicine || {
        id: `ai-${Date.now()}`,
        name: pendingMedicine.name,
        price: Number(pendingMedicine.price) || 0,
      },
      1,
    );
    sessionStorage.setItem("processedBillMedicineTransfer", transferId);
    localStorage.removeItem("pendingBillMedicine");
  }, [location.state]);

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

    addMedicineToBill(medicineToAdd);
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
  const invoicePatientName = patientName.trim() || "Walk-in Patient";
  const contactValue = patientContact.trim();
  const invoicePatientContact = contactValue || "Not provided";
  const isEmailContact = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactValue);
  const isPhoneContact =
    /^[+\d\s()-]+$/.test(contactValue) &&
    contactValue.replace(/\D/g, "").length >= 10 &&
    contactValue.replace(/\D/g, "").length <= 15;

  const generatePDFInvoice = async () => {
    if (billItems.length === 0) {
      alert("Please add at least one medicine before generating invoice");
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
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentRight = pageWidth - margin;
    const medicineX = margin + 25;
    const qtyX = contentRight - 68;
    const priceX = contentRight - 34;
    const totalX = contentRight;
    const medicineMaxWidth = qtyX - medicineX - 10;
    let yPosition = margin;

    const formatCurrency = (value: number) => `INR ${Number(value).toFixed(2)}`;

    const addPageIfNeeded = (requiredHeight = 10) => {
      if (yPosition + requiredHeight > pageHeight - margin) {
        pdf.addPage();
        yPosition = margin;
      }
    };

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
    pdf.text("Name: " + invoicePatientName, margin, yPosition);
    yPosition += 6;
    pdf.text("Contact: " + invoicePatientContact, margin, yPosition);
    yPosition += 12;

    // Table headers
    pdf.setFont("helvetica", "bold");
    pdf.text("Medicine Details:", margin, yPosition);
    yPosition += 8;

    pdf.setFontSize(10);
    pdf.text("S.No", margin, yPosition);
    pdf.text("Medicine Name", margin + 25, yPosition);
    pdf.text("Qty", qtyX, yPosition, { align: "center" });
    pdf.text("Price", priceX, yPosition, { align: "right" });
    pdf.text("Total", totalX, yPosition, { align: "right" });
    yPosition += 6;

    // Draw line under header
    pdf.line(margin, yPosition, contentRight, yPosition);
    yPosition += 7;

    // Table data - Safe rendering
    pdf.setFont("helvetica", "normal");
    billItems.forEach((item, index) => {
      const medicineLines = pdf.splitTextToSize(
        String(item.medicineName),
        medicineMaxWidth,
      );
      const rowHeight = Math.max(7, medicineLines.length * 5);
      addPageIfNeeded(rowHeight + 4);

      // Serial number
      pdf.text(String(index + 1), margin, yPosition);

      // Medicine name
      pdf.text(medicineLines, medicineX, yPosition);

      // Quantity (center aligned)
      pdf.text(String(item.quantity), qtyX, yPosition, { align: "center" });

      // Price (right aligned) - Safe ASCII formatting
      pdf.text(formatCurrency(item.price), priceX, yPosition, {
        align: "right",
      });

      // Total (right aligned) - Safe ASCII formatting
      pdf.text(formatCurrency(item.total), totalX, yPosition, {
        align: "right",
      });

      yPosition += rowHeight;
    });

    // Draw line after items
    yPosition += 5;
    pdf.line(margin, yPosition, contentRight, yPosition);
    yPosition += 10;
    addPageIfNeeded(40);

    // Summary - Safe rendering
    pdf.setFont("helvetica", "bold");
    pdf.text("Summary:", margin, yPosition);
    yPosition += 8;

    pdf.setFont("helvetica", "normal");

    // Subtotal
    const subtotalStr = "Subtotal: " + formatCurrency(subtotal);
    pdf.text(subtotalStr, contentRight, yPosition, { align: "right" });
    yPosition += 6;

    // Discount
    const discountStr =
      "Discount (" +
      Number(discount).toFixed(0) +
      "%): " +
      formatCurrency(discountAmount);
    pdf.text(discountStr, contentRight, yPosition, { align: "right" });
    yPosition += 6;

    // Tax
    const taxStr = "Tax (10%): " + formatCurrency(tax);
    pdf.text(taxStr, contentRight, yPosition, { align: "right" });
    yPosition += 6;

    // Total Amount
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    const totalStr = "Total Amount: " + formatCurrency(total);
    pdf.text(totalStr, contentRight, yPosition, { align: "right" });
    yPosition += 12;

    // Footer
    addPageIfNeeded(14);
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
      "Invoice_" +
      billNumber +
      "_" +
      invoicePatientName.replace(/\s+/g, "_") +
      ".pdf";
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
    if (!isPhoneContact || billItems.length === 0) {
      alert(
        "Please add a phone number and at least one medicine before sending via WhatsApp",
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
        patientName: invoicePatientName,
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
    if (!isEmailContact || billItems.length === 0) {
      alert(
        "Please add an email address and at least one medicine before sending via email",
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
        patientName: invoicePatientName,
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
      className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_34%),linear-gradient(135deg,#f8fbff_0%,#eef6ff_45%,#f7f7ff_100%)] py-4 sm:py-8"
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
          style={{ maxWidth: "100%", overflow: "visible" }}
        >
          {/* Left Column - Bill Creation */}
          <div
            className="xl:col-span-2 space-y-4 sm:space-y-6"
            style={{ maxWidth: "100%", overflow: "visible" }}
          >
            {/* Patient Information */}
            <Card
              className={`p-4 sm:p-6 ${elevatedCardClass}`}
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
                    Phone Number or Email
                  </Label>
                  <Input
                    id="patientContact"
                    placeholder="+91 98765-43210 or patient@gmail.com"
                    value={patientContact}
                    onChange={(e) => setPatientContact(e.target.value)}
                    className="h-10 sm:h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base"
                  />
                </div>
              </div>
            </Card>

            {/* Upload Prescription */}
            <Card
              className={`p-4 sm:p-6 ${elevatedCardClass}`}
              style={{
                maxWidth: "100%",
                overflow: "visible",
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
                  className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 border border-blue-200 rounded-2xl cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md flex-shrink-0"
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
                    className="flex items-center space-x-2 text-sm bg-gradient-to-r from-green-50 to-emerald-50 px-3 py-2 rounded-2xl shadow-inner flex-shrink-0"
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
              className={`p-4 sm:p-6 ${elevatedCardClass}`}
              style={{
                maxWidth: "100%",
                overflow: "visible",
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
                style={{ maxWidth: "100%", overflow: "visible" }}
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
                    <button
                      type="button"
                      aria-label="Show medicines"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() =>
                        setShowMedicineDropdown((isOpen) => !isOpen)
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-600"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>

                    {/* Medicine Dropdown */}
                    {showMedicineDropdown && (
                      <div
                        className="absolute top-full left-0 right-0 mt-2 bg-white/95 border border-blue-100 rounded-2xl shadow-[0_20px_45px_rgba(15,23,42,0.16)] backdrop-blur z-[9999] max-h-60 overflow-y-auto"
                        onClick={handleDropdownClick}
                      >
                        {filteredMedicines.length > 0 ? (
                          filteredMedicines.map((med) => (
                            <div
                              key={med.id}
                              className="px-4 py-3 hover:bg-blue-50/80 cursor-pointer border-b border-blue-50 last:border-b-0 transition-colors"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleMedicineSelect(med);
                              }}
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
                className={`p-4 sm:p-6 ${elevatedCardClass}`}
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
              className={`p-4 sm:p-5 sticky top-6 ${summaryCardClass}`}
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
                  className="w-full sm:flex-1 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-600/25 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-600/30 h-10 sm:h-11 font-medium text-sm sm:text-base min-w-[120px] transition-all duration-300"
                  disabled={billItems.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Generate Invoice
                </Button>
                {isPhoneContact && (
                  <Button
                    onClick={sendBillViaWhatsApp}
                    disabled={isSendingWhatsApp || billItems.length === 0}
                    className="w-full sm:flex-1 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-green-400 disabled:to-emerald-400 shadow-lg shadow-green-600/25 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-green-600/30 h-10 sm:h-11 font-medium text-sm sm:text-base min-w-[120px] transition-all duration-300"
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
                )}
                {isEmailContact && (
                  <Button
                    onClick={sendBillViaEmail}
                    disabled={isSendingEmail || billItems.length === 0}
                    className="w-full sm:flex-1 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 disabled:from-purple-400 disabled:to-fuchsia-400 shadow-lg shadow-purple-600/25 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-purple-600/30 h-10 sm:h-11 font-medium text-sm sm:text-base min-w-[120px] transition-all duration-300"
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
                )}
              </div>

              <Button
                variant="outline"
                className="w-full h-10 sm:h-11 rounded-2xl border-blue-100 bg-white/70 text-sm sm:text-base shadow-sm backdrop-blur hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-md transition-all duration-300"
              >
                Save as Draft
              </Button>

              <div className={`mt-4 p-3 ${softPanelClass}`}>
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
