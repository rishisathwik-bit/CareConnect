import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import StatusBadge from '../../components/common/StatusBadge';
import { Wrench, ShieldCheck, Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ProviderProfileEditPage() {
  const { success, error } = useToast();
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    businessName: '',
    bio: '',
    hourlyRate: 50,
    experienceYears: 3,
    skills: '',
    serviceAreas: ''
  });
  const [saving, setSaving] = useState(false);
  const [docType, setDocType] = useState('license');
  const [docTitle, setDocTitle] = useState('');
  const [docUrl, setDocUrl] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/providers/profile/me');
      if (res.success) {
        setProfile(res.data);
        setFormData({
          businessName: res.data.businessName || '',
          bio: res.data.bio || '',
          hourlyRate: res.data.hourlyRate || 50,
          experienceYears: res.data.experienceYears || 1,
          skills: (res.data.skills || []).join(', '),
          serviceAreas: (res.data.serviceAreas || []).join(', ')
        });
      }
    } catch (err) {
      error('Failed to load profile');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        businessName: formData.businessName,
        bio: formData.bio,
        hourlyRate: Number(formData.hourlyRate),
        experienceYears: Number(formData.experienceYears),
        skills: formData.skills.split(',').map((s) => s.trim()).filter(Boolean),
        serviceAreas: formData.serviceAreas.split(',').map((s) => s.trim()).filter(Boolean)
      };

      const res = await api.put('/providers/profile/me', payload);
      if (res.success) {
        success('Provider profile updated successfully!');
        setProfile(res.data);
      }
    } catch (err) {
      error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const [uploadingDoc, setUploadingDoc] = useState(false);

  const handleUploadDoc = async (e) => {
    e.preventDefault();
    if (!docTitle.trim()) {
      error('Please enter a document title');
      return;
    }
    setUploadingDoc(true);
    try {
      const res = await api.post('/providers/profile/me/documents', {
        docType,
        title: docTitle,
        fileUrl: docUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80'
      });
      if (res.success) {
        success('Document submitted! Status is now pending admin audit.');
        setDocTitle('');
        setDocUrl('');
        fetchProfile();
      }
    } catch (err) {
      error(err.message || 'Failed to submit document');
    } finally {
      setUploadingDoc(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Provider Profile & Verification</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your public business listing, hourly rate, specialized trade skills, and regulatory credentials.
          </p>
        </div>

        {profile && <StatusBadge status={profile.verificationStatus} />}
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Business Name</label>
              <input
                type="text"
                name="businessName"
                required
                value={formData.businessName}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Standard Hourly Rate ($/hr)</label>
              <input
                type="number"
                name="hourlyRate"
                required
                min="15"
                max="350"
                value={formData.hourlyRate}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Years of Experience</label>
              <input
                type="number"
                name="experienceYears"
                min="0"
                max="50"
                value={formData.experienceYears}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Service Areas / Zip Codes (comma-separated)
              </label>
              <input
                type="text"
                name="serviceAreas"
                value={formData.serviceAreas}
                onChange={handleChange}
                placeholder="94102, 94103, San Francisco"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Skills & Trade Capabilities (comma-separated)
            </label>
            <input
              type="text"
              name="skills"
              value={formData.skills}
              onChange={handleChange}
              placeholder="Pipe Repair, Drain Cleaning, Leak Detection, Water Heater Repair"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Used by the AI Provider Matching Engine to rank suitable leads for your profile.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Professional Bio</label>
            <textarea
              rows="3"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Describe your qualifications, equipment, and work guarantee..."
              className="w-full p-3 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 transition"
          >
            {saving ? 'Saving Profile...' : 'Save Profile Changes'}
          </button>
        </form>

        {/* Verification & Documents */}
        <div className="pt-6 border-t border-slate-200 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <span>Verification Documents & Credentials</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Uploaded documents are audited by Platform Admins before the Verified Pro badge is awarded.
              </p>
            </div>
          </div>

          {profile?.documents && profile.documents.length > 0 ? (
            <div className="space-y-2">
              {profile.documents.map((doc, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <div>
                      <span className="font-bold text-slate-800 block">{doc.title}</span>
                      <span className="text-[10px] text-slate-400 capitalize">{doc.docType}</span>
                    </div>
                  </div>

                  <StatusBadge status={doc.status} />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-400">
              No verification documents submitted yet.
            </div>
          )}

          {/* Submit New Document Form */}
          <form onSubmit={handleUploadDoc} className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3 text-xs">
            <h4 className="font-bold text-slate-900">Upload New License or Certificate</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Credential Type</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="license">Trade License / Certification</option>
                  <option value="insurance">Liability Insurance Certificate</option>
                  <option value="id">Government ID / Background Check</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Document Title</label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g. Master Contractor License #12345"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400">
                Will be submitted for Platform Admin document review
              </span>
              <button
                type="submit"
                disabled={uploadingDoc}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
              >
                {uploadingDoc ? 'Submitting...' : 'Submit Document'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
