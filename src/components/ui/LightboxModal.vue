// src/components/ui/LightboxModal.vue
<template>
  <transition name="lightbox-fade">
    <div v-if="isActive"
         id="lightbox-overlay"
         class="lightbox-overlay active"
         @click.self="closeModal"
         @keydown.esc="closeModal"
         tabindex="-1"
         ref="overlayRef">
      <div id="lightbox-content" class="lightbox-content" role="dialog" aria-modal="true" aria-labelledby="lightbox-title">
        <!-- Close Button -->
        <button class="lightbox-close-btn" @click="closeModal" :aria-label="t('lightbox.closeAriaLabel')">×</button>

        <!-- Image Display Area -->
        <div class="lightbox-image-container">
          <!-- Use a unique key for transition on image change -->
          <transition :name="transitionName" mode="out-in">
            <!-- Alt text still comes from prop -->
            <img :key="currentImageSrc" :src="currentImageSrc" :alt="imageAltText" class="lightbox-image" ref="lightboxImageRef">
          </transition>

          <!-- Title/Label (Optional but good for context) -->
          <div id="lightbox-title" class="lightbox-image-label sr-only">
            {{ t('lightbox.imageLabel', { current: currentInternalIndex + 1, total: images.length }) }}
          </div>

          <!-- Navigation Buttons (only if multiple images) -->
          <button v-if="images.length > 1"
                  class="lightbox-nav-btn prev"
                  @click="prevImage"
                  :aria-label="t('lightbox.previousAriaLabel')">
            <font-awesome-icon icon="chevron-left" />
          </button>
          <button v-if="images.length > 1"
                  class="lightbox-nav-btn next"
                  @click="nextImage"
                  :aria-label="t('lightbox.nextAriaLabel')">
            <font-awesome-icon icon="chevron-right" />
          </button>
        </div>

        <!-- Optional: Thumbnails within lightbox (can be complex, skipping for now) -->
      </div>
    </div>
  </transition>
</template>

<script setup>
  import { ref, computed, watch, nextTick, onUnmounted } from 'vue';
  import { useI18n } from 'vue-i18n'; // Import useI18n
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

  // --- Get translation function ---
  const { t } = useI18n();

  const props = defineProps({
    images: {
      type: Array,
      required: true,
      default: () => []
    },
    startIndex: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      required: true
    },
    imageAltText: {
      type: String,
      // Keep the English default here, parent should pass translated alt text if needed
      default: 'Enlarged product image'
      // Or, if you want the default to use i18n (might be slightly less performant):
      // default: () => t('lightbox.defaultAltText') // Requires t to be available at prop definition time
    }
  });

  const emit = defineEmits(['close']);

  const currentInternalIndex = ref(0);
  const transitionName = ref('lightbox-slide-next');
  const overlayRef = ref(null);
  const lightboxImageRef = ref(null);

  // --- Watchers and Methods remain the same ---
  watch(() => props.isActive, async (newValue) => {
    if (newValue) {
      currentInternalIndex.value = props.startIndex >= 0 && props.startIndex < props.images.length ? props.startIndex : 0;
      window.addEventListener('keydown', handleKeydown);
      await nextTick();
      overlayRef.value?.focus();
    } else {
      window.removeEventListener('keydown', handleKeydown);
    }
  });

  const currentImageSrc = computed(() => {
    return props.images[currentInternalIndex.value] || '';
  });

  const closeModal = () => { emit('close'); };
  const nextImage = () => { if (props.images.length <= 1) return; transitionName.value = 'lightbox-slide-next'; currentInternalIndex.value = (currentInternalIndex.value + 1) % props.images.length; };
  const prevImage = () => { if (props.images.length <= 1) return; transitionName.value = 'lightbox-slide-prev'; currentInternalIndex.value = (currentInternalIndex.value - 1 + props.images.length) % props.images.length; };
  const handleKeydown = (event) => { if (!props.isActive) return; switch (event.key) { case 'Escape': closeModal(); break; case 'ArrowRight': nextImage(); break; case 'ArrowLeft': prevImage(); break; } };
  onUnmounted(() => { window.removeEventListener('keydown', handleKeydown); });

</script>
