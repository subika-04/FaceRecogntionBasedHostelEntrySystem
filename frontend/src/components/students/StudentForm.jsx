import { useState } from 'react';
import { HOSTEL_STATUS } from '../../utils/constants';
import { titleCase } from '../../utils/formatters';
import { validateStudentFields } from '../../utils/studentValidation';

const emptyForm = {
  registerNumber: '',
  fullName: '',
  department: '',
  year: 1,
  hostelStatus: 'HOSTELLER',
  phone: '',
  email: '',
};

// initialValues: partial StudentResponse (for edit) or undefined (for create)
export default function StudentForm({ initialValues, onSubmit, submitting, submitLabel = 'Save' }) {
  const [form, setForm] = useState({ ...emptyForm, ...initialValues });
  const [errors, setErrors] = useState({});

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const next = validateStudentFields(form);
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ ...form, year: Number(form.year) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Register Number</label>
          <input className="input" value={form.registerNumber} onChange={update('registerNumber')} maxLength={30} />
          {errors.registerNumber && <p className="mt-1 text-xs text-denied-600">{errors.registerNumber}</p>}
        </div>
        <div>
          <label className="label">Full Name</label>
          <input className="input" value={form.fullName} onChange={update('fullName')} maxLength={100} />
          {errors.fullName && <p className="mt-1 text-xs text-denied-600">{errors.fullName}</p>}
        </div>
        <div>
          <label className="label">Department</label>
          <input className="input" value={form.department} onChange={update('department')} maxLength={100} />
          {errors.department && <p className="mt-1 text-xs text-denied-600">{errors.department}</p>}
        </div>
        <div>
          <label className="label">Year</label>
          <select className="input" value={form.year} onChange={update('year')}>
            {[1, 2, 3, 4, 5].map((y) => (
              <option key={y} value={y}>
                Year {y}
              </option>
            ))}
          </select>
          {errors.year && <p className="mt-1 text-xs text-denied-600">{errors.year}</p>}
        </div>
        <div>
          <label className="label">Hostel Status</label>
          <select className="input" value={form.hostelStatus} onChange={update('hostelStatus')}>
            {HOSTEL_STATUS.map((s) => (
              <option key={s} value={s}>
                {titleCase(s)}
              </option>
            ))}
          </select>
          {errors.hostelStatus && <p className="mt-1 text-xs text-denied-600">{errors.hostelStatus}</p>}
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" value={form.phone || ''} onChange={update('phone')} maxLength={20} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Email</label>
          <input className="input" type="email" value={form.email || ''} onChange={update('email')} maxLength={150} />
          {errors.email && <p className="mt-1 text-xs text-denied-600">{errors.email}</p>}
        </div>
      </div>

      <button type="submit" disabled={submitting} className="btn-primary">
        {submitting ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}
