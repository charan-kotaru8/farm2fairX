import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { CheckCircle2, ChevronRight, ArrowLeft } from 'lucide-react';

const STEPS = [
  { id: 1, name: 'Crop Selection' },
  { id: 2, name: 'Quantity & Quality' },
  { id: 3, name: 'Availability' },
  { id: 4, name: 'Review' }
];

export default function LotCreationForm() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    crop_id: '',
    quantity: '',
    quality_grade: 'A',
    harvest_date: '',
    available_from: '',
    available_until: '',
    storage_required: false,
    description: ''
  });

  useEffect(() => {
    api.getCrops().then(setCrops).catch(console.error);
  }, []);

  const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  const handlePrev = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.createLot({
        ...formData,
        quantity: parseFloat(formData.quantity)
      });
      navigate('/farmer/dashboard');
    } catch (error) {
      console.error("Failed to create lot:", error);
      alert("Failed to create lot. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectedCrop = crops.find(c => c.id === formData.crop_id);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Create New Lot</h1>
          <p className="text-muted-foreground">List your crop on the market in 4 easy steps.</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white p-6 rounded-xl border border-border shadow-sm mb-6">
        <div className="flex items-center justify-between">
          {STEPS.map((step, i) => (
            <React.Fragment key={step.id}>
              <div className={`flex flex-col items-center gap-2 ${currentStep >= step.id ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 ${currentStep > step.id ? 'bg-primary border-primary text-white' : currentStep === step.id ? 'border-primary text-primary' : 'border-muted-foreground text-muted-foreground'}`}>
                  {currentStep > step.id ? <CheckCircle2 className="w-5 h-5" /> : step.id}
                </div>
                <span className="text-xs font-medium hidden sm:block">{step.name}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${currentStep > step.id ? 'bg-primary' : 'bg-muted'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white p-8 rounded-xl border border-border shadow-sm min-h-[400px] flex flex-col justify-between">
        <div className="flex-1">
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-semibold mb-4">What are you listing?</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {crops.map(crop => (
                  <button
                    key={crop.id}
                    onClick={() => setFormData({...formData, crop_id: crop.id})}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-3 transition-all ${formData.crop_id === crop.id ? 'border-primary bg-primary/5 shadow-md' : 'border-border hover:border-primary/30 hover:bg-muted'}`}
                  >
                    <span className="text-4xl">{crop.icon}</span>
                    <span className="font-medium text-foreground">{crop.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-semibold mb-4">Quantity & Quality</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Quantity ({selectedCrop?.unit || 'quintals'})</label>
                  <input 
                    type="number" 
                    min="1"
                    className="w-full rounded-md border-border focus:border-primary focus:ring-primary"
                    placeholder="e.g. 50"
                    value={formData.quantity}
                    onChange={e => setFormData({...formData, quantity: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Quality Grade</label>
                  <select 
                    className="w-full rounded-md border-border focus:border-primary focus:ring-primary"
                    value={formData.quality_grade}
                    onChange={e => setFormData({...formData, quality_grade: e.target.value})}
                  >
                    <option value="A">Grade A (Premium)</option>
                    <option value="B">Grade B (Standard)</option>
                    <option value="C">Grade C (Fair)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Description (Optional)</label>
                  <textarea 
                    className="w-full rounded-md border-border focus:border-primary focus:ring-primary"
                    rows="3"
                    placeholder="Any specific details about moisture content, color, etc."
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  ></textarea>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-semibold mb-4">Availability Dates</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Harvest Date</label>
                  <input 
                    type="date" 
                    className="w-full rounded-md border-border focus:border-primary focus:ring-primary"
                    value={formData.harvest_date}
                    onChange={e => setFormData({...formData, harvest_date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Available From</label>
                  <input 
                    type="date" 
                    className="w-full rounded-md border-border focus:border-primary focus:ring-primary"
                    value={formData.available_from}
                    onChange={e => setFormData({...formData, available_from: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Available Until</label>
                  <input 
                    type="date" 
                    className="w-full rounded-md border-border focus:border-primary focus:ring-primary"
                    value={formData.available_until}
                    onChange={e => setFormData({...formData, available_until: e.target.value})}
                  />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3 p-4 border border-border rounded-lg bg-muted/50">
                <input 
                  type="checkbox" 
                  id="storage"
                  className="rounded border-border text-primary focus:ring-primary w-5 h-5"
                  checked={formData.storage_required}
                  onChange={e => setFormData({...formData, storage_required: e.target.checked})}
                />
                <label htmlFor="storage" className="font-medium text-foreground cursor-pointer">I require warehouse storage assistance</label>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              <h2 className="text-xl font-semibold mb-4">Review Your Listing</h2>
              <div className="bg-muted p-6 rounded-xl border border-border space-y-4">
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Crop</span>
                  <span className="font-semibold text-foreground flex items-center gap-2">{selectedCrop?.icon} {selectedCrop?.name}</span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Quantity & Grade</span>
                  <span className="font-semibold text-foreground">{formData.quantity} {selectedCrop?.unit} • Grade {formData.quality_grade}</span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Availability</span>
                  <span className="font-semibold text-foreground">{formData.available_from} to {formData.available_until}</span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Storage Assistance</span>
                  <span className="font-semibold text-foreground">{formData.storage_required ? 'Yes' : 'No'}</span>
                </div>
                {formData.description && (
                  <div>
                    <span className="text-muted-foreground block mb-1">Description</span>
                    <p className="text-sm font-medium">{formData.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-border">
          <button 
            onClick={handlePrev}
            disabled={currentStep === 1}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${currentStep === 1 ? 'opacity-0 pointer-events-none' : 'text-foreground hover:bg-muted border border-border'}`}
          >
            Back
          </button>
          
          {currentStep < STEPS.length ? (
            <button 
              onClick={handleNext}
              disabled={currentStep === 1 && !formData.crop_id}
              className="px-6 py-2 rounded-md font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-2.5 rounded-md font-medium bg-green-600 text-white hover:bg-green-700 transition-colors shadow-md flex items-center gap-2 disabled:opacity-70"
            >
              {loading ? 'Submitting...' : 'Confirm & List Lot'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
