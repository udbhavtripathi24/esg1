import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronRight, ChevronLeft, Building2, MapPin, UserSquare2, Network, ClipboardCheck, Plus, X, ImageUp } from 'lucide-react'
import { Button, Field, Input, Select } from '../../components/ui.jsx'
import { useClientPool } from '../../context/ClientPoolContext.jsx'
import { industries } from '../../data/mockData'

const STEPS = [
  { key: 'company', label: 'Company Details', icon: Building2 },
  { key: 'office', label: 'Office & Contact', icon: MapPin },
  { key: 'structure', label: 'Org Structure', icon: Network },
  { key: 'declaration', label: 'Declaration', icon: ClipboardCheck },
]

const emptyForm = {
  companyName: '', legalEntityName: '', website: '', industry: '', sector: '',
  companyStructure: 'Listed', parentCompany: '', cin: '',
  country: '', state: '', city: '', postalCode: '', streetAddress: '',
  contactName: '', designation: '', officialEmail: '', phoneNumber: '',
  entities: [],
  confirmed: false,
}

export default function NewClientRegistration() {
  const navigate = useNavigate()
  const { addClient } = useClientPool()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: false }))
  }

  function validateStep() {
    const e = {}
    if (step === 0) {
      if (!form.companyName.trim()) e.companyName = true
      if (!form.industry) e.industry = true
    }
    if (step === 1) {
      if (!form.country.trim()) e.country = true
      if (!form.city.trim()) e.city = true
      if (!form.contactName.trim()) e.contactName = true
      if (!form.designation.trim()) e.designation = true
      if (!form.officialEmail.trim() || !form.officialEmail.includes('@')) e.officialEmail = true
      if (!form.phoneNumber.trim()) e.phoneNumber = true
    }
    if (step === 3) {
      if (!form.confirmed) e.confirmed = true
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function goNext() {
    if (!validateStep()) return
    if (step < STEPS.length - 1) setStep(step + 1)
  }

  function goBack() {
    if (step > 0) setStep(step - 1)
  }

  function handleSubmit() {
    if (!validateStep()) return

    const newClient = {
      id: `cl-${Date.now()}`,
      name: form.companyName,
      consultant: 'James Whitfield',
      plan: 'Basic',
      regStatus: 'Pending',
      reportStatus: '-',
      lastActivity: 'Just now',
      location: [form.city, form.state].filter(Boolean).join(', ') || form.country,
      industry: form.industry,
      employees: '-',
      country: form.country,
      contact: {
        name: form.contactName,
        title: form.designation,
        phone: form.phoneNumber,
        email: form.officialEmail,
      },
      subscription: { plan: 'Basic', start: '-', end: '-' },
      consultants: ['James Whitfield'],
      frameworks: [],
      progress: 0,
    }

    addClient(newClient)
    navigate('/consultant/control-center', { state: { tab: 'Client Pool' } })
  }

  return (
    <div>
      <p className="text-xs text-ink-500 mb-1">
        <button onClick={() => navigate('/consultant/control-center')} className="hover:underline">Clients</button>
        <span className="mx-1.5">›</span>
        New Client Registration
      </p>
      <h1 className="text-2xl font-semibold text-ink-900 mb-1">Welcome.</h1>
      <p className="text-sm text-ink-500 mb-6">Set up a new client workspace by configuring the organisation, Deloitte team members and client users.</p>

      {/* Stepper */}
      <div className="flex items-center mb-8">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors ${
                  i < step ? 'bg-brand-green border-brand-green text-white'
                  : i === step ? 'border-brand-green text-brand-green bg-white'
                  : 'border-surface-border text-ink-300 bg-white'
                }`}
              >
                {i < step ? <Check size={16} /> : <s.icon size={16} />}
              </div>
              <span className={`text-xs mt-1.5 whitespace-nowrap ${i <= step ? 'text-ink-900 font-medium' : 'text-ink-300'}`}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mb-5 ${i < step ? 'bg-brand-green' : 'bg-surface-border'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white border border-surface-border rounded-lg">
        {step === 0 && <CompanyDetailsStep form={form} update={update} errors={errors} />}
        {step === 1 && <OfficeContactStep form={form} update={update} errors={errors} />}
        {step === 2 && <OrgStructureStep form={form} update={update} />}
        {step === 3 && <DeclarationStep form={form} update={update} errors={errors} />}
      </div>

      <div className="flex justify-between mt-6">
        <Button variant="ghost" onClick={goBack} disabled={step === 0}>
          <ChevronLeft size={15} /> Back
        </Button>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => navigate('/consultant/control-center')}>Cancel</Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={goNext}>Next <ChevronRight size={15} /></Button>
          ) : (
            <Button onClick={handleSubmit}>Submit Registration</Button>
          )}
        </div>
      </div>
    </div>
  )
}

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-surface-border">
      <div className="w-9 h-9 rounded-md bg-brand-green/10 text-brand-greenDark flex items-center justify-center shrink-0">
        <Icon size={17} />
      </div>
      <div>
        <p className="text-sm font-semibold text-ink-900">{title}</p>
        <p className="text-xs text-ink-500">{subtitle}</p>
      </div>
    </div>
  )
}

function CompanyDetailsStep({ form, update, errors }) {
  return (
    <div>
      <SectionHeader icon={Building2} title="Company Information" subtitle="Core organizational details" />
      <div className="p-6 grid sm:grid-cols-2 gap-4">
        <Field label="Company Name" required>
          <Input value={form.companyName} onChange={(e) => update('companyName', e.target.value)} placeholder="John Doe" className={errors.companyName ? '!border-status-pending' : ''} />
        </Field>
        <Field label="Legal Entity Name" optional>
          <Input value={form.legalEntityName} onChange={(e) => update('legalEntityName', e.target.value)} placeholder="Company Name" />
        </Field>

        <Field label="Company Logo" optional>
          <button type="button" className="flex items-center gap-2 px-3 py-2.5 rounded-md border border-dashed border-surface-border text-sm text-ink-500 w-full">
            <ImageUp size={15} /> Upload logo
          </button>
        </Field>
        <Field label="Website" optional>
          <Input value={form.website} onChange={(e) => update('website', e.target.value)} placeholder="https://companywebsite.com" />
        </Field>

        <Field label="Industry" required>
          <Select value={form.industry} onChange={(e) => update('industry', e.target.value)} className={errors.industry ? '!border-status-pending' : ''}>
            <option value="">Select Industry</option>
            {industries.map((i) => <option key={i}>{i}</option>)}
          </Select>
        </Field>
        <Field label="Sector" optional>
          <Input value={form.sector} onChange={(e) => update('sector', e.target.value)} placeholder="e.g. Renewable energy" />
        </Field>

        <div>
          <label className="block text-sm text-ink-700 mb-1.5">Company Structure<span className="text-status-pending">*</span></label>
          <div className="grid grid-cols-2 gap-3">
            {['Listed', 'Unlisted'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => update('companyStructure', s)}
                className={`px-3 py-2.5 rounded-md border text-sm transition-colors ${
                  form.companyStructure === s ? 'border-brand-green bg-brand-green/5 text-brand-greenDark font-medium' : 'border-surface-border text-ink-500'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <Field label="Parent Company" optional>
          <Input value={form.parentCompany} onChange={(e) => update('parentCompany', e.target.value)} placeholder="e.g. ABC Holdings" />
        </Field>

        <Field label="Corporate Identification Number (CIN)" optional>
          <Input value={form.cin} onChange={(e) => update('cin', e.target.value)} placeholder="e.g. U12345MH2020PLC123456" />
        </Field>
      </div>
    </div>
  )
}

function OfficeContactStep({ form, update, errors }) {
  return (
    <div>
      <SectionHeader icon={MapPin} title="Registered Office" subtitle="Primary business address" />
      <div className="p-6 grid sm:grid-cols-2 gap-4 border-b border-surface-border">
        <Field label="Country" required>
          <Input value={form.country} onChange={(e) => update('country', e.target.value)} placeholder="Select country" className={errors.country ? '!border-status-pending' : ''} />
        </Field>
        <Field label="State / Province" optional>
          <Input value={form.state} onChange={(e) => update('state', e.target.value)} placeholder="e.g. Kannur, Thrissur" />
        </Field>
        <Field label="City" required>
          <Input value={form.city} onChange={(e) => update('city', e.target.value)} placeholder="Select city" className={errors.city ? '!border-status-pending' : ''} />
        </Field>
        <Field label="Postal Code" optional>
          <Input value={form.postalCode} onChange={(e) => update('postalCode', e.target.value)} placeholder="eg. 101010" />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Street Address" optional>
            <Input value={form.streetAddress} onChange={(e) => update('streetAddress', e.target.value)} placeholder="eg. 2nd floor abc building, St george street" />
          </Field>
        </div>
      </div>

      <SectionHeader icon={UserSquare2} title="Primary Contact" subtitle="Main point of contact at the organization" />
      <div className="p-6 grid sm:grid-cols-2 gap-4">
        <Field label="Contact Name" required>
          <Input value={form.contactName} onChange={(e) => update('contactName', e.target.value)} placeholder="e.g. Neha Sharma" className={errors.contactName ? '!border-status-pending' : ''} />
        </Field>
        <Field label="Designation" required>
          <Input value={form.designation} onChange={(e) => update('designation', e.target.value)} placeholder="e.g. Head of Sustainability" className={errors.designation ? '!border-status-pending' : ''} />
        </Field>
        <Field label="Official Email" required>
          <Input value={form.officialEmail} onChange={(e) => update('officialEmail', e.target.value)} placeholder="name@company.com" className={errors.officialEmail ? '!border-status-pending' : ''} />
        </Field>
        <Field label="Phone Number" required>
          <Input value={form.phoneNumber} onChange={(e) => update('phoneNumber', e.target.value)} placeholder="+91 99999xxxxx" className={errors.phoneNumber ? '!border-status-pending' : ''} />
        </Field>
      </div>
    </div>
  )
}

function OrgStructureStep({ form, update }) {
  function addEntity() {
    update('entities', [...form.entities, { id: Date.now(), name: '', relationship: 'Subsidiary' }])
  }
  function updateEntity(id, field, value) {
    update('entities', form.entities.map((e) => (e.id === id ? { ...e, [field]: value } : e)))
  }
  function removeEntity(id) {
    update('entities', form.entities.filter((e) => e.id !== id))
  }

  return (
    <div>
      <SectionHeader icon={Network} title="Organization Structure" subtitle="Legal entities and associated companies" />
      <div className="p-6">
        {form.entities.length === 0 ? (
          <div className="border border-dashed border-surface-border rounded-lg py-10 flex flex-col items-center text-center mb-4">
            <Network size={20} className="text-ink-300 mb-2" />
            <p className="text-sm text-ink-500">No legal entities added yet</p>
          </div>
        ) : (
          <div className="space-y-3 mb-4">
            {form.entities.map((entity) => (
              <div key={entity.id} className="flex items-center gap-3 border border-surface-border rounded-lg p-3">
                <Input
                  value={entity.name}
                  onChange={(e) => updateEntity(entity.id, 'name', e.target.value)}
                  placeholder="Entity name"
                  className="flex-1"
                />
                <Select
                  value={entity.relationship}
                  onChange={(e) => updateEntity(entity.id, 'relationship', e.target.value)}
                  className="w-40"
                >
                  <option>Subsidiary</option>
                  <option>Joint Venture</option>
                  <option>Branch Office</option>
                </Select>
                <button onClick={() => removeEntity(entity.id)} className="text-ink-300 hover:text-status-pending shrink-0">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
        <Button variant="subtle" size="sm" onClick={addEntity}>
          <Plus size={14} /> Add entity
        </Button>
      </div>
    </div>
  )
}

function DeclarationStep({ form, update, errors }) {
  return (
    <div>
      <SectionHeader icon={ClipboardCheck} title="Declaration" subtitle="Accuracy confirmation before submission" />
      <div className="p-6">
        <div className="border border-surface-border rounded-lg p-4 mb-4 bg-surface-muted/40">
          <p className="text-sm text-ink-700 leading-relaxed">
            I, on behalf of the organisation, hereby declare that the information provided in this submission is accurate,
            complete and current to the best of my knowledge. I understand that this submission will be reviewed by
            Deloitte before any access is granted to the ESG Reporting Platform. I acknowledge that the provision of
            false or misleading information may result in the rejection of this registration or termination of any
            subsequent engagement.
          </p>
        </div>
        <label className="flex items-start gap-2 text-sm text-ink-700 cursor-pointer">
          <input
            type="checkbox"
            checked={form.confirmed}
            onChange={(e) => update('confirmed', e.target.checked)}
            className="mt-0.5 rounded border-surface-border"
          />
          I confirm that the information provided above is accurate and complete.
        </label>
        {errors.confirmed && <p className="text-xs text-status-pending mt-2">Please confirm before submitting.</p>}

        <div className="mt-6 pt-5 border-t border-surface-border">
          <p className="text-xs text-ink-500 font-medium mb-3">Summary</p>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <SummaryRow label="Company" value={form.companyName || '—'} />
            <SummaryRow label="Industry" value={form.industry || '—'} />
            <SummaryRow label="Location" value={[form.city, form.country].filter(Boolean).join(', ') || '—'} />
            <SummaryRow label="Primary Contact" value={form.contactName || '—'} />
            <SummaryRow label="Contact Email" value={form.officialEmail || '—'} />
            <SummaryRow label="Legal Entities" value={form.entities.length ? `${form.entities.length} added` : 'None'} />
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryRow({ label, value }) {
  return (
    <div>
      <div className="text-xs text-ink-300">{label}</div>
      <div className="text-ink-900">{value}</div>
    </div>
  )
}
