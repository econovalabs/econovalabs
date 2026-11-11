'use strict';
const feedbackForm = document.getElementById('feedback-form');
const feedbackStatus = document.getElementById('feedback-status');
const submitFeedback = document.getElementById('submit-feedback');
const ratingHelp = document.getElementById('rating-help');
let pendingFeedbackId = null;
feedbackForm.addEventListener('input', () => { pendingFeedbackId = null; });
document.getElementById('feedback-button').addEventListener('click', () => {
  setTimeout(() => document.getElementById('feedback-name').focus({preventScroll:true}), 150);
});
function updateStars() {
  const selected = Number(feedbackForm.querySelector('input[name=rating]:checked')?.value || 0);
  feedbackForm.querySelectorAll('.rating-option').forEach(label => label.classList.toggle('filled', Number(label.querySelector('input').value) <= selected));
  ratingHelp.textContent = selected ? selected + ' out of 5 stars' : 'Select a rating';
}
feedbackForm.querySelectorAll('input[name=rating]').forEach(input => input.addEventListener('change', updateStars));
feedbackForm.addEventListener('submit', async event => {
  event.preventDefault();
  if (feedbackForm.getAttribute('aria-busy') === 'true' || !feedbackForm.reportValidity()) return;
  feedbackStatus.className = 'feedback-status';
  if (!window.econovaDb) { feedbackStatus.textContent = 'Feedback is temporarily unavailable. Please check back shortly.'; feedbackStatus.classList.add('error'); return; }
  const values = new FormData(feedbackForm);
  const payload = { name: String(values.get('name') || '').trim(), email: String(values.get('email') || '').trim(), rating: Number(values.get('rating')), comments: String(values.get('comments') || '').trim(), consent: values.get('consent') === 'on', website: String(values.get('website') || '') };
  if (payload.name.length < 2 || payload.comments.length < 5) { feedbackStatus.textContent = 'Please enter your full name and at least 5 characters of suggestions/details.'; feedbackStatus.classList.add('error'); return; }
  submitFeedback.disabled = true; feedbackForm.setAttribute('aria-busy','true'); submitFeedback.textContent = 'Saving your feedback…'; feedbackStatus.textContent = 'Sending your response securely…';
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    pendingFeedbackId ||= crypto.randomUUID();
    const {data, error} = await window.econovaDb.rpc('econova_submit_feedback', {
      p_id: pendingFeedbackId, p_name: payload.name, p_email: payload.email,
      p_rating: payload.rating, p_comments: payload.comments,
      p_consent: payload.consent, p_website: payload.website
    }).abortSignal(controller.signal);
    if (error) throw Error(['P0001', '22023'].includes(error.code) ? error.message : 'Your feedback could not be saved. Please try again shortly.');
    if (!data.id) throw Error('We could not confirm that your feedback was saved. Please try again shortly.');
    feedbackForm.reset(); pendingFeedbackId = null; updateStars(); feedbackStatus.classList.add('success');
    feedbackStatus.textContent = 'Thank you! Your rating and suggestions have been saved. Your response reference: ' + data.id;
    feedbackStatus.setAttribute('tabindex','-1'); feedbackStatus.focus({preventScroll:true});
  } catch (error) {
    feedbackStatus.classList.add('error');
    feedbackStatus.textContent = controller.signal.aborted ? 'The connection timed out before we could confirm saving. Your entries are still here; please try again later.' : error.message || 'Unable to connect. Your entries are still here; please try again.';
  } finally { clearTimeout(timeout); submitFeedback.disabled = false; feedbackForm.removeAttribute('aria-busy'); submitFeedback.textContent = 'Submit feedback ↗'; }
});
