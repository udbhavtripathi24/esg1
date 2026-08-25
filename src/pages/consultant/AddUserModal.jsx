import { useState } from 'react'
import { UserPlus, UploadCloud, X } from 'lucide-react'
import { Button, Field, Input, Select } from '../../components/ui.jsx'
import { roleOptions } from '../../data/mockData'

const DEPARTMENTS = ['ESG Advisory', 'Frameworks', 'Client Success']

export default function AddUserModal({ onClose, onAdd, title = 'Add User', subtitle = 'Add a new Deloitte user to the platform' }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [department, setDepartment] = useState('')
  const [role, setRole] = useState('Consultant')
  const [errors, setErrors] = useState({})

  function validate() {
    const e = {}
    if (!firstName.trim()) e.firstName = true
    if (!lastName.trim()) e.lastName = true
    if (!email.trim() || !email.includes('@')) e.email = true
    if (!department) e.department = true
    return e
  }

  function handleSubmit() {
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length > 0) return
    onAdd({
      id: `u-${Date.now()}`,
      name: `${firstName.trim()} ${lastName.trim()}`,
      email: email.trim(),
      department,
      role,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-ink-900/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start gap-3 p-6 border-b border-surface-border">
          <div className="w-10 h-10 rounded-md bg-brand-green flex items-center justify-center text-white shrink-0">
            <UserPlus size={18} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-ink-900">{title}</h3>
            <p className="text-xs text-ink-500 mt-0.5">{subtitle}</p>
          </div>
          <button onClick={onClose} className="text-ink-300 hover:text-ink-700">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="First Name" required>
              <Input
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={errors.firstName ? '!border-status-pending' : ''}
              />
            </Field>
            <Field label="Last Name" required>
              <Input
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={errors.lastName ? '!border-status-pending' : ''}
              />
            </Field>
          </div>

          <Field label="Deloitte email id" required>
            <Input
              placeholder="abc@deloitte.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={errors.email ? '!border-status-pending' : ''}
            />
          </Field>

          <Field label="Department" required>
            <Select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className={errors.department ? '!border-status-pending' : ''}
            >
              <option value="" disabled>Select Department</option>
              {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
            </Select>
          </Field>

          <div>
            <label className="block text-sm text-ink-700 mb-1.5">Role</label>
            <div className="grid grid-cols-2 gap-3">
              {roleOptions.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`px-3 py-2.5 rounded-md border text-sm transition-colors ${
                    role === r ? 'border-brand-green bg-brand-green/5 text-brand-greenDark font-medium' : 'border-surface-border text-ink-500 hover:border-ink-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-ink-300">
            <div className="flex-1 h-px bg-surface-border" />
            or
            <div className="flex-1 h-px bg-surface-border" />
          </div>

          <div>
            <label className="block text-sm text-ink-700 mb-1.5">Import Users</label>
            <div className="border border-dashed border-surface-border rounded-lg py-8 flex flex-col items-center text-center">
              <UploadCloud size={20} className="text-ink-300 mb-2" />
              <p className="text-sm text-ink-500">Drop your file here, or browse</p>
              <p className="text-xs text-ink-300 mt-1">Supports CSV and Excel (.xlsx) files</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-surface-border">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>{title === 'Add User' ? 'Add User' : 'Assign User'}</Button>
        </div>
      </div>
    </div>
  )
}
