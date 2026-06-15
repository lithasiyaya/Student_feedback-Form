import { useState } from 'react'
import StarRating from './StarRating'
import StatusMessage from './StatusMessage'
import './FeedbackForm.css'

const INITIAL_FORM = {
  studentName: '',
  email: '',
  courseName: '',
  rating: 0,
  message: '',
}

const INITIAL_ERRORS = {
  studentName: '',
  email: '',
  courseName: '',
  rating: '',
  message: '',
}

// Mirrors the n8n Code-node validation exactly:
// 1. Presence checks for name & message
// 2. Email format: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// 3. Course & rating are form-only extra checks
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(fields) {
  const errors = { ...INITIAL_ERRORS }
  let valid = true

  // ── Rule 1: Name is required (matches n8n: !item.name || item.name.trim() === '')
  if (!fields.studentName || fields.studentName.trim() === '') {
    errors.studentName = 'Name is required.'
    valid = false
  }

  // ── Rule 2: Email must match the regex (matches n8n email check exactly)
  if (!fields.email || !emailRegex.test(fields.email)) {
    errors.email = 'A valid email address is required.'
    valid = false
  }

  // ── Extra: course name (form-only, not in n8n)
  if (!fields.courseName.trim()) {
    errors.courseName = 'Course name is required.'
    valid = false
  }

  // ── Extra: star rating (form-only, not in n8n)
  if (!fields.rating || fields.rating < 1) {
    errors.rating = 'Please select a rating from 1 to 5.'
    valid = false
  }

  // ── Rule 3: Message is required (matches n8n: !item.message || item.message.trim() === '')
  if (!fields.message || fields.message.trim() === '') {
    errors.message = 'Message cannot be empty.'
    valid = false
  }

  return { errors, valid }
}

export default function FeedbackForm() {
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState(INITIAL_ERRORS)
  const [touched, setTouched] = useState({})
  const [status, setStatus] = useState(null) // null | 'loading' | 'success' | 'error'
  const [statusMessage, setStatusMessage] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))

    // Live re-validate touched fields
    if (touched[name]) {
      const { errors: newErrors } = validate({ ...form, [name]: value })
      setErrors((prev) => ({ ...prev, [name]: newErrors[name] }))
    }
  }

  const handleRating = (value) => {
    setForm((prev) => ({ ...prev, rating: value }))
    if (touched.rating) {
      const { errors: newErrors } = validate({ ...form, rating: value })
      setErrors((prev) => ({ ...prev, rating: newErrors.rating }))
    }
  }

  const handleBlur = (e) => {
    const { name } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))
    const { errors: newErrors } = validate(form)
    setErrors((prev) => ({ ...prev, [name]: newErrors[name] }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Mark all fields as touched
    setTouched({ studentName: true, email: true, courseName: true, rating: true, message: true })

    const { errors: newErrors, valid } = validate(form)
    setErrors(newErrors)

    if (!valid) return

    setStatus('loading')
    setStatusMessage('')

    try {
      // Payload matches n8n Code-node field names exactly.
      // Data is pre-formatted here the same way n8n does it on success:
      //   name  → trimmed
      //   email → lowercased + trimmed
      //   message → trimmed
      //   submittedAt → ISO timestamp (added automatically, same as n8n)
      const payload = {
        name: form.studentName.trim(),
        email: form.email.toLowerCase().trim(),
        courseName: form.courseName.trim(),
        rating: form.rating,
        message: form.message.trim(),
        submittedAt: new Date().toISOString(),
      }

      let response
      try {
        response = await fetch(
          'https://lithasiyaya.app.n8n.cloud/webhook-test/d771e5c5-c7ad-475f-860c-d2ffcb5159e3',
          {
            method: 'POST',
            // application/json triggers a CORS preflight — use no-cors as fallback
            headers: { 'Content-Type': 'application/json' },
            mode: 'cors',
            body: JSON.stringify(payload),
          }
        )
      } catch (networkErr) {
        // Likely CORS or network-level failure
        throw new Error(
          'Could not reach the server. Make sure your n8n workflow is active and listening, then try again.'
        )
      }

      // n8n webhook-test returns plain 200 with no body when the workflow isn't
      // listening — treat that as "workflow not active" rather than success.
      const text = await response.text().catch(() => '')
      let data = {}
      try { data = JSON.parse(text) } catch { /* non-JSON response is fine */ }

      if (!response.ok) {
        throw new Error(data.message || `Submission failed (status ${response.status}).`)
      }

      // If n8n echoes back isValid:false from the Code node
      if (data.isValid === false) {
        throw new Error(data.errors || 'Validation failed on the server.')
      }

      setStatus('success')
      setStatusMessage(
        `Thank you, ${form.studentName.trim()}! Your feedback for "${form.courseName.trim()}" has been submitted successfully.`
      )
      setForm(INITIAL_FORM)
      setErrors(INITIAL_ERRORS)
      setTouched({})
    } catch (err) {
      setStatus('error')
      setStatusMessage(err.message || 'Something went wrong. Please try again.')
    }
  }

  const handleDismiss = () => {
    setStatus(null)
    setStatusMessage('')
  }

  return (
    <div className="feedback-wrapper">
      <div className="feedback-card">
        {/* Header */}
        <div className="feedback-header">
          <div className="header-icon" aria-hidden="true">💬</div>
          <h1 className="feedback-title">Student Feedback</h1>
          <p className="feedback-subtitle">Help us improve your learning experience</p>
        </div>

        {/* Status Message */}
        {status && status !== 'loading' && (
          <StatusMessage type={status} message={statusMessage} onDismiss={handleDismiss} />
        )}

        {/* Form */}
        <form className="feedback-form" onSubmit={handleSubmit} noValidate>

          {/* Row: Name + Email */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="studentName" className="form-label">
                Student Name <span className="required" aria-hidden="true">*</span>
              </label>
              <input
                id="studentName"
                name="studentName"
                type="text"
                className={`form-input ${errors.studentName && touched.studentName ? 'input-error' : ''}`}
                placeholder="e.g. Jane Smith"
                value={form.studentName}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-describedby={errors.studentName && touched.studentName ? 'studentName-error' : undefined}
                aria-invalid={!!(errors.studentName && touched.studentName)}
                disabled={status === 'loading'}
              />
              {errors.studentName && touched.studentName && (
                <span id="studentName-error" className="field-error" role="alert">{errors.studentName}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address <span className="required" aria-hidden="true">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className={`form-input ${errors.email && touched.email ? 'input-error' : ''}`}
                placeholder="e.g. jane@example.com"
                value={form.email}
                onChange={handleChange}
                onBlur={handleBlur}
                aria-describedby={errors.email && touched.email ? 'email-error' : undefined}
                aria-invalid={!!(errors.email && touched.email)}
                disabled={status === 'loading'}
              />
              {errors.email && touched.email && (
                <span id="email-error" className="field-error" role="alert">{errors.email}</span>
              )}
            </div>
          </div>

          {/* Course Name */}
          <div className="form-group">
            <label htmlFor="courseName" className="form-label">
              Course Name <span className="required" aria-hidden="true">*</span>
            </label>
            <input
              id="courseName"
              name="courseName"
              type="text"
              className={`form-input ${errors.courseName && touched.courseName ? 'input-error' : ''}`}
              placeholder="e.g. Introduction to Web Development"
              value={form.courseName}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-describedby={errors.courseName && touched.courseName ? 'courseName-error' : undefined}
              aria-invalid={!!(errors.courseName && touched.courseName)}
              disabled={status === 'loading'}
            />
            {errors.courseName && touched.courseName && (
              <span id="courseName-error" className="field-error" role="alert">{errors.courseName}</span>
            )}
          </div>

          {/* Rating */}
          <div className="form-group">
            <label className="form-label">
              Rating <span className="required" aria-hidden="true">*</span>
            </label>
            <StarRating
              value={form.rating}
              onChange={handleRating}
              disabled={status === 'loading'}
            />
            {errors.rating && touched.rating && (
              <span id="rating-error" className="field-error" role="alert">{errors.rating}</span>
            )}
          </div>

          {/* Feedback Message */}
          <div className="form-group">
            <label htmlFor="message" className="form-label">
              Feedback Message <span className="required" aria-hidden="true">*</span>
            </label>
            <textarea
              id="message"
              name="message"
              rows={5}
              className={`form-input form-textarea ${errors.message && touched.message ? 'input-error' : ''}`}
              placeholder="Share your thoughts about the course, instructor, or learning experience..."
              value={form.message}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-describedby={errors.message && touched.message ? 'message-error' : undefined}
              aria-invalid={!!(errors.message && touched.message)}
              disabled={status === 'loading'}
            />
            <div className="char-count">{form.message.length} characters</div>
            {errors.message && touched.message && (
              <span id="message-error" className="field-error" role="alert">{errors.message}</span>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className={`submit-btn ${status === 'loading' ? 'submit-btn--loading' : ''}`}
            disabled={status === 'loading'}
            aria-busy={status === 'loading'}
          >
            {status === 'loading' ? (
              <>
                <span className="spinner" aria-hidden="true"></span>
                Submitting…
              </>
            ) : (
              <>
                <span aria-hidden="true">✉️</span> Submit Feedback
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
