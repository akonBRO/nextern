'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  GraduationCap,
  Eye,
  EyeOff,
  Check,
  Circle,
} from 'lucide-react';
import AuthShell from '@/components/site/AuthShell';
type Role = 'student' | 'employer';
const BD_UNIVERSITIES = [
  'BRAC University',
  'North South University (NSU)',
  'AIUB',
  'Independent University Bangladesh (IUB)',
  'East West University (EWU)',
  'Daffodil International University (DIU)',
  'ULAB',
  'United International University (UIU)',
  'Bangladesh University of Engineering & Technology (BUET)',
  'Khulna University of Engineering & Technology (KUET)',
  'Rajshahi University of Engineering & Technology (RUET)',
  'Chittagong University of Engineering & Technology (CUET)',
  'Shahjalal University of Science and Technology (SUST)',
  'Dhaka University (DU)',
  'Islamic University of Technology (IUT)',
];
const BD_INDUSTRIES = [
  'IT/Software',
  'Banking & Finance',
  'NGO/Development',
  'RMG/Textile',
  'Telecom',
  'Pharma',
  'FMCG',
  'E-commerce/Startup',
  'Education',
  'Healthcare',
  'Manufacturing',
  'Other',
];

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedRole = searchParams.get('role');
  const defaultRole =
    requestedRole === 'student' || requestedRole === 'employer' ? requestedRole : null;

  const [step, setStep] = useState<1 | 2>(defaultRole ? 2 : 1);
  const [role, setRole] = useState<Role | null>(defaultRole);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPass, setShowPass] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    university: '',
    department: '',
    yearOfStudy: '',
    studentId: '',
    companyName: '',
    industry: '',
    tradeLicenseNo: '',
    headquartersCity: '',
  });

  const set = (field: string, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => {
      const n = { ...p };
      delete n[field];
      return n;
    });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role) return;
    setLoading(true);
    setErrors({});

    const payload: Record<string, unknown> = {
      name: form.name,
      email: form.email,
      password: form.password,
      role,
    };
    if (role === 'student') {
      Object.assign(payload, {
        university: form.university,
        department: form.department,
        yearOfStudy: parseInt(form.yearOfStudy) || undefined,
        studentId: form.studentId,
      });
    } else if (role === 'employer') {
      Object.assign(payload, {
        companyName: form.companyName,
        industry: form.industry,
        tradeLicenseNo: form.tradeLicenseNo,
        headquartersCity: form.headquartersCity,
      });
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.details) {
          const flat: Record<string, string> = {};
          Object.entries(data.details as Record<string, string[]>).forEach(([k, v]) => {
            flat[k] = v[0];
          });
          setErrors(flat);
        } else {
          setErrors({ _form: data.error ?? 'Registration failed.' });
        }
        return;
      }
      const params = new URLSearchParams({
        email: form.email.trim().toLowerCase(),
        role,
      });
      if (data.emailSent === false) {
        params.set('delivery', 'failed');
      }
      router.push(`/verify-email?${params.toString()}`);
    } catch {
      setErrors({ _form: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  const field = (
    name: keyof typeof form,
    label: string,
    placeholder: string,
    required = true,
    type = 'text'
  ) => (
    <div className="auth-v2-field">
      <label htmlFor={'register-' + name}>
        {label}
        {!required && <span style={{ fontWeight: 400, color: '#71848d' }}>Optional</span>}
      </label>
      <input
        id={'register-' + name}
        type={type}
        value={form[name]}
        onChange={(e) => set(name, e.target.value)}
        placeholder={placeholder}
        required={required}
        autoComplete={name === 'name' ? 'name' : name === 'email' ? 'email' : undefined}
        aria-invalid={!!errors[name]}
        aria-describedby={errors[name] ? name + '-error' : undefined}
      />
      {errors[name] && (
        <span id={name + '-error'} className="auth-v2-field-error">
          {errors[name]}
        </span>
      )}
    </div>
  );
  const select = (
    name: keyof typeof form,
    label: string,
    options: string[],
    placeholder: string
  ) => (
    <div className="auth-v2-field">
      <label htmlFor={'register-' + name}>{label}</label>
      <select
        id={'register-' + name}
        value={form[name]}
        onChange={(e) => set(name, e.target.value)}
        required
        aria-invalid={!!errors[name]}
        aria-describedby={errors[name] ? name + '-error' : undefined}
      >
        <option value="">{placeholder}</option>
        {options.map((option, i) => (
          <option key={option} value={name === 'yearOfStudy' ? i + 1 : option}>
            {option}
          </option>
        ))}
      </select>
      {errors[name] && (
        <span id={name + '-error'} className="auth-v2-field-error">
          {errors[name]}
        </span>
      )}
    </div>
  );
  return (
    <AuthShell>
      <ol className="auth-v2-stepper" aria-label="Registration progress">
        <li aria-current={step === 1 ? 'step' : undefined}>01 · Account type</li>
        <li aria-current={step === 2 ? 'step' : undefined}>02 · Your details</li>
        <li>03 · Verify email</li>
      </ol>
      {step === 1 ? (
        <>
          <h1>Create your account</h1>
          <p className="auth-v2-intro">Choose how you would like to use Nextern.</p>
          <div className="auth-v2-roles">
            {[
              {
                id: 'student' as Role,
                title: 'I am a student',
                desc: 'Find opportunities, build skills, and get career support.',
                Icon: GraduationCap,
              },
              {
                id: 'employer' as Role,
                title: 'I am an employer',
                desc: 'Connect with campus talent and manage your hiring.',
                Icon: Building2,
              },
            ].map(({ id, title, desc, Icon }) => (
              <button
                key={id}
                type="button"
                className="auth-v2-role"
                onClick={() => {
                  setRole(id);
                  setStep(2);
                }}
              >
                <Icon size={27} strokeWidth={1.6} />
                <span>
                  <strong>{title}</strong>
                  <small>{desc}</small>
                </span>
                <ArrowRight size={18} />
              </button>
            ))}
          </div>
          <p className="auth-v2-help">
            University staff: contact your administrator for an academic account.
          </p>
          <p className="auth-v2-footnote">
            Already have an account? <Link href="/login">Sign in</Link>
          </p>
        </>
      ) : (
        role && (
          <>
            <button type="button" className="auth-v2-back" onClick={() => setStep(1)}>
              <ArrowLeft size={15} /> Change account type
            </button>
            <h1>
              {role === 'student' ? 'Your next step starts here' : 'Find your next great hire'}
            </h1>
            <p className="auth-v2-intro">
              Create your {role} account. <Link href="/login">Already registered?</Link>
            </p>
            {errors._form && (
              <div className="auth-v2-notice auth-v2-error" role="alert">
                {errors._form}
              </div>
            )}
            <form onSubmit={handleSubmit} className="auth-v2-fields">
              {field('name', 'Full name', 'Your full name')}
              {field('email', 'Email address', 'you@email.com', true, 'email')}
              <div className="auth-v2-field">
                <label htmlFor="register-password">Password</label>
                <div className="auth-v2-password">
                  <input
                    id="register-password"
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => set('password', e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="Create a password"
                    aria-invalid={!!errors.password}
                    aria-describedby="register-password-rules"
                  />
                  <button
                    type="button"
                    className="auth-v2-eye"
                    onClick={() => setShowPass((p) => !p)}
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                    aria-pressed={showPass}
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <span className="auth-v2-field-error">{errors.password}</span>}
                <ul id="register-password-rules" className="auth-v2-rules">
                  {[
                    { label: '8+ characters', valid: form.password.length >= 8 },
                    { label: 'Uppercase', valid: /[A-Z]/.test(form.password) },
                    { label: 'Number', valid: /[0-9]/.test(form.password) },
                    { label: 'Symbol', valid: /[^A-Za-z0-9]/.test(form.password) },
                  ].map((rule) => (
                    <li key={rule.label} data-valid={rule.valid}>
                      {rule.valid ? <Check size={12} /> : <Circle size={9} />}
                      {rule.label}
                    </li>
                  ))}
                </ul>
              </div>
              <fieldset className="auth-v2-fieldset">
                <legend>{role === 'student' ? 'Academic details' : 'Company details'}</legend>
                <div className="auth-v2-fields">
                  {role === 'student' ? (
                    <>
                      {select(
                        'university',
                        'University',
                        BD_UNIVERSITIES,
                        'Select your university'
                      )}
                      <div className="auth-v2-two-col">
                        {field('department', 'Department', 'e.g. CSE, BBA')}
                        {select(
                          'yearOfStudy',
                          'Year of study',
                          ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'],
                          'Select year'
                        )}
                      </div>
                      {field('studentId', 'Student ID', 'Your university ID', false)}
                    </>
                  ) : (
                    <>
                      {field('companyName', 'Company name', 'Your registered company name')}
                      {select('industry', 'Industry', BD_INDUSTRIES, 'Select industry')}
                      {field('tradeLicenseNo', 'Trade license number', 'BD trade license', false)}
                      {field('headquartersCity', 'City / district', 'e.g. Dhaka', false)}
                    </>
                  )}
                </div>
              </fieldset>
              {role === 'employer' && (
                <div className="auth-v2-notice auth-v2-warning" style={{ marginBottom: 0 }}>
                  After email verification, your employer account will be reviewed. We will email
                  you when it is approved.
                </div>
              )}
              <button className="public-button" type="submit" disabled={loading}>
                {loading ? (
                  'Creating account…'
                ) : (
                  <>
                    Create account <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>
            <p className="auth-v2-footnote">
              By creating an account, you agree to our <Link href="/terms">Terms of Service</Link>{' '}
              and <Link href="/privacy">Privacy Policy</Link>.
            </p>
          </>
        )
      )}
    </AuthShell>
  );
}
