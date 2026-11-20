import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FilePlus2,
  Sparkles,
  MapPin,
  FileText,
  CheckCircle,
  AlertCircle,
  Copy,
  Check,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Send,
  Info,
} from 'lucide-react';
import { ImageUploader } from '../components/common/ImageUploader';
import { MapPicker } from '../components/common/MapPicker';
import { Alert } from '../components/common/Alert';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  CIVIC_CATEGORIES,
  ImageValidationResult,
  LetterGenerationResult,
  Complaint,
} from '../types';

export const ReportIssuePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Wizard Step: 1 = Details & Photo, 2 = AI Analysis, 3 = Formal Letter, 4 = Location, 5 = Review & Submit
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>(CIVIC_CATEGORIES[0]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [citizenName, setCitizenName] = useState(user?.full_name || '');
  const [citizenContact, setCitizenContact] = useState(user?.email || '');

  // AI Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<ImageValidationResult | null>(null);

  // Letter State
  const [isGeneratingLetter, setIsGeneratingLetter] = useState(false);
  const [letterSubject, setLetterSubject] = useState('');
  const [letterBody, setLetterBody] = useState('');
  const [copiedLetter, setCopiedLetter] = useState(false);

  // Location State
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationAddress, setLocationAddress] = useState('');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedComplaint, setSubmittedComplaint] = useState<Complaint | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Step 1 -> Step 2: Validate image with AI
  const handleProceedToAI = async () => {
    setError(null);
    if (!title.trim() || title.length < 3) {
      setError('Please provide a descriptive title (at least 3 characters).');
      return;
    }
    if (!description.trim() || description.length < 10) {
      setError('Please describe the problem clearly (at least 10 characters).');
      return;
    }
    if (!selectedFile) {
      setError('A photograph is required to verify the civic grievance with AI.');
      return;
    }

    try {
      setIsAnalyzing(true);
      const res = await api.validateImage(selectedFile);
      setAiResult(res);
      setIsAnalyzing(false);

      if (res.detected_category && CIVIC_CATEGORIES.includes(res.detected_category as any)) {
        setCategory(res.detected_category);
      }

      setCurrentStep(2);
    } catch (err: any) {
      setIsAnalyzing(false);
      setError(err.message || 'Image validation failed.');
    }
  };

  // Step 2 -> Step 3: Generate Formal Letter
  const handleProceedToLetter = async () => {
    setError(null);
    if (!aiResult?.valid_image) {
      setError('The uploaded image was flagged as invalid or irrelevant. Please upload a clear photo of the civic issue.');
      return;
    }

    try {
      setIsGeneratingLetter(true);
      const res = await api.generateLetter({
        title,
        category,
        description,
        location_address: locationAddress || undefined,
        latitude: latitude || undefined,
        longitude: longitude || undefined,
        ai_image_description: aiResult.description || undefined,
        citizen_name: citizenName || undefined,
        citizen_contact: citizenContact || undefined,
      });
      setIsGeneratingLetter(false);
      setLetterSubject(res.letter_subject);
      setLetterBody(res.letter_body);
      setCurrentStep(3);
    } catch (err: any) {
      setIsGeneratingLetter(false);
      setError(err.message || 'Failed to generate formal grievance letter.');
    }
  };

  // Step 3 -> Step 4: Proceed to Map Location
  const handleProceedToLocation = () => {
    if (!letterBody.trim()) {
      setError('Please review or write the complaint letter before continuing.');
      return;
    }
    setError(null);
    setCurrentStep(4);
  };

  // Step 4 -> Step 5: Proceed to Review
  const handleProceedToReview = () => {
    setError(null);
    setCurrentStep(5);
  };

  // Step 5: Final Submission
  const handleSubmitFinal = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const complaint = await api.submitComplaint({
        title,
        description,
        category,
        latitude,
        longitude,
        location_address: locationAddress,
        image_filename: aiResult?.image_filename || null,
        complaint_letter: letterBody,
        citizen_name: citizenName,
        citizen_contact: citizenContact,
        ai_valid_image: aiResult?.valid_image ?? false,
        ai_relevance: aiResult?.relevance ?? null,
        ai_confidence: aiResult?.confidence ?? null,
        ai_detected_category: aiResult?.detected_category ?? null,
        ai_description: aiResult?.description ?? null,
        ai_rejection_reason: aiResult?.rejection_reason ?? null,
        ai_recommended_next_step: aiResult?.recommended_next_step ?? null,
        is_mock_ai: aiResult?.is_mock ?? false,
      });

      setIsSubmitting(false);
      setSubmittedComplaint(complaint);
    } catch (err: any) {
      setIsSubmitting(false);
      setError(err.message || 'Failed to submit complaint.');
    }
  };

  const handleCopyLetter = () => {
    navigator.clipboard.writeText(letterBody);
    setCopiedLetter(true);
    setTimeout(() => setCopiedLetter(false), 2000);
  };

  // Render Confirmation Screen when submitted
  if (submittedComplaint) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-8 sm:p-10 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Grievance Submitted Successfully!
            </h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Your grievance has been validated and recorded on the Civic AI public registry.
            </p>
          </div>

          {/* Reference Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-2 max-w-md mx-auto">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Your Tracking Reference Number
            </div>
            <div className="font-mono text-2xl font-black text-civic-700 tracking-wider">
              {submittedComplaint.reference_number}
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(submittedComplaint.reference_number);
                setCopiedLetter(true);
                setTimeout(() => setCopiedLetter(false), 2000);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-civic-600 hover:text-civic-800 transition-colors pt-1"
            >
              {copiedLetter ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLetter ? 'Copied to Clipboard' : 'Copy Reference Number'}</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Keep this reference code to track the resolution timeline or share with municipal officers.
          </div>

          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate(`/track?ref=${submittedComplaint.reference_number}`)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-civic-600 text-white font-bold text-sm shadow hover:bg-civic-700 transition-colors"
            >
              Track Status Now <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setSubmittedComplaint(null);
                setCurrentStep(1);
                setTitle('');
                setDescription('');
                setSelectedFile(null);
                setAiResult(null);
                setLetterBody('');
                setLatitude(null);
                setLongitude(null);
                setLocationAddress('');
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              Report Another Issue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-civic-600 uppercase tracking-widest">
          <FilePlus2 className="w-4 h-4" />
          <span>Municipal Grievance Redressal</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Report a Civic Issue
        </h1>
        <p className="text-sm text-slate-500">
          Complete the guided steps below to verify your photo, draft a formal letter, and pin the location.
        </p>
      </div>

      {/* Wizard Step Indicator */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="grid grid-cols-5 gap-2 text-center text-xs">
          {[
            { num: 1, label: 'Issue & Photo' },
            { num: 2, label: 'AI Verification' },
            { num: 3, label: 'Formal Letter' },
            { num: 4, label: 'Pin Location' },
            { num: 5, label: 'Review & Submit' },
          ].map((s) => (
            <div
              key={s.num}
              className={`flex flex-col items-center gap-1.5 ${
                currentStep === s.num
                  ? 'text-civic-700 font-bold'
                  : currentStep > s.num
                  ? 'text-emerald-600 font-medium'
                  : 'text-slate-400'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  currentStep === s.num
                    ? 'bg-civic-600 text-white'
                    : currentStep > s.num
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {currentStep > s.num ? '✓' : s.num}
              </div>
              <span className="hidden sm:inline text-[11px] truncate max-w-[80px]">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* STEP 1: Details & Photo */}
      {currentStep === 1 && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-900">Step 1 — Issue Information & Photo</h2>
            <p className="text-xs text-slate-500 mt-1">
              Provide a clear title, description, and upload a photograph for AI evidence verification.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Issue Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Hazardous deep pothole on 4th Main Road"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-civic-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Civic Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-civic-500 focus:outline-none"
              >
                {CIVIC_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Issue Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the problem, severity, duration, and safety or sanitation risk..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-civic-500 focus:outline-none"
              />
            </div>

            {/* Photo Upload Zone */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Photographic Evidence <span className="text-rose-500">*</span>
              </label>
              <ImageUploader selectedFile={selectedFile} onFileSelect={setSelectedFile} />
            </div>

            {/* Submitter info (optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Citizen Name (Optional)
                </label>
                <input
                  type="text"
                  value={citizenName}
                  onChange={(e) => setCitizenName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-civic-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Email / Contact (Optional)
                </label>
                <input
                  type="text"
                  value={citizenContact}
                  onChange={(e) => setCitizenContact(e.target.value)}
                  placeholder="e.g. citizen@example.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-civic-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={handleProceedToAI}
              disabled={isAnalyzing}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-civic-600 text-white font-bold text-sm shadow hover:bg-civic-700 transition-colors disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing Image with Gemini...</span>
                </>
              ) : (
                <>
                  <span>Verify with AI</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: AI Verification Results */}
      {currentStep === 2 && aiResult && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-civic-600">
              <Sparkles className="w-4 h-4" />
              <span>Multimodal Vision Verification</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">Step 2 — AI Image Analysis</h2>
          </div>

          {/* AI Banner */}
          {aiResult.is_mock && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3">
              <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Offline Development / Demo Mode Active:</span> This visual analysis was simulated locally because live Gemini credentials are not configured or demo mode is enabled.
              </div>
            </div>
          )}

          {/* Result Card */}
          <div
            className={`p-6 rounded-2xl border ${
              aiResult.valid_image
                ? 'bg-emerald-50/50 border-emerald-200'
                : 'bg-rose-50/50 border-rose-200'
            } space-y-4`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-bold text-base">
                {aiResult.valid_image ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span className="text-emerald-900">Valid Civic Evidence Detected</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                    <span className="text-rose-900">Image Unusable or Non-Civic</span>
                  </>
                )}
              </div>
              {aiResult.confidence && (
                <div className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/80 border border-slate-200 text-slate-700">
                  Confidence: {Math.round(aiResult.confidence * 100)}%
                </div>
              )}
            </div>

            {/* Description */}
            <div className="text-sm text-slate-700 leading-relaxed bg-white/90 p-4 rounded-xl border border-slate-200/60">
              <span className="font-semibold text-xs uppercase tracking-wider text-slate-500 block mb-1">
                Objective Visual Evidence
              </span>
              {aiResult.description}
            </div>

            {/* Detected Category */}
            {aiResult.detected_category && (
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-600">Probable Civic Category:</span>
                <span className="font-bold text-civic-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  {aiResult.detected_category}
                </span>
              </div>
            )}

            {/* Rejection / Recommendation */}
            {aiResult.rejection_reason && (
              <div className="text-xs text-rose-700 bg-white p-3 rounded-xl border border-rose-200">
                <strong>Rejection Reason:</strong> {aiResult.rejection_reason}
              </div>
            )}

            {aiResult.recommended_next_step && (
              <div className="text-xs text-slate-600">
                <strong>Next Step:</strong> {aiResult.recommended_next_step}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Edit
            </button>

            {aiResult.valid_image ? (
              <button
                type="button"
                onClick={handleProceedToLetter}
                disabled={isGeneratingLetter}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-civic-600 text-white font-bold text-sm shadow hover:bg-civic-700 transition-colors disabled:opacity-50"
              >
                {isGeneratingLetter ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Drafting Formal Letter...</span>
                  </>
                ) : (
                  <>
                    <span>Generate Formal Letter</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setCurrentStep(1);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 text-white font-semibold text-sm shadow hover:bg-rose-700 transition-colors"
              >
                Upload Different Photograph
              </button>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: Complaint Letter Editor */}
      {currentStep === 3 && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-civic-600">
                <FileText className="w-4 h-4" />
                <span>AI Assistive Grievance Drafting</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mt-1">Step 3 — Formal Grievance Letter</h2>
            </div>
            <button
              type="button"
              onClick={handleCopyLetter}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
            >
              {copiedLetter ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLetter ? 'Copied' : 'Copy Text'}</span>
            </button>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Review the drafted municipal letter below. You may freely edit the text, add details, or refine the requested action before proceeding.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Subject Line
              </label>
              <input
                type="text"
                value={letterSubject}
                onChange={(e) => setLetterSubject(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-civic-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Letter Body (Editable)
              </label>
              <textarea
                rows={14}
                value={letterBody}
                onChange={(e) => setLetterBody(e.target.value)}
                className="w-full p-4 rounded-xl border border-slate-300 text-xs sm:text-sm font-mono leading-relaxed text-slate-800 focus:ring-2 focus:ring-civic-500 focus:outline-none bg-slate-50/50"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to AI Analysis
            </button>
            <button
              type="button"
              onClick={handleProceedToLocation}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-civic-600 text-white font-bold text-sm shadow hover:bg-civic-700 transition-colors"
            >
              <span>Next: Set Location Pin</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Location Map Pin */}
      {currentStep === 4 && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-civic-600">
              <MapPin className="w-4 h-4" />
              <span>OpenStreetMap Geolocation</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">Step 4 — Pin Grievance Location</h2>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Mark the exact site on the map below. Accurate geographic pins help municipal inspectors locate the problem without ambiguity.
          </p>

          <MapPicker
            latitude={latitude}
            longitude={longitude}
            address={locationAddress}
            onLocationChange={(lat, lng, addr) => {
              setLatitude(lat);
              setLongitude(lng);
              if (addr) setLocationAddress(addr);
            }}
          />

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Letter
            </button>
            <button
              type="button"
              onClick={handleProceedToReview}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-civic-600 text-white font-bold text-sm shadow hover:bg-civic-700 transition-colors"
            >
              <span>Review & Submit</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Review & Submit */}
      {currentStep === 5 && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-900">Step 5 — Final Review & Confirmation</h2>
            <p className="text-xs text-slate-500 mt-1">
              Verify your grievance details prior to public recording.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="font-semibold text-slate-500">Title:</span>
                <span className="font-bold text-slate-900">{title}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="font-semibold text-slate-500">Category:</span>
                <span className="font-bold text-civic-700">{category}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="font-semibold text-slate-500">Location:</span>
                <span className="font-medium text-slate-800 text-right max-w-xs truncate">
                  {locationAddress || 'Pinned on map'} ({latitude?.toFixed(4)}, {longitude?.toFixed(4)})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-slate-500">AI Verification:</span>
                <span className="font-bold text-emerald-700">
                  Verified ({Math.round((aiResult?.confidence || 0.9) * 100)}% confidence)
                </span>
              </div>
            </div>

            <div>
              <span className="font-bold text-slate-700 block mb-1">Generated Letter Preview:</span>
              <div className="p-3 bg-slate-100 rounded-xl font-mono text-[11px] text-slate-700 max-h-36 overflow-y-auto whitespace-pre-wrap">
                {letterBody}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Location
            </button>
            <button
              type="button"
              onClick={handleSubmitFinal}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-md hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting to Registry...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Confirm & Submit Grievance</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
