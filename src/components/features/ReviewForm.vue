<template>
  <div class="review-form">
    <h4>{{ t('reviewForm.title') }}</h4>
    <form @submit.prevent="submitReview">
      <!-- Rating Input -->
      <div class="form-group rating-group">
        <label>{{ t('reviewForm.ratingLabel') }}</label>
        <div class="star-input">
          <button type="button"
                  v-for="n in 5"
                  :key="`rate-${n}`"
                  @click="setRating(n)"
                  class="star-button"
                  :class="{ filled: n <= formData.rating, hovered: n <= hoverRating }"
                  @mouseover="hoverRating = n"
                  @mouseleave="hoverRating = 0"
                  :aria-label="t('reviewForm.rateAriaLabel', { n: n })">
            <font-awesome-icon :icon="n <= (hoverRating || formData.rating) ? ['fas', 'star'] : ['far', 'star']" />
          </button>
        </div>
      </div>

      <!-- Title Input (Optional) -->
      <div class="form-group">
        <label for="review-title">{{ t('reviewForm.reviewTitleLabel') }}</label>
        <input type="text" id="review-title" v-model="formData.title" :placeholder="t('reviewForm.reviewTitlePlaceholder')" maxlength="100" class="enhanced-input">
      </div>

      <!-- Body Textarea -->
      <div class="form-group">
        <label for="review-body">{{ t('reviewForm.reviewBodyLabel') }}</label>
        <textarea id="review-body" v-model="formData.body" required :placeholder="t('reviewForm.reviewBodyPlaceholder')" rows="5" maxlength="2000" class="enhanced-textarea"></textarea>
      </div>

      <!-- Error Message -->
      <p v-if="error" class="error-message">{{ error }}</p> <!-- Keep backend/validation error as is, but translate the static parts -->
      <!-- Submit Button -->
      <button type="submit" class="button enhanced-button primary" :disabled="isSubmitting || formData.rating === 0">
        <font-awesome-icon icon="spinner" spin v-if="isSubmitting" />
        {{ isSubmitting ? t('reviewForm.submittingButton') : t('reviewForm.submitButton') }}
      </button>
    </form>
  </div>
</template>

<script setup>
  import { ref } from 'vue';
  import { useI18n } from 'vue-i18n'; // Import useI18n
  import reviewService from '@/services/reviewService';
  // FontAwesomeIcon imported globally

  // --- Get translation function ---
  const { t } = useI18n();

  const props = defineProps({
    productId: {
      type: String,
      required: true
    }
  });

  const emit = defineEmits(['review-submitted']);

  const formData = ref({
    rating: 0,
    title: '',
    body: ''
  });
  const hoverRating = ref(0);
  const isSubmitting = ref(false);
  const error = ref(null); // This will hold backend errors or translated frontend errors

  const setRating = (rating) => {
    formData.value.rating = rating;
  };

  const submitReview = async () => {
    // Use translated validation error
    if (formData.value.rating === 0 || !formData.value.body) {
      error.value = t('reviewForm.validationError');
      return;
    }
    isSubmitting.value = true;
    error.value = null;

    try {
      const newReview = await reviewService.submitReview(props.productId, {
        rating: formData.value.rating,
        title: formData.value.title || undefined,
        body: formData.value.body
      });
      console.log("Review submitted:", newReview);
      emit('review-submitted', newReview);

      formData.value = { rating: 0, title: '', body: '' };

    } catch (err) {
      console.error("Review submission error:", err);
      // Keep specific backend error if available, otherwise use generic translated error
      error.value = err.message || t('reviewForm.submitError');
    } finally {
      isSubmitting.value = false;
    }
  };
</script>

<style scoped>
  /* Styles remain the same */
  .review-form {
    background-color: var(--bg-off-light);
    padding: 1.5rem;
    border-radius: var(--border-radius);
    border: 1px solid var(--border-color);
  }

    .review-form h4 {
      margin-top: 0;
      margin-bottom: 1.5rem;
      font-size: 1.2rem;
      color: var(--text-dark);
    }

  .form-group {
    margin-bottom: 1.2rem;
  }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      font-size: 0.9rem;
    }

  .enhanced-input, .enhanced-textarea {
    width: 100%;
    padding: 0.7rem 0.9rem;
    border: 1px solid var(--border-color);
    border-radius: var(--border-radius-small);
    font-size: 0.9rem;
    font-family: var(--font-body);
    background-color: var(--white);
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  }

  .enhanced-textarea {
    resize: vertical;
    line-height: 1.5;
  }

    .enhanced-input:focus, .enhanced-textarea:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 2px var(--glow-primary);
    }

  .rating-group label {
    margin-bottom: 0.75rem;
  }

  .star-input {
    display: flex;
    gap: 0.3rem;
  }

  .star-button {
    background: none;
    border: none;
    padding: 0;
    font-size: 1.5rem;
    color: #e0e0e0;
    cursor: pointer;
    transition: color 0.2s ease, transform 0.2s ease;
  }

    .star-button:hover, .star-button.hovered {
      color: #ffd970;
      transform: scale(1.1);
    }

    .star-button.filled {
      color: var(--accent);
    }

  .error-message {
    color: var(--secondary);
    font-size: 0.85rem;
    margin-bottom: 1rem;
  }

  .button.primary {
  }

  .button:disabled {
  }
</style>
