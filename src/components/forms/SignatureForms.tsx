'use client';

import { useRef, useEffect, useState } from 'react';
import SignaturePad from 'signature_pad';
import type { WCOrder, WCLineItem } from '@/types';
import { formatPrice } from '@/utils/helpers';
import { uploadFile, addOrderNote } from '@/utils/api';
import { useLoader } from '@/components/ui/Loader';

interface SignatureFormsProps {
  order: WCOrder;
  orderId: string;
  storeId: string;
  onSuccess?: () => void;
}

export function SignatureForms({ order, orderId, storeId, onSuccess }: SignatureFormsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeForm, setActiveForm] = useState<'delivery' | 'repair' | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [repairDescription, setRepairDescription] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);
  const { show: showLoader, hide: hideLoader } = useLoader();

  const companyName = storeId === '2' ? 'נלה רהיטים בע"מ' : 'בלאנו';
  const customerName = `${order.billing.first_name} ${order.billing.last_name}`;
  const phone = order.billing.phone;
  const address = order.shipping.address_1;

  useEffect(() => {
    if (canvasRef.current && activeForm) {
      signaturePadRef.current = new SignaturePad(canvasRef.current, {
        backgroundColor: 'rgb(250, 250, 250)',
      });

      // Resize canvas
      const resizeCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
          const ratio = Math.max(window.devicePixelRatio || 1, 1);
          canvas.width = canvas.offsetWidth * ratio;
          canvas.height = canvas.offsetHeight * ratio;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.scale(ratio, ratio);
          }
          signaturePadRef.current?.clear();
        }
      };

      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);

      return () => {
        window.removeEventListener('resize', resizeCanvas);
      };
    }
  }, [activeForm]);

  const clearSignature = () => {
    signaturePadRef.current?.clear();
  };

  const closeForm = () => {
    setActiveForm(null);
    setIsFullscreen(false);
    signaturePadRef.current = null;
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const generatePDF = async (type: 'delivery' | 'repair'): Promise<Blob> => {
    // In a real implementation, you would use a PDF library
    // For now, we'll create a simple canvas-based image
    const signatureData = signaturePadRef.current?.toDataURL();
    
    // Create a simple HTML representation as a Blob
    const htmlContent = `
      <html dir="rtl">
        <head><meta charset="UTF-8"><title>טופס ${type === 'delivery' ? 'משלוח' : 'תיקון'}</title></head>
        <body>
          <h1>${type === 'delivery' ? 'תעודת משלוח ואחריות' : 'טופס תיקון'}</h1>
          <p>שם: ${customerName}</p>
          <p>טלפון: ${phone}</p>
          <p>כתובת: ${address}</p>
          ${type === 'repair' ? `<p>תיאור: ${repairDescription}</p>` : ''}
          <img src="${signatureData}" style="max-width: 300px" />
        </body>
      </html>
    `;
    
    return new Blob([htmlContent], { type: 'text/html' });
  };

  const submitDeliveryForm = async () => {
    if (signaturePadRef.current?.isEmpty()) {
      alert('נא לחתום על הטופס');
      return;
    }

    try {
      showLoader('שומר טופס...');
      
      const pdfBlob = await generatePDF('delivery');
      const file = new File([pdfBlob], `delivery_form_${orderId}.html`, { type: 'text/html' });
      
      const uploadResult = await uploadFile(file, orderId, storeId);
      
      if (uploadResult.success && uploadResult.fileUrl) {
        await addOrderNote(
          orderId,
          storeId,
          `טופס משלוח חתום: <a href="${uploadResult.fileUrl}" target="_blank">צפה בטופס</a>`,
          true
        );
        
        alert('הטופס נשמר ונשלח בהצלחה');
        closeForm();
        setIsModalOpen(false);
        onSuccess?.();
      } else {
        throw new Error(uploadResult.message || 'שגיאה בהעלאת הטופס');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('אירעה שגיאה: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      hideLoader();
    }
  };

  const submitRepairForm = async () => {
    if (signaturePadRef.current?.isEmpty()) {
      alert('נא לחתום על הטופס');
      return;
    }

    if (!repairDescription.trim()) {
      alert('נא למלא תיאור התיקון');
      return;
    }

    try {
      showLoader('שומר טופס...');
      
      const pdfBlob = await generatePDF('repair');
      const file = new File([pdfBlob], `repair_form_${orderId}.html`, { type: 'text/html' });
      
      const uploadResult = await uploadFile(file, orderId, storeId);
      
      if (uploadResult.success && uploadResult.fileUrl) {
        await addOrderNote(
          orderId,
          storeId,
          `טופס תיקון חתום: <a href="${uploadResult.fileUrl}" target="_blank">צפה בטופס</a>`,
          true
        );
        
        alert('הטופס נשמר ונשלח בהצלחה');
        closeForm();
        setIsModalOpen(false);
        onSuccess?.();
      } else {
        throw new Error(uploadResult.message || 'שגיאה בהעלאת הטופס');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('אירעה שגיאה: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      hideLoader();
    }
  };

  const renderOrderItems = () => (
    <div className="space-y-2">
      {order.line_items.map((item) => (
        <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
          <span className="font-medium">{item.name}</span>
          <span className="text-gray-600">כמות: {item.quantity}</span>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        טפסי חתימה
      </button>

      {/* Modal */}
      {isModalOpen && !activeForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">טפסי חתימה</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <button
                onClick={() => setActiveForm('delivery')}
                className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700"
              >
                טופס תעודת משלוח ואחריות
              </button>
              <button
                onClick={() => setActiveForm('repair')}
                className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700"
              >
                טופס תיקון
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Form */}
      {activeForm === 'delivery' && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="max-w-3xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">תעודת משלוח ואחריות</h2>
              <button onClick={closeForm} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Customer Details */}
              <div className="border-b pb-4">
                <h3 className="text-xl font-semibold mb-3">פרטי לקוח</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600">שם מלא</p>
                    <p className="font-medium">{customerName}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">טלפון</p>
                    <p className="font-medium">{phone}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-600">כתובת</p>
                    <p className="font-medium">{address}</p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="border-b pb-4">
                <h3 className="text-xl font-semibold mb-3">פרטי הזמנה</h3>
                {renderOrderItems()}
              </div>

              {/* Declaration */}
              <div className="border-b pb-4">
                <p className="text-red-600 font-bold text-lg leading-relaxed">
                  אני החתום מטה, מאשר זאת שקיבלתי את המוצר שרכשתי מחברת {companyName}
                  במצב תקין ולשביעות רצוני המלאה. אני מודע/ת שלאחר חתימתי זו, לא תהיה לי אפשרות
                  להחזיר את המוצר או לדרוש החזר כספי, למעט מקרים של תקלה טכנית או פגם ייצור שהתגלו לאחר החתימה.
                </p>
              </div>

              {/* Signature */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-gray-600">חתימת הלקוח:</p>
                  <button
                    onClick={toggleFullscreen}
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                    </svg>
                    הגדל אזור חתימה
                  </button>
                </div>
                <canvas
                  ref={canvasRef}
                  className={`border-2 border-gray-300 rounded-lg w-full bg-gray-50 hover:border-blue-400 transition-colors ${
                    isFullscreen ? 'h-96' : 'h-64'
                  }`}
                />
                <button
                  onClick={clearSignature}
                  className="mt-2 text-gray-600 hover:text-gray-800 flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  נקה חתימה
                </button>
              </div>

              <button
                onClick={submitDeliveryForm}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium"
              >
                שלח טופס
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Repair Form */}
      {activeForm === 'repair' && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
          <div className="max-w-3xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">טופס תיקון</h2>
              <button onClick={closeForm} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Customer Details */}
              <div className="border-b pb-4">
                <h3 className="text-xl font-semibold mb-3">פרטי לקוח</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600">שם מלא</p>
                    <p className="font-medium">{customerName}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">טלפון</p>
                    <p className="font-medium">{phone}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-600">כתובת</p>
                    <p className="font-medium">{address}</p>
                  </div>
                </div>
              </div>

              {/* Repair Description */}
              <div className="border-b pb-4">
                <h3 className="text-xl font-semibold mb-3">פרטי התיקון</h3>
                <textarea
                  value={repairDescription}
                  onChange={(e) => setRepairDescription(e.target.value)}
                  className="w-full h-32 p-3 border rounded-lg resize-none"
                  placeholder="תיאור התיקון הנדרש..."
                />
              </div>

              {/* Declaration */}
              <div className="border-b pb-4">
                <p className="text-red-600 font-bold text-lg">
                  אני מאשר/ת כי ידוע לי שתהליך תיקון המוצר עשוי להימשך עד 14 ימי עסקים.
                </p>
              </div>

              {/* Signature */}
              <div>
                <p className="text-gray-600 mb-2">חתימת הלקוח:</p>
                <canvas
                  ref={canvasRef}
                  className={`border-2 border-gray-300 rounded-lg w-full bg-gray-50 hover:border-blue-400 transition-colors ${
                    isFullscreen ? 'h-96' : 'h-64'
                  }`}
                />
                <button
                  onClick={clearSignature}
                  className="mt-2 text-gray-600 hover:text-gray-800 flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  נקה חתימה
                </button>
              </div>

              <button
                onClick={submitRepairForm}
                className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium"
              >
                שלח טופס
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
